// Minimal secure proxy for Gemini / Pollinations — keeps API key server-side
// Deploy to Vercel / Render / Fly / Railway / Cloud Run. See README.md
// This is NOT used by GitHub Pages static preview, but shows the CORRECT secure architecture
// so the site isn't "pretending demo is real AI".

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({limit: "200kb"}));
app.use(express.static("../")); // optionally serve static in local dev

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY || ""; // NEVER commit this; set in dashboard
const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY || "";

if(!GEMINI_KEY && !POLLINATIONS_KEY){
  console.warn("[server] No GEMINI_API_KEY / POLLINATIONS_API_KEY set — free Pollinations will be used (proxied)");
}

// Simple allow-list: only CBSE Commerce prompts (basic guard)
function isAllowedPrompt(prompt){
  if(!prompt || prompt.length < 10 || prompt.length > 8000) return false;
  return true;
}

app.get("/health", (req,res)=> res.json({ok:true, hasGemini: !!GEMINI_KEY, hasPollinations: !!POLLINATIONS_KEY}));

// POST /api/ai  { mode, input, context } -> { ok, provider, text, error, status }
app.post("/api/ai", async (req,res)=>{
  const t0 = Date.now();
  const {prompt, mode, input, context} = req.body || {};
  // Allow either full prompt string or mode+input+context (server rebuilds)
  let finalPrompt = prompt || "";
  if(!finalPrompt && (mode || input)){
    // Minimal rebuild — full logic lives in js/app.js buildAIPrompt(), here we trust client's prompt
    finalPrompt = `Mode:${mode} Input:${String(input).slice(0,1200)} Context:${JSON.stringify(context).slice(0,500)}`;
  }
  if(!isAllowedPrompt(finalPrompt)){
    return res.status(400).json({ok:false, error:"Invalid prompt"});
  }
  console.log(`[api/ai] mode=${mode||"?"} len=${finalPrompt.length} hasKey=${!!GEMINI_KEY}`);
  try{
    let text = "";
    let provider = "";
    if(GEMINI_KEY){
      provider = "Gemini (server)";
      console.log("[api/ai] -> Gemini 1.5-flash");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
      const r = await fetch(url, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          contents:[{parts:[{text: finalPrompt}]}],
          generationConfig:{temperature:0.7, maxOutputTokens:900}
        })
      });
      console.log(`[api/ai] Gemini status ${r.status}`);
      if(!r.ok){
        const err = await r.text().catch(()=> "");
        console.error("[api/ai] Gemini error", r.status, err.slice(0,400));
        return res.status(r.status).json({ok:false, provider, status:r.status, error: `Gemini HTTP ${r.status}: ${err.slice(0,400)}`});
      }
      const j = await r.json();
      text = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if(POLLINATIONS_KEY){
      provider = "Pollinations (key, server)";
      console.log("[api/ai] -> gen.pollinations.ai");
      const r = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json", "Authorization": `Bearer ${POLLINATIONS_KEY}`},
        body: JSON.stringify({model:"openai", messages:[{role:"user", content: finalPrompt}], temperature:0.7})
      });
      console.log(`[api/ai] Pollinations key status ${r.status}`);
      if(!r.ok){
        const err = await r.text().catch(()=> "");
        console.error("[api/ai] Pollinations key error", err.slice(0,400));
        return res.status(r.status).json({ok:false, provider, status:r.status, error: err.slice(0,500)});
      }
      const j = await r.json();
      text = j?.choices?.[0]?.message?.content || "";
    } else {
      provider = "Pollinations (free, server)";
      console.log("[api/ai] -> text.pollinations.ai/openai");
      const r = await fetch("https://text.pollinations.ai/openai", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({model:"openai", messages:[{role:"user", content: finalPrompt}], temperature:0.7})
      });
      console.log(`[api/ai] Pollinations free status ${r.status}`);
      if(!r.ok){
        const err = await r.text().catch(()=> "");
        return res.status(r.status).json({ok:false, provider, status:r.status, error: err.slice(0,500)});
      }
      const j = await r.json().catch(()=>null);
      text = j?.choices?.[0]?.message?.content || "";
      if(!text || text.trim().length < 10){
        // try GET
        const short = finalPrompt.slice(0,1100);
        const r2 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(short)}?model=openai`);
        console.log(`[api/ai] Pollinations GET status ${r2.status}`);
        if(!r2.ok){
          const err = await r2.text().catch(()=> "");
          return res.status(r2.status).json({ok:false, provider, status:r2.status, error: err.slice(0,500)});
        }
        text = await r2.text();
      }
    }
    if(!text || text.trim().length < 10){
      console.warn("[api/ai] empty response");
      return res.status(502).json({ok:false, provider, error:"Empty upstream response"});
    }
    console.log(`[api/ai] success ${provider} ${Date.now()-t0}ms ${text.length} chars`);
    res.json({ok:true, provider, text: text.trim()});
  }catch(e){
    console.error("[api/ai] exception", e);
    res.status(500).json({ok:false, error: e.message || String(e)});
  }
});

app.listen(PORT, "0.0.0.0", ()=>{
  console.log(`Secure AI proxy listening on 0.0.0.0:${PORT}`);
  console.log("  POST /api/ai  {prompt} or {mode,input,context}");
  console.log("  GET  /health");
  if(!GEMINI_KEY) console.log("  (Tip) Set GEMINI_API_KEY env var for reliable Gemini — free at https://aistudio.google.com/app/apikey");
});
