import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';

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

// --- DIRECT ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        supabase_configured: !!process.env.SUPABASE_URL,
        using_wrong_key_format: (process.env.SUPABASE_KEY || '').includes('sb_secret')
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

// Chat Route
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = "user123" } = req.body;
        const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

        if (!WEBHOOK_URL) throw new Error('N8N_WEBHOOK_URL is not set.');

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatInput: message, sessionId }),
        });

        if (!response.ok) throw new Error(`AI Webhook Failed (${response.status})`);

        const rawText = await response.text();
        const lines = rawText.split("\n").filter(l => l.trim() !== "");

        let fullMessage = "";
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.type === "item" && parsed.content) fullMessage += parsed.content;
            } catch (e) { }
        }

        if (!fullMessage) {
            try {
                const parsed = JSON.parse(rawText);
                fullMessage = parsed.output || parsed.message || rawText;
            } catch (k) {
                fullMessage = rawText;
            }
        }

        res.json({ output: fullMessage });
    } catch (err: any) {
        res.status(500).json({ error: 'AI Error', detail: err.message });
    }
});

// Default
app.get('/api', (req, res) => res.json({ message: 'Civic API' }));

export default app;
