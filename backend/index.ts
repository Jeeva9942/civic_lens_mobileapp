import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

dotenv.config();

const PORT = parseInt(process.env.PORT || "5000", 10);

console.log("🛠️  Backend Environment Check:");
console.log(` - Port: ${PORT}`);
console.log(` - Supabase URL: ${process.env.SUPABASE_URL ? "✅ Loaded" : "❌ Missing"}`);
console.log(` - n8n Webhook: ${process.env.N8N_WEBHOOK_URL ? "✅ Loaded" : "❌ Missing"}`);
console.log(` - Twilio Config: ${process.env.TWILIO_ACCOUNT_SID ? "✅ Loaded" : "❌ Missing"}`);

const app = express();

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
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch civic items' });
    }
});

// Fetch all notifications
app.get('/api/notifications', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error("❌ Notifications Error:", err.message);
        res.status(500).json({ error: 'Failed to fetch notifications' });
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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

// Chat Route — n8n Webhook
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = "user123" } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("❌ Chat Error: N8N_WEBHOOK_URL is missing in .env");
            return res.status(500).json({ error: "Configuration Error", details: "N8N_WEBHOOK_URL not set." });
        }

        console.log(`💬 Chat request: "${message}" -> n8n`);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatInput: message,
                sessionId: sessionId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ n8n responded with error (${response.status}):`, errorText);
            return res.status(response.status).json({
                error: `n8n Error ${response.status}`,
                details: errorText
            });
        }

        const rawText = await response.text();
        console.log("✅ n8n response received, length:", rawText.length);

        // n8n AI Agent often sends a stream of concatenated JSON objects
        const jsonStrings = rawText.split(/\}\n?\{/);
        let aggregatedOutput = "";

        jsonStrings.forEach((s, i, arr) => {
            try {
                let str = s;
                if (i > 0) str = '{' + str;
                if (i < arr.length - 1) str = str + '}';
                const obj = JSON.parse(str);

                if (obj.type === 'item' && obj.content) {
                    aggregatedOutput += obj.content;
                } else if (obj.output || obj.text) {
                    aggregatedOutput = obj.output || obj.text;
                }
            } catch (e: any) {
                // Ignore parsing errors for partial/malformed chunks
            }
        });

        const output = aggregatedOutput || (rawText.length > 0 ? "Processed raw response." : "No response generated.");
        console.log("📝 Aggregated Response:", output.substring(0, 50) + "...");

        res.json({ output });

    } catch (error: any) {
        console.error("❌ Chatbot Route Crash:", error);
        res.status(500).json({
            error: "Assistant currently offline.",
            details: error.message || "Unknown error"
        });
    }
});


// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
