# 🚀 Deploy — Command WALL + live AI scoring (xAI Grok)

This is a **Node web service** (not a static site), because the live "Score with AI" widget needs a backend that holds your API key secretly. The server (`server.js`) serves the demo *and* exposes `POST /api/score`, which calls the LLM. Your key lives only in Render's encrypted env vars — never in the public page.

> The engine is **LLM-agnostic**. It's wired to **xAI Grok** here; to run it on Claude in production, swap `XAI_BASE_URL` / `XAI_MODEL` / the key — no other code change.

## Deploy on Render (~5 min)

1. Push this folder to GitHub (already wired to `neon-gtm-command-wall`):
   ```bash
   cd ~/Downloads/neon-gtm-live
   git add .
   git commit -m "Use xAI Grok for live scoring"
   git push
   ```
2. **If you already created a Static Site for this repo, delete it** (Render → that service → Settings → Delete). A static site can't run a server.
3. Render → **New + → Web Service** → pick **`neon-gtm-command-wall`**.
4. Settings (usually auto-detected from `package.json` / `render.yaml`):
   - **Runtime:** Node · **Build:** `npm install` · **Start:** `node server.js` · **Free**
5. **Add your key:** **Environment** tab → **Add Environment Variable**:
   - Key: `XAI_API_KEY`  ·  Value: your key from [console.x.ai](https://console.x.ai) → API Keys
   - (Optional) Key: `XAI_MODEL` · Value: a model your account has (default is `grok-3-mini`; e.g. `grok-3`, `grok-4`, `grok-2-1212`)
6. **Create Web Service.** Render builds and gives you a live URL.

## Verify it's live
- Open the URL → the demo loads, watermarked "Built by Abhishek S".
- Visit `your-url/healthz` → should show `{"ok":true,"keySet":true,"model":"grok-3-mini"}`. If `keySet` is false, re-add the env var.
- In the demo, scroll to **"🔴 Live: score a real company with AI"**, type a company + signal, click **Score with AI** → you get a real, live model score + drafted outreach.

## If scoring errors
The widget shows the API's error message. Most common:
- **`LLM API 404 ... model`** → your account doesn't have `grok-3-mini`. Set `XAI_MODEL` to a model you do have and redeploy.
- **`401`** → wrong/expired key. Re-check `XAI_API_KEY`.
- Either way the simulated engine above keeps working — the demo never hard-breaks.

## Cost & safety
- Uses a **cheap model tier** (`grok-3-mini` by default). Each score is a few hundred tokens — a whole interview costs pennies.
- The key is **never** in the browser or the GitHub repo — only in Render's env.
- Free Render web services sleep after ~15 min idle and take ~30s to wake. **Open the URL a minute before your interview** so it's warm.

## Test locally first (optional)
```bash
cd ~/Downloads/neon-gtm-live
export XAI_API_KEY=xai-...        # your key
export XAI_MODEL=grok-3-mini      # or a model you have
npm install
npm start
# open http://localhost:3000
```
