import express, { Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';

dotenv.config();

const app = express();
const apiRouter = Router();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Supabase Connection Safety Guard
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️ Missing Supabase credentials. API will return errors until configured in Vercel.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- API ROUTES (with /api prefix handled by router) ---

// Test Route
apiRouter.get('/test', (req, res) => {
    res.json({ message: 'API is healthy', time: new Date().toISOString() });
});

// Fetch all civic issues
apiRouter.get('/civic', async (req, res) => {
    try {
        if (!SUPABASE_URL) throw new Error('Supabase URL not configured');
        const { data: items, error } = await supabase
            .from('civic')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(items || []);
    } catch (err: any) {
        console.error('Fetch Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch civic items', detail: err.message });
    }
});

// Create a new civic issue
apiRouter.post('/civic', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('civic')
            .insert([req.body])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (err: any) {
        console.error('Create Error:', err.message);
        res.status(400).json({ error: 'Failed to create civic item', detail: err.message });
    }
});

// Intelligent Issue Processing
apiRouter.post('/process-issue', (req, res) => {
    try {
        const { title, description, location, status = "reported" } = req.body;
        const now = new Date();
        const createdAt = now.toISOString();
        const timeAgo = formatDistanceToNow(now, { addSuffix: true });

        res.json({
            title: title || "",
            description: description || "",
            location: location || "",
            status: status,
            createdAt: createdAt,
            timeAgo: timeAgo
        });
    } catch (err: any) {
        res.status(500).json({ error: 'Processing error', detail: err.message });
    }
});

// Chat Route — n8n Webhook
apiRouter.post('/chat', async (req, res) => {
    try {
        const { message, sessionId = "user123" } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://jeevan8n.app.n8n.cloud/webhook/42a2b362-592d-408a-a07c-c838a381756f/chat";

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatInput: message, sessionId: sessionId }),
        });

        if (!response.ok) throw new Error(`n8n failed: ${response.status}`);

        const rawText = await response.text();
        const lines = rawText.split("\n").filter((line) => line.trim() !== "");

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
            } catch (e) {
                fullMessage = rawText;
            }
        }

        res.json({ output: fullMessage });
    } catch (err: any) {
        console.error("Chatbot Error:", err.message);
        res.status(500).json({ error: 'Failed to communicate with AI', detail: err.message });
    }
});

// Apply the router to the app with /api prefix
app.use('/api', apiRouter);

// Fallback for non-API routes
app.get('*', (req, res) => {
    res.status(404).send('Civic Lens API Route Not Found');
});

export default app;
