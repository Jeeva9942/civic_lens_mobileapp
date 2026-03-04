import dotenv from 'dotenv';
dotenv.config();

async function testN8n() {
    const url = process.env.N8N_WEBHOOK_URL;

    if (!url) {
        console.error("❌ N8N_WEBHOOK_URL is not defined in .env");
        return;
    }

    console.log(`Testing n8n at: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatInput: "What is Civic Lens?",
                sessionId: "test"
            })
        });

        console.log(`Status: ${response.status}`);
        const rawText = await response.text();
        console.log(`Body length: ${rawText.length}`);

        // Handle concatenated JSON (n8n stream format)
        try {
            const jsonStrings = rawText.split(/\}\n?\{/);
            let aggregatedContent = "";

            jsonStrings.forEach((s, i, arr) => {
                try {
                    let str = s;
                    if (i > 0) str = '{' + str;
                    if (i < arr.length - 1) str = str + '}';
                    const obj = JSON.parse(str);

                    if (obj.type === 'item' && obj.content) {
                        aggregatedContent += obj.content;
                    } else if (obj.output || obj.text) {
                        aggregatedContent = obj.output || obj.text;
                    }
                } catch (internalErr) {
                    // Ignore partial chunk errors
                }
            });

            if (aggregatedContent) {
                console.log("✅ Aggregated Content:", aggregatedContent);
            } else {
                console.log("❌ No content found in stream pieces.");
            }
        } catch (e: any) {
            console.error("❌ Stream parse failed:", e.message);
        }
    } catch (err: any) {
        console.error("❌ Fetch failed:", err.message);
    }
}

testN8n();
