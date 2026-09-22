# Commerce-Students — CBSE Commerce Study Companion

**Live:** https://commerce-students.github.io/

A polished, fast, mobile-first Commerce learning platform for **CBSE Classes 11 & 12** (Accountancy, Business Studies, Economics, English, Information Technology). Built as a static site for **GitHub Pages** — no backend required, all progress saved locally.

## ✨ What it does

Commerce-Students guides the student through the learning loop:

```
Learn → Practice → Make mistakes → Understand → Revise → Test → Track progress → Improve
```

Every feature has a clear purpose for exam preparation.

**Core flows:**
- **Study** — Class → Subject → Chapter → Topic, with lesson pages (explanations, formulas, examples, key points, common mistakes, exam tips), progress checklist, topic status (Strong / Improving / Needs Revision).
- **Practice** — Filter by class/subject/chapter/difficulty/type; MCQ and short-answer; instant evaluation with explanations; mistakes auto-saved to Mistake Book.
- **Mistake Book** — Groups mistakes by subject/chapter, shows your answer vs correct, repeat count, date; actions: Review, Practice similar, Ask AI, Mark mastered.
- **Weak-topic detection** — ≥3 attempts → accuracy <50% = Needs Revision, 50–75% = Improving, >75% & ≥5 attempts = Strong. Clearly labeled “Based on your recent practice”.
- **Daily 10** — 10 questions/day auto-generated from weak topics + recent mistakes + unseen topics; adapts tomorrow.
- **Tests** — Quick (10 Qs/10 min), Chapter, Subject, Full Mock, Custom; timer, navigation (answered/marked/unanswered), mark-for-review, confirmation before submit, detailed result with per-chapter performance and next steps.
- **Revision Centre** — 5-Minute Revision (definition → methods → formula → example → common mistake → 3 rapid Qs), Formula Bank (searchable, copy), Definitions Bank, Mistake revision.
- **AI Study Assistant** — Context-aware (class/subject/chapter auto-filled) with modes: Explain, Solve, Teach Me, Quiz Me, Check My Answer, Hint, Simplify, Examiner Mode. Offline rule-based demo clearly labeled; no fake API calls. Replace with real backend when ready.
- **Dashboard & Progress** — Greeting, today's progress (time, Qs, accuracy), Continue Learning, Today's plan, Weak Areas, Streak (7-day view, non-punitive), Overall stats, Subject/chapter progress, Recent activity, Achievements.
- **Search** — Global search across subjects/chapters/topics/questions/formulas/definitions.
- **Profile & Study Plan** — Name, class, exam date, daily target, theme, study plan generator (minutes/day → weekly schedule).

**Design:** Clean, academic, premium — deep navy primary, neutral grays, success/warning/danger tokens, WCAG contrast, consistent spacing scale, one icon set, reduced-motion support, skeleton loaders, meaningful empty/error states, keyboard + screen-reader friendly.

**Mobile-first:** Tested 320 → 1440px, no horizontal overflow, 44px min tap targets, bottom nav on mobile, sticky headers, readable formulas.

## 🏗 Architecture

```
/
├── index.html              # SPA shell (hash routing — works on GitHub Pages)
├── 404.html                # GitHub Pages fallback
├── class11-it-notes.html   # Legacy detailed IT notes (preserved)
├── assets/logo.svg
├── css/
│   ├── tokens.css          # Design tokens (light/dark)
│   └── app.css             # App styles (no heavy framework)
├── js/
│   ├── app.js              # Router + all pages + state (ESM)
│   ├── store.js            # LocalStorage abstraction (profile, progress, mistakes, streak...)
│   └── data/
│       ├── curriculum.js   # Class 11/12 × 5 subjects × chapters/topics/keyPoints
│       ├── questions.js    # ~43+ original Qs with id/class/subject/chapter/topic/difficulty/type/question/options/correct/explanation/marks/time/sourceType
│       └── revision.js     # Formulas + Definitions + 5-min content
├── sitemap.xml, robots.txt, site.webmanifest, .nojekyll
└── README.md
```

**No build step required for deployment** — push to `main` and GitHub Pages serves `index.html` directly. All data is static; all user progress is in `localStorage` under `cs:v2:*` keys. For local development you can run `python -m http.server` or `npx serve`.

**Hash routing** (`#home`, `#study/12/accountancy`, `#practice?class=12&subject=accountancy`, etc.) avoids GitHub Pages 404 issues with SPA history mode.

## 🚀 How to run

```bash
# serve locally
python3 -m http.server 8000
# or
npx serve .

# then open
http://localhost:8000/
```

No secrets, no env vars needed. The app works fully offline after load.

## 🚀 How to deploy

The repo is configured for **GitHub Pages (username.github.io)**:

1. Push to `main` on `commerce-students/commerce-students.github.io`.
2. In GitHub → Settings → Pages → Source: **Deploy from branch**, Branch: `main`, Folder: `/ (root)`.
3. The site builds instantly — no Actions required. Supports custom domains.

Because GitHub Pages is static, the app intentionally uses **client-side persistence**. To add a real backend later:

- Keep `js/store.js` as the persistence layer; swap `localStorage` for API calls.
- Add a server (e.g., Next.js API routes, Supabase, Firebase) and guard AI keys server-side.
- Keep `js/data/*.js` as seed content; move to DB/CMS when content grows.

## 📚 Content

Questions are **Original Practice** (not claimed as official CBSE papers) and reflect CBSE 2026–27 syllabus style. To add a question, edit `js/data/questions.js`:

```js
{
  id:"acc12-goodwill-004",
  class:12, subject:"accountancy", chapter:"Goodwill: Nature & Valuation", topic:"...", 
  difficulty:"medium", type:"mcq",
  question:"...",
  options:["...","...","...","..."],
  correct:1,
  explanation:"Step-by-step...",
  marks:1, time:60, source:"original"
}
```

Similarly, update `js/data/curriculum.js` for syllabus changes and `js/data/revision.js` for formulas/definitions.

## ♿ Accessibility & Performance

- Semantic HTML, focus states, skip-friendly nav, ARIA where needed, icon + text (not color alone) for Correct/Incorrect/Weak/Strong.
- Respects `prefers-reduced-motion`, 60fps transitions, lazy-friendly.
- No large JS frameworks; total CSS ~23KB, JS ~140KB (ESM, no bundle). Works on slow mobile connections.

## ✅ Acceptance notes

- No fake features: every button does something; AI is labeled “Offline demo” when no backend; stats reflect real local attempts.
- No exposed secrets.
- No broken routes; legacy `#class-11` hashes redirect to new `#study/11`.
- Detailed IT notes preserved at `class11-it-notes.html` and linked from IT subject pages.

## 🗺 Next recommended improvements

- [ ] CMS or `content/` markdown for teachers to edit lessons without touching JS.
- [ ] Add 150+ more questions per subject (case-based, assertion/reason, numerical with `solutionSteps` and `formula`).
- [ ] Cloud sync & auth (email + Google) via Supabase/Firebase; migrate `store.js` to remote with offline fallback.
- [ ] Real AI backend proxy (`/api/ai`) with streaming, rate limits, prompt-hardening; keep offline demo as fallback.
- [ ] PWA: service worker, offline shell, install prompt, cached static content.
- [ ] Admin UI for question CRUD (protected).
- [ ] Analytics (privacy-friendly) for most-mistaken topics.

---

**License:** MIT — see `LICENSE`. Content is original practice material, not official CBSE papers.
