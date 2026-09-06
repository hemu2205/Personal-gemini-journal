import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
// Mount body parser BEFORE any endpoint routes
app.use(express.json({ limit: "2mb" }));

// Fallback ladder as per Production Directive #6
const FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

// Lazy client initialization with clean secret check
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your Gemini API key in the AI Studio Settings or environment variables."
    );
  }
  return new GoogleGenAI({ apiKey });
}

// Resilient Model Fallback Ladder Helper
async function generateContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  history: Array<{ role: string; content: string }>,
  systemInstruction?: string
) {
  let lastError: any = null;

  // Defensive preparation of conversation contents
  const contents = [
    ...(Array.isArray(history) ? history : []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: String(msg.content || "") }],
    })),
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} encountered error:`, err?.message || err);
      lastError = err;
      // Recoverable error status code matrix (503, 429, 404, 500, etc.)
      // Sequentially attempt the next model in the fallback chain
    }
  }

  throw lastError || new Error("All fallback models in the Gemini resilience ladder were exhausted.");
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// API chat/reflection endpoint
app.post("/api/chat", async (req, res) => {
  try {
    // 2. Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const history = Array.isArray(body.history) ? body.history : [];
    const mode = typeof body.mode === "string" ? body.mode : "reflection";

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
        message: "Please provide a valid text prompt or journal entry.",
      });
    }

    // Determine system prompt according to user reflection mode
    let systemInstruction =
      "You are an empathetic, contemplative AI journaling companion and reflection guide. Listen deeply to the user's thoughts and emotions, provide meaningful synthesis, and ask 1-2 insightful, gentle questions to encourage self-discovery.";

    if (mode === "summary") {
      systemInstruction =
        "You are a synthesis specialist. Provide a clear, insightful summary of the user's reflection. Extract 3-4 key themes or emotional takeaways, followed by a concise 2-sentence synthesis of their current mindset.";
    } else if (mode === "brainstorm") {
      systemInstruction =
        "You are a creative brainstorming and ideation partner. Help the user explore innovative angles, productive paths forward, and structured ideas based on what they shared. Be encouraging and structured.";
    } else if (mode === "action") {
      systemInstruction =
        "You are a compassionate action-oriented mentor. Based on the user's journal reflection, suggest 3 gentle, practical, and highly achievable micro-steps they can take today.";
    }

    const ai = getGeminiClient();
    const result = await generateContentWithFallback(ai, prompt, history, systemInstruction);

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    const statusCode = error?.status && typeof error.status === "number" ? error.status : 500;
    return res.status(statusCode).json({
      error: "AI generation failed",
      message: error?.message || "Failed to generate reflection with Gemini. Please try again.",
    });
  }
});

// Start server with Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
