import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

// Chat Route — n8n Webhook
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = "user123" } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://jeevan8n.app.n8n.cloud/webhook/42a2b362-592d-408a-a07c-c838a381756f/chat";

        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chatInput: message,
                sessionId: sessionId,
            }),
        });

        if (!response.ok) {
            throw new Error(`n8n Webhook failed with status ${response.status}`);
        }

        const rawText = await response.text();

        // 🔥 Split streaming lines
        const lines = rawText
            .split("\n")
            .filter((line) => line.trim() !== "");

        let fullMessage = "";

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);

                if (parsed.type === "item" && parsed.content) {
                    fullMessage += parsed.content;
                }
            } catch (e) {
                // Ignore non-JSON lines
            }
        }

        if (!fullMessage) {
            // Fallback for non-streaming response or different format
            try {
                const parsed = JSON.parse(rawText);
                fullMessage = parsed.output || parsed.message || rawText;
            } catch (e) {
                fullMessage = rawText;
            }
        }

        res.json({ output: fullMessage });
    } catch (err) {
        console.error("Chatbot Error:", err);
        res.status(500).json({ error: 'Failed to communicate with AI' });
    }
});

app.get('/', (req, res) => {
    res.send('Civic Lens API is running');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
