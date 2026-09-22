# Secure AI proxy (the correct way to hide the API key)

**Problem:** GitHub Pages is *static hosting*. Any `fetch("https://generativelanguage.googleapis.com/...?key=AIza...")` you make from `js/app.js` happens **in the user's browser** — the key is visible in DevTools → Network → Request URL, and any tech-savvy user can copy it. For a personal device this is low-risk (free Gemini keys are free, rate-limited per project, and you can rotate at https://aistudio.google.com/app/apikey), but for a **production site with many users** you should NOT ship your secret in client JS.

**Correct architecture:** `Browser → Your Server (holds secret) → Gemini/Pollinations → Browser`

```
[commerce-students.github.io]  --POST /api/ai {prompt}-->  [server/index.js on Vercel/Render]
                                                          |  GEMINI_API_KEY is env var, never leaves server
                                                          --POST generativelanguage.googleapis.com--> [Gemini]
                                                          <-- real text --
                                                  <-- {ok:true, text} --  [browser displays ✓ Real AI response]
```

**What this server does:**
- Accepts `POST /api/ai` with `{prompt}` or `{mode,input,context}` (keeps `q.question/options/correct/selected` server-side if you rebuild prompt there)
- If `GEMINI_API_KEY` env var is set → calls Gemini 1.5-flash server-side (key never in browser)
- Else if `POLLINATIONS_API_KEY` → calls `gen.pollinations.ai`
- Else → free Pollinations (`text.pollinations.ai`)
- Always returns `{ok:true, provider, text}` or `{ok:false, provider, status, error}` — frontend shows **Connecting → Real response ✓** or **AI request failed (real HTTP status + error) + Retry** — demo is never silently shown as real.

**Deploy in 5 min (free):**
1. Push this `server/` folder to a new GitHub repo OR use same repo with Vercel (root = `server`)
2. Vercel: `vercel --prod` → set env var `GEMINI_API_KEY=AIza...` in Vercel dashboard → Deploy
3. Render / Railway / Fly: `npm start` (`PORT` is auto) → set `GEMINI_API_KEY`
4. Update `js/app.js` one line (optional): change `fetchPollinations()` to first try `fetch("/api/ai", ...)` when `location.hostname !== "commerce-students.github.io"` or when `window.CS_API_BASE` is set.

**Local test:**
```bash
cd server
npm install
GEMINI_API_KEY=AIza... npm start
# then: curl -X POST http://localhost:3000/api/ai -H "Content-Type: application/json" -d '{"prompt":"Hello, reply with Live AI test ok"}'
```

**Frontend fallback (current Pages behavior):**
Until you deploy the proxy, the site keeps working: it calls Gemini/Pollinations **directly from the browser** with a key from `localStorage` (`cs:v2:apiKey`). That key is still *real* — responses are labeled `✓ Real AI response` only on HTTP 200 — but they ARE visible in Network. We do **not** pretend a demo is real: on any failure we show `AI request failed · Provider · HTTP status · error + Retry + Show offline explanation (explicit)`. See `js/app.js: aiGenerate / aiGenerateSafe`.

**Do NOT commit a real key:** `.gitignore` already ignores `server/.env`. Rotate leaked keys immediately at https://aistudio.google.com/app/apikey → Delete old key.
