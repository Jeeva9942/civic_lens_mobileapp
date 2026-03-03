import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Supabase Connection
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ SUPABASE_URL or SUPABASE_KEY is not defined in environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FLOW_SID = process.env.TWILIO_FLOW_SID || "";
const TWILIO_FROM = process.env.TWILIO_FROM || "";

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Google Gemini Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// In-memory conversation history
const chatHistories: Record<string, any[]> = {};



// API Routes

// Fetch all civic issues
app.get('/api/civic', async (req, res) => {
    try {
        const { data: items, error } = await supabase
            .from('civic')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch civic items' });
    }
});

// Create a new civic issue
app.post('/api/civic', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('civic')
            .insert([req.body])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Failed to create civic item' });
    }
});

// Get a single civic issue
app.get('/api/civic/:id', async (req, res) => {
    try {
        const { data: item, error } = await supabase
            .from('civic')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a civic issue
app.put('/api/civic/:id', async (req, res) => {
    try {
        const { data: updatedItem, error } = await supabase
            .from('civic')
            .update(req.body)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        if (!updatedItem || updatedItem.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(updatedItem[0]);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Failed to update civic item' });
    }
});

// Delete a civic issue
app.delete('/api/civic/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('civic')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete civic item' });
    }
});

// Intelligent Issue Processing
import { formatDistanceToNow } from 'date-fns';

app.post('/api/process-issue', (req, res) => {
    const { title, description, location, status = "reported" } = req.body;

    // 1. Generate logical and realistic timestamp using system time
    // 2. Accurate ISO format
    const now = new Date();
    const createdAt = now.toISOString();

    // 3. Generate human-readable "time ago"
    // 4. Logically calculated difference
    const timeAgo = formatDistanceToNow(now, { addSuffix: true });

    // 5. Return clean structured JSON as requested
    res.json({
        title: title || "",
        description: description || "",
        location: location || "",
        status: status,
        createdAt: createdAt,
        timeAgo: timeAgo
    });
});

// Trigger Twilio Studio Flow for Alerts
app.post('/api/trigger-alert', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        console.log(`🔔 Triggering Flow for: ${phoneNumber}`);
        const execution = await twilioClient.studio.v2
            .flows(TWILIO_FLOW_SID)
            .executions
            .create({
                to: phoneNumber,
                from: TWILIO_FROM
            });

        console.log("✅ Flow triggered successfully! SID:", execution.sid);

        // Also create an in-app notification about this alert
        await supabase
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

        // Keep history manageable
        if (chatHistories[sessionId].length > 20) {
            chatHistories[sessionId] = chatHistories[sessionId].slice(-20);
        }

        res.json({ output: text });

    } catch (error: any) {
        console.error("❌ Gemini Error:", error.message);
        res.status(500).json({ error: "Civic Assistant is currently offline.", details: error.message });
    }
});


// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
