import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import twilio from 'twilio';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Lazily-initialize Supabase with validation
const getSupabase = () => {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_KEY || '';

    if (!url || !key) {
        throw new Error('MISSING_ENV_VARS: SUPABASE_URL and SUPABASE_KEY must be set in Vercel.');
    }

    // CRITICAL: Check if user is using the wrong "Management Account" key
    if (key.includes('sb_secret')) {
        throw new Error('WRONG_KEY_TYPE: You are using the Supabase "Management Secret". You MUST use the "anon" or "service_role" key from Project Settings > API. It starts with "eyJ".');
    }

    return createClient(url, key);
};

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FLOW_SID = process.env.TWILIO_FLOW_SID || "";
const TWILIO_FROM = process.env.TWILIO_FROM || "";

const getTwilioClient = () => {
    return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

// Google Gemini Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// In-memory conversation history (volatile on serverless, but works for single session)
const chatHistories: Record<string, any[]> = {};

// --- DIRECT ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
    const key = process.env.SUPABASE_KEY || '';
    res.json({
        status: 'ok',
        supabase_url_set: !!process.env.SUPABASE_URL,
        supabase_key_set: !!process.env.SUPABASE_KEY,
        using_wrong_key_format: key.includes('sb_secret'),
        key_preview: key ? `${key.substring(0, 5)}...` : 'not set',
        tip: key.includes('sb_secret')
            ? 'Switch to the "anon" key in Vercel settings. It should start with "eyJ".'
            : 'If everything looks correct, ensure you redeployed after changing variables.'
    });
});

// Fetch all civic issues
app.get('/api/civic', async (req, res) => {
    try {
        const client = getSupabase();
        const { data: items, error } = await client
            .from('civic')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(items || []);
    } catch (err: any) {
        console.error('API Error:', err.message);
        const code = err.message.includes('WRONG_KEY_TYPE') ? 401 : 500;
        res.status(code).json({
            error: 'Database Operation Failed',
            detail: err.message
        });
    }
});

// Fetch all notifications
app.get('/api/notifications', async (req, res) => {
    try {
        const client = getSupabase();
        const { data: items, error } = await client
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(items || []);
    } catch (err: any) {
        console.error('Notification Fetch Error:', err.message);
        res.status(500).json({
            error: 'Notification Fetch Failed',
            detail: err.message
        });
    }
});

// Create a new civic issue
app.post('/api/civic', async (req, res) => {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('civic')
            .insert([req.body])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err: any) {
        res.status(400).json({ error: 'Insert Failed', detail: err.message });
    }
});

// Process Issue
app.post('/api/process-issue', (req, res) => {
    try {
        const { title, description, location } = req.body;
        const now = new Date();
        res.json({
            title: title || "",
            description: description || "",
            location: location || "",
            status: "reported",
            createdAt: now.toISOString(),
            timeAgo: formatDistanceToNow(now, { addSuffix: true })
        });
    } catch (err: any) {
        res.status(500).json({ error: 'Processing Failed', detail: err.message });
    }
});

// Trigger Twilio Studio Flow for Alerts
app.post('/api/trigger-alert', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const client = getSupabase();
        const twilioClient = getTwilioClient();

        console.log(`🔔 Triggering Flow for: ${phoneNumber}`);
        const execution = await twilioClient.studio.v2
            .flows(TWILIO_FLOW_SID)
            .executions
            .create({
                to: phoneNumber,
                from: TWILIO_FROM
            });

        // Also create an in-app notification about this alert
        await client
            .from('notifications')
            .insert([{
                type: 'emergency_alert',
                message: `An emergency priority call has been triggered. Account connected to the number +91 99423 73735.`,
                created_at: new Date().toISOString()
            }]);

        res.json({ success: true, sid: execution.sid });
    } catch (error: any) {
        console.error("❌ Twilio Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Chat Route — Direct Gemini API
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = "user123" } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Initialize history if it doesn't exist
        if (!chatHistories[sessionId]) {
            chatHistories[sessionId] = [];
        }

        const chat = model.startChat({
            history: chatHistories[sessionId],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // Update history
        chatHistories[sessionId].push(
            { role: "user", parts: [{ text: message }] },
            { role: "model", parts: [{ text: text }] }
        );

        if (chatHistories[sessionId].length > 10) {
            chatHistories[sessionId] = chatHistories[sessionId].slice(-10);
        }

        res.json({ output: text });

    } catch (error: any) {
        console.error("❌ Gemini Error:", error.message);
        res.status(500).json({ error: "Assistant currently offline.", details: error.message });
    }
});

// Default
app.get('/api', (req, res) => res.json({ message: 'Civic API' }));

export default app;
