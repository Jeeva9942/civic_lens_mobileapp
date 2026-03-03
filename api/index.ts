import express, { Router } from 'express';
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
        throw new Error('Supabase URL or Key is missing. Please add them to Vercel Environment Variables.');
    }

    // Safety warning for potential wrong key type
    if (!key.startsWith('eyJ')) {
        console.warn('⚠️ SUPABASE_KEY does not appear to be a JWT. Ensure you are using the "anon" or "service_role" key.');
    }

    return createClient(url, key);
};

const api = Router();

// Health Check
api.get('/health', (req, res) => {
    res.json({
        ok: true,
        env: {
            db: !!process.env.SUPABASE_URL,
            ai: !!process.env.N8N_WEBHOOK_URL
        }
    });
});

// Fetch all civic issues
api.get('/civic', async (req, res) => {
    try {
        const client = getSupabase();
        const { data: items, error } = await client
            .from('civic')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(items || []);
    } catch (err: any) {
        console.error('Database Error:', err);
        res.status(500).json({ error: 'Database Failed', detail: err.message || err });
    }
});

// Create a new civic issue
api.post('/civic', async (req, res) => {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('civic')
            .insert([req.body])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err: any) {
        console.error('Insert Error:', err);
        res.status(400).json({ error: 'Insert Failed', detail: err.message || err });
    }
});

// Restore missing Process Issue route
api.post('/process-issue', (req, res) => {
    try {
        const { title, description, location, status = "reported" } = req.body;
        const now = new Date();
        res.json({
            title: title || "",
            description: description || "",
            location: location || "",
            status: status,
            createdAt: now.toISOString(),
            timeAgo: formatDistanceToNow(now, { addSuffix: true })
        });
    } catch (err: any) {
        res.status(500).json({ error: 'Processing Failed', detail: err.message });
    }
});

// Chat Route
api.post('/chat', async (req, res) => {
    try {
        const { message, sessionId = "user123" } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://jeevan8n.app.n8n.cloud/webhook/42a2b362-592d-408a-a07c-c838a381756f/chat";

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatInput: message, sessionId: sessionId }),
        });

        if (!response.ok) throw new Error(`AI Webhook Status ${response.status}`);

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
        console.error("Chat Error:", err);
        res.status(500).json({ error: 'AI Offline', detail: err.message });
    }
});

// Final Middleware
app.use('/api', api);

// Support for local backend folder (if users hits root /api)
app.get('/api', (req, res) => res.json({ message: 'Civic API is running' }));

export default app;
