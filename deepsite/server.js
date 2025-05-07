import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { generateContent } from "./utils/gemini.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
const ipAddresses = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.APP_PORT || 3000;
const MAX_REQUESTS_PER_IP = 5;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "dist")));

// New endpoint to list available Gemini models
app.get("/api/models", async (_req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    if (!response.ok) {
      return res.status(response.status).send({ error: "Failed to fetch models" });
    }
    const data = await response.json();
    // Filter models that support generateContent
    const models = data.models.filter(model =>
      model.supportedGenerationMethods.includes("generateContent")
    );
    res.json(models);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post("/api/ask-ai", async (req, res) => {
  const { prompt, html, previousPrompt, model } = req.body;
  if (!prompt) {
    return res.status(400).send({
      ok: false,
      message: "Missing required fields",
    });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    req.ip ||
    "0.0.0.0";

  // Rate limiting
  ipAddresses.set(ip, (ipAddresses.get(ip) || 0) + 1);
  if (ipAddresses.get(ip) > MAX_REQUESTS_PER_IP) {
    return res.status(429).send({
      ok: false,
      message: "Rate limit exceeded. Please try again later.",
    });
  }

  // Set up response headers for streaming
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const response = await generateContent(prompt, previousPrompt, html, model);
    
    // Stream the response
    const chunks = response.split('');
    let completeResponse = '';
    
    for (const chunk of chunks) {
      if (!res.writableEnded) {
        res.write(chunk);
        completeResponse += chunk;

        if (completeResponse.includes("</html>")) {
          break;
        }
      }
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).send({
        ok: false,
        message: error.message || "An error occurred while processing your request.",
      });
    } else {
      res.end();
    }
  }
});

app.get("/api/@me", (_req, res) => {
  res.send({
    preferred_username: "local-use",
    isLocalUse: true,
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
