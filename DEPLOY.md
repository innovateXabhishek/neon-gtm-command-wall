# 🚀 Deploy — Command WALL + live Claude scoring

This is now a **Node web service** (not a static site), because the live "Score with Claude" widget needs a backend that holds your API key secretly. The server (`server.js`) serves the demo *and* exposes `POST /api/score`, which calls Claude. Your key lives only in Render's encrypted env vars — never in the public page.

## Deploy on Render (~5 min)

1. Push this folder to GitHub (already wired to `neon-gtm-command-wall`):
   ```bash
   cd ~/Downloads/neon-gtm-live
   git add .
   git commit -m "Add live Claude scoring backend"
   git push
   ```
2. **If you already created a Static Site for this repo, delete it** (Render → that service → Settings → Delete). A static site can't run a server.
3. Render → **New + → Web Service** → pick **`neon-gtm-command-wall`**.
4. Settings (Render usually auto-detects these from `package.json` / `render.yaml`):
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance type:** Free
5. **Add your key:** open the **Environment** tab → **Add Environment Variable**:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from [console.anthropic.com](https://console.anthropic.com) → **API Keys**
6. **Create Web Service.** Render builds and gives you a live URL.

## Verify it's live
- Open the URL → the demo loads, watermarked "Built by Abhishek S".
- Visit `your-url/healthz` → should show `{"ok":true,"keySet":true}`. If `keySet` is false, the key env var didn't save — re-add it.
- In the demo, scroll to **"🔴 Live: score a real company with Claude"**, type a company + signal, click **Score with Claude** → you get a real, live Claude score + drafted outreach.

## Cost & safety
- Scoring uses **`claude-haiku-4-5`** (~$1 / 1M input tokens). Each score is a few hundred tokens — a whole interview costs pennies.
- The key is **never** in the browser or the GitHub repo — only in Render's env. Safe.
- Free Render web services sleep after ~15 min idle and take ~30s to wake. **Open the URL a minute before your interview** so it's warm.

## Test locally first (optional)
```bash
cd ~/Downloads/neon-gtm-live
export ANTHROPIC_API_KEY=sk-ant-...   # your key
npm install
npm start
# open http://localhost:3000
```
