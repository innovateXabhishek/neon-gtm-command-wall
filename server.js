// Neon GTM Command WALL — backend
// Serves the demo (index.html) AND a secure /api/score endpoint that calls Claude.
// The ANTHROPIC_API_KEY lives ONLY here as a server-side env var — never in the page.
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serves index.html and assets

// SDK reads ANTHROPIC_API_KEY from the environment (set it in Render → Environment).
const client = new Anthropic();

const SYSTEM = `You are Neon AI's GTM lead-scoring engine.
ICP: UK SMB / mid-market (5-50 staff), founder-led, running Xero/Sage/QuickBooks/Tally, showing a pain signal.
Score the company for fit with Neon's three revenue streams and draft one grounded first-touch outreach message.
Routing rules: high icp+intent -> workshop; accounting-tool match + finance/KPI pain -> finance_wall; multi-site/complex ops -> operation_wall; clear automation need -> si_managed; weak fit -> nurture.
The outreach must be British, direct, founder-to-founder, no hype, max 80 words, name the specific signal, and make one clear offer matched to the routed stream. Never invent facts not in the input.`;

const SCHEMA = {
  type: "object",
  properties: {
    icp_score: { type: "integer" },
    intent_score: { type: "integer" },
    routed_stream: { type: "string", enum: ["workshop", "finance_wall", "operation_wall", "si_managed", "nurture"] },
    reason: { type: "string" },
    outreach: { type: "string" },
  },
  required: ["icp_score", "intent_score", "routed_stream", "reason", "outreach"],
  additionalProperties: false,
};

app.post("/api/score", async (req, res) => {
  const company = (req.body?.company || "").toString().slice(0, 200).trim();
  const signal = (req.body?.signal || "").toString().slice(0, 500).trim();
  if (!company) return res.status(400).json({ error: "company is required" });
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5", // cheap model on purpose — cost-per-lead discipline
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: "user", content: `Company: ${company}\nSignal: ${signal || "(none provided)"}` }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });
    const text = response.content.find((b) => b.type === "text")?.text || "{}";
    res.json(JSON.parse(text));
  } catch (e) {
    console.error("score error:", e.message);
    res.status(500).json({ error: e.message || "scoring failed" });
  }
});

app.get("/healthz", (_req, res) => res.json({ ok: true, keySet: !!process.env.ANTHROPIC_API_KEY }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Neon GTM Command WALL live on :${port}`));
