// Neon GTM Command WALL — backend
// Serves the demo (index.html) AND a secure /api/score endpoint that calls an LLM.
// The API key lives ONLY here as a server-side env var — never in the page.
//
// Uses xAI Grok (OpenAI-compatible REST API). The GTM engine is LLM-agnostic:
// swap the base URL / model to run on any provider (Claude in production).
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serves index.html and assets

const XAI_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
const XAI_BASE_URL = process.env.XAI_BASE_URL || "https://api.x.ai/v1";
const XAI_MODEL = process.env.XAI_MODEL || "grok-3-mini"; // cheap by design; override via env if unavailable

const SYSTEM = `You are Neon AI's GTM lead-scoring engine.
ICP: UK SMB / mid-market (5-50 staff), founder-led, running Xero/Sage/QuickBooks/Tally, showing a pain signal.
Score the company for fit with Neon's three revenue streams and draft one grounded first-touch outreach message.
Routing rules: high icp+intent -> workshop; accounting-tool match + finance/KPI pain -> finance_wall; multi-site/complex ops -> operation_wall; clear automation need -> si_managed; weak fit -> nurture.
The outreach must be British, direct, founder-to-founder, no hype, max 80 words, name the specific signal, and make one clear offer matched to the routed stream. Never invent facts not in the input.
Respond with ONLY a JSON object, no markdown, with exactly these keys:
{"icp_score": <int 0-100>, "intent_score": <int 0-100>, "routed_stream": "workshop|finance_wall|operation_wall|si_managed|nurture", "reason": "<one sentence>", "outreach": "<the message>"}`;

app.post("/api/score", async (req, res) => {
  const company = (req.body?.company || "").toString().slice(0, 200).trim();
  const signal = (req.body?.signal || "").toString().slice(0, 500).trim();
  if (!company) return res.status(400).json({ error: "company is required" });
  if (!XAI_API_KEY) return res.status(500).json({ error: "XAI_API_KEY not set on the server" });

  try {
    const r = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Company: ${company}\nSignal: ${signal || "(none provided)"}` },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("xAI error:", r.status, detail.slice(0, 300));
      return res.status(502).json({ error: `LLM API ${r.status}: ${detail.slice(0, 160)}` });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (e) {
    console.error("score error:", e.message);
    res.status(500).json({ error: e.message || "scoring failed" });
  }
});

app.get("/healthz", (_req, res) =>
  res.json({ ok: true, keySet: !!XAI_API_KEY, model: XAI_MODEL })
);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Neon GTM Command WALL live on :${port} (model: ${XAI_MODEL})`));
