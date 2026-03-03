import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// In-memory session history store for Gemini
const sessionHistory: Record<string, Array<{ role: string; parts: { text: string }[] }>> = {};

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

// Chat Route — Gemini 2.0 Flash
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = "user_default" } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        // Maintain per-session history
        if (!sessionHistory[sessionId]) {
            sessionHistory[sessionId] = [];
        }

        // Append user message to history
        sessionHistory[sessionId].push({
            role: "user",
            parts: [{ text: message }]
        });

        const payload = {
            system_instruction: {
                parts: [{
                    text: "You are CivicAssistant, a helpful AI assistant for the Civic Lens app. Help citizens report civic issues, track repairs, understand local government services, and answer questions about community problems like potholes, drainage, streetlights, flooding, and more. Be concise and helpful."
                }]
            },
            contents: sessionHistory[sessionId]
        };

        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API error:", errText);
            return res.status(response.status).json({ error: "Gemini API request failed" });
        }

        const data = await response.json();
        const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

        // Append bot reply to session history
        sessionHistory[sessionId].push({
            role: "model",
            parts: [{ text: botReply }]
        });

        // Trim history to prevent token overflow
        if (sessionHistory[sessionId].length > 20) {
            sessionHistory[sessionId] = sessionHistory[sessionId].slice(-20);
        }

        res.json({ output: botReply });
    } catch (err) {
        console.error("Chatbot Error:", err);
        res.status(500).json({ error: 'Failed to communicate with Gemini AI' });
    }
});

app.get('/', (req, res) => {
    res.send('Civic Lens API is running');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
