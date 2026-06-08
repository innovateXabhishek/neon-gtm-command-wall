// Neon GTM Command WALL — backend
// Serves the demo (index.html) AND a secure /api/score endpoint that calls an LLM.
// The API key lives ONLY here as a server-side env var — never in the page or the repo.
//
// Uses Groq (OpenAI-compatible REST API, fast open models). The GTM engine is
// LLM-agnostic: swap base URL / model / key to run on any provider (Claude in prod).
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serves index.html and assets

const LLM_API_KEY = process.env.GROQ_API_KEY || process.env.LLM_API_KEY || "";
const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
const LLM_MODEL = process.env.LLM_MODEL || "llama-3.3-70b-versatile"; // override via env if unavailable

const SYSTEM = `You are Neon AI's GTM lead-scoring engine.
ICP: UK SMB / mid-market (5-50 staff), founder-led, running Xero/Sage/QuickBooks/Tally, showing a pain signal.
Score the company for fit with Neon's three revenue streams and draft one grounded first-touch outreach message.
Routing rules: high icp+intent -> workshop; accounting-tool match + finance/KPI pain -> finance_wall; multi-site/complex ops -> operation_wall; clear automation need -> si_managed; weak fit -> nurture.
The concrete offer for each stream (reference the matching one in the outreach):
- workshop: a 5-hour founder-led workshop (£750 online / £1,000 on-site) where we map where their finance & ops workflows leak time — they leave with 3 automations they can ship that week.
- finance_wall: Finance WALL — 14 live KPIs plugged straight into their accounting tool, deployed in 2 weeks, £2,000 + £350/mo.
- operation_wall: Operation WALL — their whole operation on one screen, 6-8 weeks.
- si_managed: we productise their messiest workflows with AI automation, then run them.
- nurture: a light, low-friction next step (a short resource or a quick call).
The outreach must be British, direct, founder-to-founder, no hype, max 80 words, NAME the specific signal (their actual accounting tool / hire), make ONE clear offer matched to the routed stream above, and end with one low-friction question. Never invent facts not in the input.
Respond with ONLY a JSON object, no markdown, with exactly these keys:
{"icp_score": <int 0-100>, "intent_score": <int 0-100>, "routed_stream": "workshop|finance_wall|operation_wall|si_managed|nurture", "reason": "<one sentence>", "outreach": "<the message>"}`;

app.post("/api/score", async (req, res) => {
  const company = (req.body?.company || "").toString().slice(0, 200).trim();
  const signal = (req.body?.signal || "").toString().slice(0, 500).trim();
  if (!company) return res.status(400).json({ error: "company is required" });
  if (!LLM_API_KEY) return res.status(500).json({ error: "GROQ_API_KEY not set on the server" });

  try {
    const r = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
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
      console.error("LLM error:", r.status, detail.slice(0, 300));
      return res.status(502).json({ error: `LLM API ${r.status}: ${detail.slice(0, 160)}` });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    res.json(JSON.parse(content));
  } catch (e) {
    console.error("score error:", e.message);
    res.status(500).json({ error: e.message || "scoring failed" });
  }
});

app.get("/healthz", (_req, res) =>
  res.json({ ok: true, keySet: !!LLM_API_KEY, model: LLM_MODEL })
);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Neon GTM Command WALL live on :${port} (model: ${LLM_MODEL})`));
