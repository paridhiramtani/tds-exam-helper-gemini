import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_MODEL = process.env.MODEL || "gemini-1.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in environment variables");
  process.exit(1);
}

/* ============================================================
   🧠 SYSTEM PROMPT — Expert TDS Exam Helper (Gemini Version)
============================================================ */
const SYSTEM_PROMPT = `
You are a world-class **Tools and Data Science (TDS)** expert.
Provide accurate, verified, and runnable answers.

Your expertise covers:
- VS Code, Bash, Git, curl, Postman, Docker, DevContainers
- DuckDB, SQLite, dbt, Datasette, Excel, Google Sheets
- JSON, Markdown, Unicode, Base64
- FastAPI, REST APIs, HuggingFace, Vercel, GitHub Actions
- Python, Bash, SQL, AI & LLM workflows, embeddings, RAG, Ollama

Follow this output format:
Quick context: (1 sentence)
**FINAL ANSWER:** (full working code/command/config)
Confidence: [High/Medium/Low]
`;

/* ============================================================
   🧩 Gemini API call
============================================================ */
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("❌ Gemini API error:", err);
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text.";
  return text;
}

/* ============================================================
   🚀 Express Routes
============================================================ */
app.get("/", (_, res) => res.send("✅ TDS Exam Helper API (Gemini) is running"));

app.post("/api/gpt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const result = await callGemini(prompt);
    res.json({ output_text: result });
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   🧩 Start Server
============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Gemini backend running on port ${PORT}`));

