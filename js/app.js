import { SUBJECTS, SUBJECT_NAMES, SUBJECT_ICONS, CURRICULUM, getChapters } from "./data/curriculum.js";
import { QUESTIONS, getQuestions, getQuestionById } from "./data/questions.js";
import { FORMULAS, DEFINITIONS } from "./data/revision.js";
import * as Store from "./store.js";

// --- helpers ---
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtTime = sec => `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
const todayGreeting = () => {
  const h=new Date().getHours();
  if(h<12) return "Good morning";
  if(h<17) return "Good afternoon";
  return "Good evening";
};
function toast(msg){
  let t=$("#toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add("show");
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove("show"),2600);
}

// Theme
const savedTheme = Store.getTheme();
if(savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
else if(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.setAttribute("data-theme","dark");

// --- app state ---
let practiceState = null; // {questions, idx, answers, start, filters}
let testState = null; // {questions, answers, marks, start, duration, timer, submitted}
let aiContext = {class:12, subject:"accountancy", chapter:0};

// --- icons ---
const ICONS = {
  sun:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  moon:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>`,
  menu:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 20 20"/></svg>`,
  home:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 10L12 3l9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/></svg>`,
  book:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5a3 3 0 0 1 3-3h9a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3V5Z"/><path d="M7 8h8M7 12h8M7 16h5"/></svg>`,
  practice:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 7h8M9 11h8M9 15h5"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>`,
  test:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>`,
  user:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6"/></svg>`,
};

// --- topbar & navigation ---
function renderChrome(){
  const path = location.hash || "#home";
  const active = (k)=>{
    if(k==="home" && (path==="#home"||path==="#"||path==="")) return "active";
    if(path.startsWith("#"+k)) return "active";
    return "";
  };
  const mobile = `
    <nav class="mobile-nav" id="mobile-nav">
      <a href="#home" class="${active("home")}">Home</a>
      <a href="#study" class="${active("study")}">Study</a>
      <a href="#practice" class="${active("practice")}">Practice</a>
      <a href="#tests" class="${active("tests")}">Tests</a>
      <a href="#revision" class="${active("revision")}">Revision</a>
      <a href="#ai" class="${active("ai")}">AI</a>
      <a href="#progress" class="${active("progress")}">Progress</a>
    </nav>`;
  const desktopNav = `
    <nav class="nav-desktop" aria-label="Primary">
      <a class="nav-link ${active("home")}" href="#home">Home</a>
      <a class="nav-link ${active("study")}" href="#study">Study</a>
      <a class="nav-link ${active("practice")}" href="#practice">Practice</a>
      <a class="nav-link ${active("tests")}" href="#tests">Tests</a>
      <a class="nav-link ${active("revision")}" href="#revision">Revision</a>
      <a class="nav-link ${active("ai")}" href="#ai">AI</a>
      <a class="nav-link ${active("progress")}" href="#progress">Progress</a>
      <a class="nav-link ${active("profile")}" href="#profile">Profile</a>
    </nav>`;
  const isDark = document.documentElement.getAttribute("data-theme")==="dark";
  return `
  <header class="topbar">
    <div class="shell topbar-inner">
      <a class="brand" href="#home" aria-label="Commerce-Students home">
        <span class="brand-mark"><img src="assets/logo.svg" alt="" loading="eager"></span>
        <span class="brand-text"><strong>Commerce-Students</strong><small>CBSE Commerce · XI–XII</small></span>
      </a>
      ${desktopNav}
      <div class="header-actions">
        <a class="icon-btn" href="#search" aria-label="Search">${ICONS.search}</a>
        <button class="icon-btn" id="theme-toggle" aria-label="Toggle theme">${isDark?ICONS.sun:ICONS.moon}</button>
        <button class="icon-btn menu-btn" id="menu-toggle" aria-label="Menu" aria-expanded="false">${ICONS.menu}</button>
      </div>
    </div>
    ${mobile}
  </header>
  <nav class="bottom-nav" aria-label="Mobile primary">
    <a href="#home" class="${active("home")}">${ICONS.home}<span>Home</span></a>
    <a href="#study" class="${active("study")}">${ICONS.book}<span>Study</span></a>
    <a href="#practice" class="${active("practice")}">${ICONS.practice}<span>Practice</span></a>
    <a href="#tests" class="${active("tests")}">${ICONS.test}<span>Tests</span></a>
    <a href="#profile" class="${active("profile")}">${ICONS.user}<span>Profile</span></a>
  </nav>`;
}

// --- page wrappers ---
function breadcrumbs(parts){
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${parts.map((p,i)=> {
    const last=i===parts.length-1;
    return (i?`<span aria-hidden="true">/</span>`:"") + (last? `<span class="current">${esc(p.label)}</span>` : `<a href="${p.href}">${esc(p.label)}</a>`);
  }).join("")}</nav>`;
}

// --- HOME ---
function pageHome(){
  const profile = Store.getProfile();
  const cls = profile.class || 12;
  const overall = Store.getOverallStats();
  const weak = Store.getWeakTopics(3);
  const streak = Store.getStreak();
  const recent = Store.getProgress().attempts.slice(-3).reverse();
  document.title = "Commerce-Students — Your CBSE Commerce study companion";
  return `
  <section class="hero">
    <div class="shell hero-grid">
      <div>
        <span class="eyebrow">CBSE Commerce · Classes 11 & 12</span>
        <h1>Study Commerce <em>smarter.</em></h1>
        <p class="hero-sub">Learn concepts, practice exam-style questions, fix your mistakes and track your preparation — all in one place. No noise, no fake progress.</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="#study">Start studying →</a>
          <a class="btn btn-lg" href="#study/${cls}">Go to Class ${cls}</a>
          <a class="btn btn-sm" href="#practice">Quick Practice</a>
        </div>
        <div class="hero-meta">
          <span><i></i>Original questions</span>
          <span><i></i>CBSE 2026–27 syllabus</span>
          <span><i></i>Local progress saved</span>
          <span><i></i>Works offline</span>
        </div>
      </div>
      <div class="hero-visual">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <strong style="font-size:13px;letter-spacing:.04em">Your learning loop</strong>
          <span class="badge">Today · ${new Date().toLocaleDateString("en-IN",{weekday:"short", day:"2-digit", month:"short"})}</span>
        </div>
        <div class="loop">
          ${[
            ["Learn","Concept → Example","1"],
            ["Practice","20 exam-style Qs","2"],
            ["Make mistakes","Saved to Mistake Book","3"],
            ["Understand","Explanation + AI hint","4"],
            ["Revise","5-min + Formula Bank","5"],
            ["Test","Timed exam mode","6"],
            ["Track progress","Weak topics → Daily 10","7"],
          ].map(([title,desc,n],i)=>`
            <div class="loop-step ${i===1?'active':''}">
              <b>${n}</b><div><div>${title}</div><small>${desc}</small></div><small>${i===1?'Now →':''}</small>
            </div>
          `).join("")}
        </div>
        <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="stat" style="padding:12px">
            <span>Questions solved</span><strong>${overall.total}</strong>
          </div>
          <div class="stat" style="padding:12px">
            <span>Accuracy</span><strong>${overall.accuracy}%</strong>
          </div>
        </div>
        <div style="margin-top:10px" class="row">
          <span class="badge ${streak.count?'badge-success':''}">🔥 ${streak.count} day streak</span>
          <span class="badge">${overall.tests} tests taken</span>
        </div>
      </div>
    </div>
  </section>

  <section class="shell section">
    <div class="section-head">
      <div><span class="eyebrow">Choose your class</span><h2>Two years, one system.</h2></div>
      <div><p>Pick your class and see every subject, chapter and practice set in one place.</p></div>
    </div>
    <div class="grid-2">
      ${[11,12].map(g=>`
        <a class="class-card" data-grade="${g===11?'XI':'XII'}" href="#study/${g}">
          <span class="kicker">Year ${g-10}${g===12?' · Board year':' · Foundation year'}</span>
          <h3>Class ${g}</h3>
          <p>${CURRICULUM[g].accountancy.chapters.length + CURRICULUM[g].business.chapters.length + CURRICULUM[g].economics.chapters.length} chapters · 5 subjects · practice + revision</p>
          <span class="btn btn-sm">Open Class ${g} →</span>
        </a>
      `).join("")}
    </div>
  </section>

  <section class="shell section">
    <div class="section-head">
      <div><span class="eyebrow">What do you want to do?</span><h2>Continue your preparation.</h2></div>
      <a href="#dashboard">Open Dashboard →</a>
    </div>
    <div class="action-grid">
      ${[
        ["📚","Study","Continue chapters","#study"],
        ["📝","Practice","Chapter-wise Qs","#practice"],
        ["⏱️","Take a Test","Timed exam","#tests"],
        ["🔄","Revise","5-min + Formulas","#revision"],
        ["🤖","Ask AI","Explain & check answer","#ai"],
        ["📊","Track Progress","Mistakes & weak topics","#progress"],
      ].map(([ico,title,desc,href])=>`
        <a class="action-card" href="${href}">
          <span class="ico">${ico}</span>
          <span><b>${title}</b><span>${desc}</span></span>
        </a>
      `).join("")}
    </div>
  </section>

  <section class="shell section">
    <div class="section-head">
      <div><span class="eyebrow">Why Commerce-Students?</span><h2>The loop that makes you improve.</h2></div>
    </div>
    <div class="grid-3">
      <div class="card"><strong>Learn</strong><p class="muted" style="color:var(--muted);font-size:13px;margin-top:6px">Distraction-free lessons with examples, formulas, common mistakes and exam tips — mapped chapter → topic.</p></div>
      <div class="card"><strong>Practice & get feedback</strong><p class="muted" style="color:var(--muted);font-size:13px;margin-top:6px">Every answer is evaluated instantly with a clear explanation. Mistakes are saved, not lost.</p></div>
      <div class="card"><strong>Revise what matters</strong><p class="muted" style="color:var(--muted);font-size:13px;margin-top:6px">Weak-topic detection, Mistake Book and Daily 10 adapt to your recent performance.</p></div>
    </div>
  </section>

  <section class="shell section">
    <div class="section-head">
      <div><span class="eyebrow">Subjects</span><h2>What you can study today.</h2></div>
      <a href="#study">Browse all →</a>
    </div>
    <div class="grid-5">
      ${SUBJECTS.map(s=>`
        <a class="strip-card" href="#study/${cls}/${s}">
          <div style="font-family:var(--serif);font-size:22px">${SUBJECT_ICONS[s]}</div>
          <strong>${esc(SUBJECT_NAMES[s])}</strong><br>
          <small>${getChapters(cls,s).length} chapters · Class ${cls}</small>
        </a>
      `).join("")}
    </div>
    <div class="row" style="margin-top:12px">
      <a class="btn btn-sm" href="#study/11">View Class 11</a>
      <a class="btn btn-sm" href="#study/12">View Class 12</a>
    </div>
  </section>

  <section class="shell section" style="padding-bottom:28px">
    <div class="grid-2">
      <div class="card">
        <span class="eyebrow">Today's 10</span>
        <h3 style="margin-top:8px">10 questions · ~10 minutes</h3>
        <p style="color:var(--muted);font-size:13px;margin-top:6px">Personalised set from your weak topics, recent mistakes and topics you haven't practiced recently.</p>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          ${weak.length? weak.map(w=>`<span class="badge">${esc(w.topic)}</span>`).join("") : `<span class="badge">Start practicing to generate your set</span>`}
        </div>
        <div style="margin-top:16px"><a class="btn btn-primary" href="#daily">Start Daily 10 →</a></div>
      </div>
      <div class="card">
        <span class="eyebrow">Mistake Book</span>
        <h3 style="margin-top:8px">${Store.getMistakeList().length} mistakes to review</h3>
        <p style="color:var(--muted);font-size:13px;margin-top:6px">Every incorrect answer is saved with your answer, correct answer and explanation. Review, practice similar, or ask AI.</p>
        <div style="margin-top:16px;display:flex;gap:8px">
          <a class="btn btn-primary" href="#mistakes">Open Mistake Book</a>
          <a class="btn" href="#practice">Practice</a>
        </div>
        ${recent.length? `<div style="margin-top:14px;font-size:12px;color:var(--muted)"><strong>Recent:</strong> ${recent.map(a=>esc(a.questionId)).join(" · ")}</div>`:""}
      </div>
    </div>
  </section>
  `;
}

// --- STUDY: class selection ---
function pageStudyRoot(){
  document.title = "Study — Choose Class · Commerce-Students";
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home", href:"#home"}, {label:"Study"}])}
    <span class="eyebrow">Study</span>
    <h1 class="page-title">Choose your class</h1>
    <p class="page-intro">Your study is organised as Class → Subject → Chapter → Topic. Pick a class to start.</p>
    <div class="grid-2" style="margin-top:22px">
      ${[11,12].map(g=>`
        <a class="class-card" data-grade="${g===11?'XI':'XII'}" href="#study/${g}">
          <span class="kicker">Class ${g}</span>
          <h3>${SUBJECT_NAMES.accountancy} · ${SUBJECT_NAMES.business} · ${SUBJECT_NAMES.economics}</h3>
          <p>${Object.keys(CURRICULUM[g]).length} subjects · ${Object.values(CURRICULUM[g]).reduce((s,subj)=>s+subj.chapters.length,0)} chapters</p>
          <span class="btn btn-sm">Open Class ${g} →</span>
        </a>
      `).join("")}
    </div>
  </section>`;
}
function pageClass(grade){
  if(!CURRICULUM[grade]) return pageStudyRoot();
  document.title = `Class ${grade} · Commerce-Students`;
  const subjects = Object.entries(CURRICULUM[grade]);
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Study",href:"#study"},{label:`Class ${grade}` }])}
    <span class="eyebrow">Year ${grade-10}</span>
    <h1 class="page-title">Class ${grade}</h1>
    <p class="page-intro">Open a subject for its chapter checklist, lessons and practice. Your progress is saved on this device.</p>
    <div class="grid-2" style="margin-top:20px">
      ${subjects.map(([key, subj])=>{
        const totalQ = getQuestions({class:grade, subject:key}).length;
        return `
        <a class="subject-card card-hover" href="#study/${grade}/${key}">
          <span class="icon">${SUBJECT_ICONS[key]}</span>
          <h3>${esc(SUBJECT_NAMES[key])}</h3>
          <p>${esc(subj.desc)}</p>
          <span class="subject-meta"><span>${subj.chapters.length} chapters</span><i></i><span>${totalQ} practice Qs</span></span>
        </a>`;
      }).join("")}
    </div>
    <div class="row" style="margin-top:18px">
      <a class="btn btn-primary" href="#revision?class=${grade}">Build a Class ${grade} paper →</a>
      ${grade===11? `<a class="btn" href="class11-it-notes.html">Open detailed IT notes ↗</a>`:""}
    </div>
  </section>`;
}
function pageSubject(grade, subject){
  const subj = CURRICULUM[grade]?.[subject];
  if(!subj) return pageClass(grade);
  const chapters = subj.chapters;
  const totalQ = getQuestions({class:grade, subject}).length;
  aiContext = {class:grade, subject, chapter:0};
  document.title = `${SUBJECT_NAMES[subject]} · Class ${grade} · Commerce-Students`;
  const checkedCount = chapters.filter((_,i)=> Store.isChecked(`${grade}-${subject}-${i}`)).length;
  const pct = Math.round(checkedCount/chapters.length*100);
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Study",href:"#study"},{label:`Class ${grade}`,href:`#study/${grade}`},{label:SUBJECT_NAMES[subject]}])}
    <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;justify-content:space-between">
      <div>
        <span class="eyebrow">Class ${grade} · ${SUBJECT_NAMES[subject]}</span>
        <h1 class="page-title" style="margin-top:6px">${esc(SUBJECT_NAMES[subject])}</h1>
        <p class="page-intro">${esc(subj.desc)}</p>
      </div>
      <div class="card" style="min-width:180px;text-align:center;padding:14px">
        <strong style="font-size:26px">${chapters.length}</strong><br><span style="color:var(--muted);font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">chapters</span>
        <div style="margin-top:8px"><strong style="font-size:14px">${totalQ}</strong><span style="color:var(--muted);font-size:11px"> questions</span></div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="panel">
        <div class="panel-head"><h2>Chapter checklist</h2><span>Tick as you revise</span></div>
        <div class="chapter-list" id="chapter-list">
          ${chapters.map((ch,i)=>{
            const isDone = Store.isChecked(`${grade}-${subject}-${i}`);
            const prog = Store.getChapterProgress(subject, ch.title);
            const weakStyle = prog.attempts? (prog.accuracy>=75?'Strong': prog.accuracy>=50?'Improving':'Needs revision') : 'Not started';
            const level = prog.attempts? (prog.accuracy>=75?'strong': prog.accuracy>=50?'improving':'needs') : 'not';
            return `
            <div class="chapter ${isDone?'done':''}" data-ci="${i}">
              <button class="chapter-row" type="button" aria-expanded="false">
                <span class="chapter-check">${isDone?'✓':''}</span>
                <span class="chapter-num">${String(i+1).padStart(2,'0')}</span>
                <span class="chapter-title">${esc(ch.title)}</span>
                <span class="chapter-arrow">＋</span>
              </button>
              <div class="chapter-body">
                <div class="row" style="margin:6px 0">
                  ${ch.topics.map(t=>`<span class="badge">${esc(t)}</span>`).join("")}
                  <span class="badge ${level==='strong'?'badge-success':level==='needs'?'badge-danger':level==='improving'?'badge-warn':''}">${weakStyle}${prog.attempts?` · ${prog.accuracy}% (${prog.attempts})`:''}</span>
                </div>
                ${(ch.keyPoints||[]).slice(0,3).map((kp,ki)=>`<div class="keypoint"><b>${ki+1}.</b> ${esc(kp)}</div>`).join("")}
                <div class="row" style="margin-top:12px">
                  <a class="btn btn-primary btn-sm" href="#study/${grade}/${subject}/${i}">Learn →</a>
                  <a class="btn btn-sm" href="#practice?class=${grade}&subject=${subject}&chapter=${encodeURIComponent(ch.title)}">Practice</a>
                  <a class="btn btn-sm" href="#revision?class=${grade}&subject=${subject}&chapter=${encodeURIComponent(ch.title)}">Revise</a>
                  <button class="btn btn-sm" data-quicktest="${i}">Test</button>
                </div>
              </div>
            </div>`;
          }).join("")}
        </div>
        <div style="margin-top:14px">
          <div class="progress"><i style="width:${pct}%"></i></div>
          <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:11px;font-weight:700;margin-top:6px">
            <span>${checkedCount} of ${chapters.length} chapters revised</span><span>${pct}%</span>
          </div>
          <button class="btn btn-sm" id="reset-checklist" style="margin-top:10px">Reset checklist</button>
        </div>
      </div>
      <aside class="col">
        <div class="panel">
          <div class="panel-head"><h2>Continue learning</h2></div>
          ${(() => {
            const nextIdx = chapters.findIndex((_,i)=>!Store.isChecked(`${grade}-${subject}-${i}`));
            const idx = nextIdx===-1?0:nextIdx;
            const ch = chapters[idx];
            return `
              <p style="font-size:13px;color:var(--muted)">Next up:</p>
              <strong>${esc(ch.title)}</strong>
              <p style="color:var(--muted);font-size:12.5px;margin-top:6px">${esc(ch.keyPoints[0]||"")}</p>
              <a class="btn btn-primary" style="width:100%;margin-top:12px" href="#study/${grade}/${subject}/${idx}">Continue →</a>
            `;
          })()}
          <div class="divider"></div>
          <div class="panel-head" style="margin-bottom:8px"><h2>Quick actions</h2></div>
          <div class="col">
            <a class="btn" href="#practice?class=${grade}&subject=${subject}">Practice all chapters</a>
            <a class="btn" href="#tests?class=${grade}&subject=${subject}">Take chapter test</a>
            <a class="btn" href="#ai?class=${grade}&subject=${subject}">Ask AI about this subject</a>
            <a class="btn" href="https://www.cbseacademic.nic.in/" target="_blank" rel="noreferrer">CBSE curriculum ↗</a>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h2>Progress</h2><span>Based on your practice</span></div>
          ${(() => {
            const weak = Store.getWeakTopics(5).filter(w=>w.subject===subject);
            if(!weak.length) return `<div class="empty" style="padding:16px"><p>Solve 5+ questions per topic to see weak/strong analysis.</p></div>`;
            return weak.map(w=>`
              <div class="topic-row" style="margin-bottom:8px">
                <span style="font-size:13px;font-weight:600">${esc(w.topic)}</span>
                <span class="status ${w.accuracy>=75?'status-strong':w.accuracy>=50?'status-improving':'status-needs'}">${w.accuracy}% · ${w.attempts}</span>
              </div>
            `).join("");
          })()}
        </div>
      </aside>
    </div>
  </section>`;
}

// Lesson page
function pageLesson(grade, subject, idx){
  const subj = CURRICULUM[grade]?.[subject];
  const ch = subj?.chapters[idx];
  if(!ch) return pageSubject(grade, subject);
  document.title = `${ch.title} · ${SUBJECT_NAMES[subject]} · Class ${grade}`;
  aiContext = {class:grade, subject, chapter:idx};
  const prev = idx>0? `#study/${grade}/${subject}/${idx-1}` : null;
  const next = idx<subj.chapters.length-1? `#study/${grade}/${subject}/${idx+1}` : null;
  const isDone = Store.isChecked(`${grade}-${subject}-${idx}`);
  const qs = getQuestions({class:grade, subject, chapter:ch.title});
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Study",href:"#study"},{label:`Class ${grade}`,href:`#study/${grade}`},{label:SUBJECT_NAMES[subject],href:`#study/${grade}/${subject}`},{label:ch.title}])}
    <div class="lesson">
      <span class="eyebrow">Class ${grade} · ${SUBJECT_NAMES[subject]} · Chapter ${idx+1} of ${subj.chapters.length}</span>
      <h1 class="page-title" style="margin-top:8px">${esc(ch.title)}</h1>
      <div class="row" style="margin-top:10px">
        ${ch.topics.map(t=>`<span class="badge">${esc(t)}</span>`).join("")}
        <span class="badge ${isDone?'badge-success':''}">${isDone?'✓ Completed':'Not completed'}</span>
      </div>

      <div class="card" style="margin-top:18px">
        <h2 style="font-size:18px">Overview</h2>
        <p class="muted">${esc(subj.desc)}</p>
        <ul>
          ${(ch.keyPoints||[]).map(kp=>`<li>${esc(kp)}</li>`).join("")}
        </ul>
      </div>

      ${lessonBody(grade,subject,ch)}

      <div class="card" style="margin-top:20px">
        <h3>Key points to remember</h3>
        <ul>
          ${(ch.keyPoints||[]).map(kp=>`<li><strong>${esc(kp.split(':')[0]||kp)}</strong> ${kp.includes(':')?esc(kp.split(':').slice(1).join(':')):''}</li>`).join("")}
        </ul>
      </div>

      <div class="card" style="margin-top:16px;background:var(--warning-soft);border-color:#fde68a">
        <h3>⚠ Common mistakes</h3>
        <ul>
          <li>Confusing similar terms — always write definitions in full sentences.</li>
          <li>Skipping adjustments before calculating averages or ratios.</li>
          <li>Not showing working notes for numerical questions.</li>
        </ul>
      </div>

      <div class="card" style="margin-top:16px">
        <h3>📝 Exam tips</h3>
        <ul>
          <li>Use headings and sub-headings for long answers.</li>
          <li>For theory: keyword + explanation + example = full marks.</li>
          <li>For numerical: write formula → substitution → answer with unit.</li>
        </ul>
      </div>

      ${qs.length? `
        <div class="card" style="margin-top:16px">
          <div class="panel-head"><h3>Practice this topic</h3><span>${qs.length} questions</span></div>
          <div class="row">
            <a class="btn btn-primary" href="#practice?class=${grade}&subject=${subject}&chapter=${encodeURIComponent(ch.title)}">Practice ${esc(ch.title)} →</a>
            <a class="btn" href="#revision?class=${grade}&subject=${subject}&chapter=${encodeURIComponent(ch.title)}">5-min revision</a>
          </div>
        </div>
      `:""}

      <div class="row" style="margin-top:20px;justify-content:space-between">
        <div class="row">
          ${prev? `<a class="btn" href="${prev}">← Previous</a>` : `<span></span>`}
          ${next? `<a class="btn" href="${next}">Next →</a>` : `<span></span>`}
        </div>
        <div class="row">
          <button class="btn ${isDone?'':'btn-primary'}" id="mark-complete" data-key="${grade}-${subject}-${idx}">${isDone?'✓ Completed':'Mark as completed'}</button>
          <a class="btn" href="#ai?class=${grade}&subject=${subject}&chapter=${idx}">Ask AI</a>
        </div>
      </div>

      ${next? `<div class="card" style="margin-top:16px;text-align:center"><p style="color:var(--muted)">You completed this topic.</p><a class="btn btn-primary" href="${next}">Continue to next →</a></div>`:""}
    </div>
  </section>`;
}
function lessonBody(grade,subject,ch){
  // Provide structured lesson per subject/chapter — keep concise but educational
  if(subject==="accountancy" && ch.title.includes("Goodwill")){
    return `
      <h2>What is Goodwill?</h2>
      <p>Goodwill is the value of the reputation of a firm which enables it to earn higher profits than normal. It is an <strong>intangible asset</strong> and is valuable only when the firm is profitable.</p>
      <div class="callout"><span style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Factors affecting goodwill</span><p>Location, efficiency of management, market situation, special advantages like patents or contracts.</p></div>
      <h2>Valuation Methods</h2>
      <h3>1. Average Profit Method</h3>
      <p>Goodwill = Average Profit × Years' Purchase</p>
      <div class="formula"><code>Average Profit = Total Adjusted Profits ÷ Number of years</code></div>
      <p><em>Example:</em> Profits 40k,50k,60k → Average 50k → Goodwill at 2 years' purchase = 1,00,000.</p>
      <h3>2. Super Profit Method</h3>
      <p>Super Profit = Average Profit − Normal Profit, where Normal Profit = Capital Employed × Normal Rate ÷100</p>
      <div class="formula"><code>Goodwill = Super Profit × Years' Purchase</code></div>
      <h3>3. Capitalisation Method</h3>
      <div class="formula"><code>Capitalised Value = Average Profit ×100 ÷ Normal Rate<br>Goodwill = Capitalised Value − Capital Employed</code></div>
      <p>Always adjust profits for abnormal items, non-operating incomes and future changes before averaging.</p>
    `;
  }
  if(subject==="accountancy" && ch.title.includes("Admission")){
    return `
      <h2>Admission of a Partner</h2>
      <p>When a new partner is admitted, old partners sacrifice a part of their share. The new partner brings capital and his share of goodwill.</p>
      <h3>Key ratios</h3>
      <div class="formula"><code>Sacrificing Ratio = Old Ratio − New Ratio</code><br><code>Gaining Ratio = New Ratio − Old Ratio</code></div>
      <p>Revaluation Account is prepared to record changes in assets/liabilities before admission. Its profit/loss is transferred to old partners in old ratio.</p>
      <h3>Steps on admission</h3>
      <ol>
        <li>Calculate new profit sharing ratio and sacrificing ratio.</li>
        <li>Pass entry for goodwill (premium or capital method).</li>
        <li>Revalue assets and liabilities.</li>
        <li>Adjust capitals if required.</li>
      </ol>
    `;
  }
  if(subject==="economics" && ch.title.includes("Demand")){
    return `
      <h2>Law of Demand</h2>
      <p>Other things remaining constant, quantity demanded of a commodity falls with rise in price and vice versa. Inverse relationship.</p>
      <div class="callout"><b>Exceptions:</b> Giffen goods, articles of distinction, ignorance, fear of shortage.</div>
      <h3>Price Elasticity</h3>
      <div class="formula"><code>Ed = % Change in Quantity Demanded ÷ % Change in Price</code></div>
      <p>Ed = 0 perfectly inelastic, &lt;1 inelastic, =1 unitary, &gt;1 elastic, ∞ perfectly elastic.</p>
      <p><em>Example:</em> Price 10→8 (−20%), Qty 100→120 (+20%) → Ed =1 (unitary).</p>
    `;
  }
  if(subject==="business"){
    return `
      <h2>${esc(ch.title)} — Concept</h2>
      <p>${esc(ch.keyPoints[0]||"Understand the concept with definition, features and examples.")}</p>
      <h3>Important points for exams</h3>
      <ul>
        ${(ch.keyPoints||[]).slice(1).map(kp=>`<li>${esc(kp)}</li>`).join("")}
      </ul>
      <div class="callout"><b>How to answer:</b> Start with definition, give features in points, add diagram or example, conclude with importance.</div>
    `;
  }
  // default
  return `
    <h2>Concept</h2>
    <p>${esc(ch.keyPoints[0]||"Detailed explanation with syllabus-aligned content.")}</p>
    <h3>Detailed explanation</h3>
    <p>This topic is part of the CBSE 2026–27 curriculum. Focus on understanding the concept, practising related questions and revising the key points listed below.</p>
  `;
}

// --- PRACTICE ---
function pagePractice(){
  const params = new URLSearchParams(location.hash.split("?")[1]||"");
  const cls = Number(params.get("class")) || Store.getProfile().class || 12;
  const subject = params.get("subject") || "";
  const chapter = params.get("chapter") ? decodeURIComponent(params.get("chapter")) : "";
  const search = params.get("search") || "";
  document.title = "Practice · Commerce-Students";
  const filtered = getQuestions({class:cls, subject: subject||undefined, chapter: chapter||undefined, search: search||undefined});
  const diffs = ["easy","medium","hard"];
  const types = ["mcq","short","long"];
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Practice"}])}
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end">
      <div>
        <span class="eyebrow">Practice</span>
        <h1 class="page-title" style="margin-top:6px">Practice questions</h1>
        <p class="page-intro">Filter by class, subject, chapter and difficulty. Every question has a clear explanation and is saved to your Mistake Book if incorrect.</p>
      </div>
      <div class="row">
        <a class="btn btn-primary" href="#daily">Today's 10 →</a>
        <a class="btn" href="#mistakes">Mistake Book (${Store.getMistakeList().length})</a>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="row" style="gap:8px;align-items:center">
        <label style="font-weight:700;font-size:13px">Class</label>
        <select id="f-class" class="filter" style="padding:8px 12px;border-radius:999px">
          <option value="11" ${cls===11?"selected":""}>Class 11</option>
          <option value="12" ${cls===12?"selected":""}>Class 12</option>
        </select>
        <label style="font-weight:700;font-size:13px">Subject</label>
        <select id="f-subject" class="filter" style="padding:8px 12px;border-radius:999px">
          <option value="">All subjects</option>
          ${SUBJECTS.map(s=>`<option value="${s}" ${s===subject?"selected":""}>${esc(SUBJECT_NAMES[s])}</option>`).join("")}
        </select>
        <input id="f-search" class="search-input" style="flex:1;min-width:180px;padding:10px 14px" placeholder="Search: e.g. goodwill, elasticity, marketing" value="${esc(search)}">
      </div>
      <div class="row" style="margin-top:10px">
        <span style="font-size:12px;font-weight:700;color:var(--muted)">Filters:</span>
        ${chapter? `<span class="badge">Chapter: ${esc(chapter)} <a href="#practice?class=${cls}${subject?`&subject=${subject}`:''}" style="margin-left:6px">×</a></span>`:""}
        <span class="badge">${filtered.length} questions</span>
      </div>
    </div>

    ${filtered.length===0? `
      <div class="empty" style="margin-top:16px">
        <div class="big">🔍</div>
        <h3>No questions match your filters</h3>
        <p>Try a different subject or clear the search.</p>
        <a class="btn btn-primary" href="#practice?class=${cls}" style="margin-top:12px">Clear filters</a>
      </div>
    `: `
      <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">
        <p style="color:var(--muted);font-size:13px">Showing ${Math.min(filtered.length,20)} of ${filtered.length} questions · Click Start to begin a session</p>
        <button class="btn btn-primary" id="start-practice">Start practice (${Math.min(filtered.length,20)} Qs) →</button>
      </div>
      <div id="practice-preview" style="margin-top:14px;display:grid;gap:10px">
        ${filtered.slice(0,5).map(q=>`
          <div class="card" style="padding:14px">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="badge">${esc(SUBJECT_NAMES[q.subject])}</span>
              <span class="badge">${esc(q.chapter)}</span>
              <span class="badge">${q.difficulty}</span>
              <span class="badge">${q.marks} mark</span>
              <span class="badge">${q.topic}</span>
            </div>
            <p style="margin-top:8px;font-size:14px">${esc(q.question)}</p>
            ${q.type==="mcq"? `<div style="color:var(--muted);font-size:12px;margin-top:6px">A. ${esc(q.options[0]||"")} · B. ${esc(q.options[1]||"")}</div>` : `<span class="badge">Short answer</span>`}
          </div>
        `).join("")}
      </div>
    `}
  </section>`;
}

function startPracticeSession(filters, count=20){
  let qs = getQuestions(filters);
  // shuffle but deterministic slice
  qs = [...qs].sort(()=> Math.random()-0.5).slice(0,count);
  if(!qs.length){ toast("No questions for these filters"); return; }
  practiceState = {questions:qs, idx:0, answers:{}, start:Date.now(), filters, completed:false};
  location.hash = "#practice/session";
}
function pagePracticeSession(){
  if(!practiceState) { location.hash="#practice"; return ""; }
  const q = practiceState.questions[practiceState.idx];
  const total = practiceState.questions.length;
  const answered = Object.keys(practiceState.answers).length;
  const progress = Math.round((practiceState.idx)/total*100);
  const isAnswered = practiceState.answers.hasOwnProperty(practiceState.idx);
  const userAns = practiceState.answers[practiceState.idx];
  const isCorrect = isAnswered && userAns===q.correct;
  document.title = `Question ${practiceState.idx+1} of ${total} · Practice`;
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Practice",href:"#practice"},{label:`Question ${practiceState.idx+1} of ${total}`}])}
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
      <span class="eyebrow">Practice · ${esc(SUBJECT_NAMES[q.subject])} · ${esc(q.chapter)}</span>
      <span class="badge">${practiceState.idx+1} / ${total}</span>
    </div>
    <div class="progress" style="margin-top:10px"><i style="width:${progress}%"></i></div>
    <div class="question-card ${isAnswered? (isCorrect?'correct':'wrong') : ''}" style="margin-top:16px">
      <div class="q-top">
        <span class="q-num">${practiceState.idx+1}</span>
        <span class="q-text">${esc(q.question)}</span>
        <span class="q-marks">${q.marks} mark · ${q.time}s</span>
      </div>
      ${q.type==="mcq"? `
        <div class="q-opts" role="radiogroup">
          ${q.options.map((opt,i)=>`
            <label class="q-opt ${isAnswered && userAns===i? (i===q.correct?'correct': (isAnswered?'wrong':'')) : ''} ${!isAnswered && userAns===i?'selected':''} ${isAnswered && i===q.correct?'correct':''}">
              <input type="radio" name="q-opt" value="${i}" ${userAns===i?'checked':''} ${isAnswered?'disabled':''}>
              <span style="font-weight:700">${"ABCD"[i]}.</span><span>${esc(opt)}</span>
            </label>
          `).join("")}
        </div>
        <div class="q-feedback ${isAnswered?'show':''}">
          <b>${isAnswered? (isCorrect?'Correct ✓':'Incorrect — correct: '+"ABCD"[q.correct]):''}</b>
          ${isAnswered? esc(q.explanation):''}
        </div>
        ${!isAnswered? `<button class="btn btn-primary" id="submit-answer" style="margin-top:14px">Submit answer</button>` : `
          <div class="row" style="margin-top:14px">
            ${practiceState.idx < total-1? `<button class="btn btn-primary" id="next-q">Next →</button>` : `<button class="btn btn-primary" id="finish-practice">See results →</button>`}
            <button class="btn" id="explain-ai">Explain with AI</button>
          </div>
        `}
      ` : `
        <details class="card-muted" style="margin-top:12px;padding:12px;border-radius:10px;border:1px dashed var(--line)" open>
          <summary style="font-weight:700;cursor:pointer">Model answer · ${q.marks} marks</summary>
          <p style="margin-top:8px;font-size:13.5px">${esc(q.explanation)}</p>
        </details>
        <div class="row" style="margin-top:14px">
          <button class="btn ${isAnswered && isCorrect?'btn-primary':''}" data-mark-correct="1">I got it right ✓</button>
          <button class="btn ${isAnswered && !isCorrect?'':'btn-primary'}" data-mark-correct="0" style="${!isAnswered?'background:var(--danger);color:#fff;border-color:var(--danger)':''}">I got it wrong ✗</button>
        </div>
        ${isAnswered? `<div class="row" style="margin-top:14px">${practiceState.idx < total-1? `<button class="btn btn-primary" id="next-q">Next →</button>` : `<button class="btn btn-primary" id="finish-practice">See results →</button>`}</div>`:""}
      `}
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <span class="badge">${esc(q.topic)}</span>
        <span class="badge">${q.difficulty}</span>
        <span class="badge">${q.source==="original"?"Original":"Practice"}</span>
      </div>
    </div>

    <div class="card" style="margin-top:14px;padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong style="font-size:13px">Question navigation</strong>
        <span style="color:var(--muted);font-size:12px">${answered} answered</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
        ${practiceState.questions.map((qq,i)=>{
          const st = practiceState.answers.hasOwnProperty(i) ? (practiceState.answers[i]===qq.correct?'correct':'wrong') : (i===practiceState.idx?'active':'');
          const bg = st==='correct'? 'var(--success)': st==='wrong'? 'var(--danger)': st==='active'? 'var(--primary)': 'var(--card-2)';
          const col = st==='correct'||st==='wrong'||st==='active'?'#fff':'var(--fg)';
          const border = st==='active'? '2px solid var(--primary)':'1px solid var(--line)';
          return `<button data-jump="${i}" style="width:32px;height:32px;border-radius:8px;border:${border};background:${bg};color:${col};font-weight:700;font-size:12px">${i+1}</button>`;
        }).join("")}
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn btn-sm" id="quit-practice">Quit</button>
        <span style="color:var(--muted);font-size:12px">Progress is saved locally. Mistakes are added to your Mistake Book.</span>
      </div>
    </div>
  </section>`;
}
function pagePracticeResult(){
  if(!practiceState) return pagePractice();
  const total = practiceState.questions.length;
  const correct = practiceState.questions.filter((q,i)=> practiceState.answers[i]===q.correct).length;
  const accuracy = Math.round(correct/total*100);
  const time = Math.round((Date.now()-practiceState.start)/1000);
  // weak/strong
  const byTopic = {};
  practiceState.questions.forEach((q,i)=>{
    const key=`${q.subject}|${q.chapter}|${q.topic}`;
    if(!byTopic[key]) byTopic[key]={attempts:0, correct:0, topic:q.topic, chapter:q.chapter};
    byTopic[key].attempts++;
    if(practiceState.answers[i]===q.correct) byTopic[key].correct++;
  });
  const weak = Object.values(byTopic).filter(t=> t.correct/t.attempts <0.6);
  const strong = Object.values(byTopic).filter(t=> t.correct/t.attempts >=0.8);
  document.title = "Practice complete · Commerce-Students";
  return `
  <section class="shell page" style="max-width:760px;margin:0 auto">
    <div style="text-align:center;padding:18px">
      <div style="font-size:42px">🎉</div>
      <h1 class="page-title" style="text-align:center">Practice complete</h1>
      <p style="color:var(--muted)">${correct} / ${total} correct · ${accuracy}% · ${fmtTime(time)}</p>
    </div>
    <div class="stat-grid" style="margin-top:12px">
      <div class="stat"><span>Accuracy</span><strong>${accuracy}%</strong></div>
      <div class="stat"><span>Correct</span><strong>${correct}/${total}</strong></div>
      <div class="stat"><span>Time</span><strong>${fmtTime(time)}</strong></div>
    </div>
    <div class="grid-2" style="margin-top:16px">
      <div class="card">
        <strong style="color:var(--success)">✓ Strong</strong>
        ${strong.length? strong.map(s=>`<div style="margin-top:8px;padding:8px;border:1px solid var(--success-line);border-radius:9px;background:var(--success-soft);font-size:13px"><b>${esc(s.topic)}</b> · ${s.correct}/${s.attempts}</div>`).join("") : `<p style="color:var(--muted);font-size:13px;margin-top:6px">No strong topics yet — keep practicing.</p>`}
      </div>
      <div class="card">
        <strong style="color:var(--danger)">⚠ Needs work</strong>
        ${weak.length? weak.map(s=>`<div style="margin-top:8px;padding:8px;border:1px solid #fecdd3;border-radius:9px;background:var(--danger-soft);font-size:13px"><b>${esc(s.topic)}</b> · ${s.correct}/${s.attempts}</div>`).join("") : `<p style="color:var(--muted);font-size:13px;margin-top:6px">Great — no weak topics in this session.</p>`}
      </div>
    </div>
    <div class="row" style="margin-top:18px;justify-content:center">
      <a class="btn btn-primary" href="#mistakes">Review mistakes →</a>
      <button class="btn" id="practice-weak">Practice weak topics</button>
      <a class="btn" href="#practice">Back to practice</a>
    </div>
    <div class="card" style="margin-top:18px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>Review questions</h3><span style="color:var(--muted);font-size:12px">Tap to expand explanation</span>
      </div>
      <div style="margin-top:12px;display:grid;gap:8px">
        ${practiceState.questions.map((q,i)=>{
          const ua = practiceState.answers[i];
          const ok = ua===q.correct;
          return `
          <details class="card" style="padding:12px;border-color:${ok?'var(--success-line)':'#fecdd3'};background:${ok?'var(--success-soft)':'var(--danger-soft)'}">
            <summary style="cursor:pointer;font-weight:600;display:flex;gap:8px;align-items:center"><span style="width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:${ok?'var(--success)':'var(--danger)'};color:#fff;font-size:11px">${ok?'✓':'✗'}</span> Q${i+1}: ${esc(q.question.slice(0,90))}${q.question.length>90?'…':''} <span style="margin-left:auto" class="badge">${ok?'Correct':'Incorrect'}</span></summary>
            <div style="margin-top:10px;font-size:13px">
              ${q.type==="mcq"? `<p><b>Your answer:</b> ${ua!=null? "ABCD"[ua]+". "+esc(q.options[ua]):"Not answered"}<br><b>Correct:</b> ${"ABCD"[q.correct]}. ${esc(q.options[q.correct])}</p>`: `<p><b>Self-evaluated:</b> ${ok?'Correct':'Incorrect'}</p>`}
              <p style="margin-top:8px"><b>Explanation:</b> ${esc(q.explanation)}</p>
              <div style="margin-top:8px" class="row">
                <button class="btn btn-sm" data-ask-ai="${q.id}">Ask AI</button>
                <button class="btn btn-sm" data-practice-similar="${esc(q.topic)}">Practice similar</button>
              </div>
            </div>
          </details>`;
        }).join("")}
      </div>
    </div>
  </section>`;
}

// --- DAILY 10 ---
function buildDaily10(){
  const profile = Store.getProfile();
  const cls = profile.class || 12;
  const weak = Store.getWeakTopics(4);
  const mistakes = Store.getMistakeList().slice(0,3);
  const pool = getQuestions({class:cls});
  // prioritize weak topics
  let daily = [];
  weak.forEach(w=>{
    const qs = pool.filter(q=>q.topic===w.topic && !daily.find(d=>d.id===q.id)).slice(0,2);
    daily.push(...qs);
  });
  mistakes.forEach(m=>{
    const similar = pool.filter(q=>q.topic===m.question.topic && !daily.find(d=>d.id===q.id)).slice(0,1);
    daily.push(...similar);
  });
  // fill random to 10
  const remaining = pool.filter(q=>!daily.find(d=>d.id===q.id)).sort(()=>Math.random()-0.5);
  daily = [...daily, ...remaining].slice(0,10);
  if(daily.length<10){
    daily = [...pool].sort(()=>Math.random()-0.5).slice(0,10);
  }
  const focus = [...new Set(daily.map(q=>q.topic))].slice(0,3);
  return {questions:daily, focus, cls};
}
function pageDaily(){
  const cached = Store.getDaily10();
  const fresh = cached || (()=>{ const d=buildDaily10(); Store.setDaily10(d); return d; })();
  const done = fresh.completed;
  document.title = "Today's 10 · Commerce-Students";
  return `
  <section class="shell page" style="max-width:760px;margin:0 auto">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Practice",href:"#practice"},{label:"Today's 10"}])}
    <span class="eyebrow">Personalised</span>
    <h1 class="page-title">Today's 10</h1>
    <p class="page-intro">10 questions · ~10 minutes · Adapted to your weak topics and recent mistakes. Based on your recent practice — not a scientific assessment.</p>
    <div class="card" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div>
          <strong>10 questions</strong><br><span style="color:var(--muted);font-size:12px">Focus: ${fresh.focus.map(f=>esc(f)).join(" · ") || "Mixed revision"}</span>
        </div>
        <span class="badge">${fresh.cls===11?'Class 11':'Class 12'}</span>
      </div>
      <div style="margin-top:14px">
        ${done? `
          <div style="padding:14px;border:1px solid var(--success-line);background:var(--success-soft);border-radius:12px">
            <strong>✓ Today's 10 complete — ${fresh.score}/${fresh.questions.length}</strong><br>
            <span style="color:var(--muted);font-size:12px">Tomorrow's set will adapt to your progress. Come back tomorrow for a fresh set.</span>
          </div>
          <div class="row" style="margin-top:12px">
            <a class="btn btn-primary" href="#practice/session">Review</a>
            <button class="btn" id="regenerate-daily">Regenerate</button>
          </div>
        ` : `
          <button class="btn btn-primary btn-lg" id="start-daily" style="width:100%">Start Today's 10 →</button>
          <p style="color:var(--muted);font-size:12px;text-align:center;margin-top:8px">Your progress will be saved and weak topics updated.</p>
        `}
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <h3>How it adapts</h3>
      <ul style="color:var(--muted);font-size:13px;margin-top:8px">
        <li>Weak topics (accuracy &lt;50% and ≥3 attempts) are prioritised.</li>
        <li>Recent mistakes are included with similar questions.</li>
        <li>Topics not practised recently fill the remaining slots.</li>
        <li>At least 5 attempts per topic needed before strong conclusions.</li>
      </ul>
    </div>
  </section>`;
}

// --- MISTAKES ---
function pageMistakes(){
  const list = Store.getMistakeList();
  const grouped = {};
  list.forEach(m=>{
    const key = `${m.question.subject} · ${m.question.chapter}`;
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(m);
  });
  document.title = "Mistake Book · Commerce-Students";
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Practice",href:"#practice"},{label:"Mistake Book"}])}
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-end">
      <div>
        <span class="eyebrow">My Mistake Book</span>
        <h1 class="page-title" style="margin-top:6px">Your mistakes, organised.</h1>
        <p class="page-intro">Every incorrect answer is saved automatically with your answer, correct answer, explanation, topic, date and repeat count.</p>
      </div>
      <span class="badge badge-primary" style="font-size:13px">${list.length} to review</span>
    </div>
    ${list.length===0? `
      <div class="empty" style="margin-top:16px">
        <div class="big">🎉</div>
        <h3>No mistakes saved yet</h3>
        <p>Start practicing and your mistakes will appear here. Mistakes are your best teachers.</p>
        <a class="btn btn-primary" href="#practice" style="margin-top:12px">Start practice →</a>
      </div>
    `: `
      <div style="margin-top:16px;display:grid;gap:12px">
        ${Object.entries(grouped).map(([key, arr])=>`
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong>${esc(key)}</strong><span class="badge">× ${arr.length}</span>
            </div>
            <div style="margin-top:10px;display:grid;gap:8px">
              ${arr.map(m=>`
                <div class="card" style="padding:12px;background:var(--card-2)">
                  <p style="font-size:13.5px">${esc(m.question.question)}</p>
                  <div style="margin-top:8px;font-size:12px;color:var(--muted)">
                    <span class="badge badge-danger">Your: ${m.userAnswers.slice(-1)[0]?.answer!=null? "ABCD"[m.userAnswers.slice(-1)[0].answer] : "—"}</span>
                    <span class="badge badge-success">Correct: ${"ABCD"[m.question.correct]}. ${esc(m.question.options[m.question.correct]||"")}</span>
                    <span class="badge">${esc(m.question.topic)} · ${new Date(m.lastDate).toLocaleDateString("en-IN")}</span>
                    <span class="badge">× ${m.attempts} mistakes</span>
                  </div>
                  <p style="margin-top:8px;font-size:12.5px"><b>Explanation:</b> ${esc(m.question.explanation)}</p>
                  <div class="row" style="margin-top:10px">
                    <button class="btn btn-sm btn-primary" data-review-mistake="${m.id}">Review</button>
                    <button class="btn btn-sm" data-practice-similar="${esc(m.question.topic)}">Practice similar</button>
                    <button class="btn btn-sm" data-ask-ai="${m.id}">Ask AI</button>
                    <button class="btn btn-sm" data-mastered="${m.id}">Mark mastered ✓</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `}
    <div class="card" style="margin-top:16px">
      <h3>How to use Mistake Book</h3>
      <ul style="color:var(--muted);font-size:13px;margin-top:6px">
        <li>Review each mistake and read the explanation.</li>
        <li>Tap <em>Practice similar</em> to get 5 new questions on the same topic.</li>
        <li>When you can answer a similar question correctly twice, mark it mastered.</li>
      </ul>
    </div>
  </section>`;
}

// --- TESTS ---
function pageTests(){
  const profile = Store.getProfile();
  const cls = profile.class || 12;
  document.title = "Tests · Commerce-Students";
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Tests"}])}
    <span class="eyebrow">Exam mode</span>
    <h1 class="page-title">Test yourself — like the real exam.</h1>
    <p class="page-intro">Choose a mode, set syllabus and time limit. Timer, navigation, mark-for-review and confirmation before submit — just like the board exam.</p>

    <div class="grid-2" style="margin-top:18px">
      <div class="card card-hover" style="cursor:pointer" data-test-mode="quick">
        <span class="badge">5–10 min</span>
        <h3 style="margin-top:8px">Quick Test</h3>
        <p style="color:var(--muted);font-size:13px">10 MCQ · 10 minutes · Mixed syllabus</p>
        <div class="row" style="margin-top:12px"><span class="btn btn-sm btn-primary">Start quick test →</span></div>
      </div>
      <div class="card card-hover" style="cursor:pointer" data-test-mode="chapter">
        <span class="badge">15–20 min</span>
        <h3 style="margin-top:8px">Chapter Test</h3>
        <p style="color:var(--muted);font-size:13px">15 Qs · Chapter-wise · Auto-graded</p>
        <div class="row" style="margin-top:12px"><span class="btn btn-sm btn-primary">Choose chapter →</span></div>
      </div>
      <div class="card card-hover" style="cursor:pointer" data-test-mode="subject">
        <span class="badge">60 min</span>
        <h3 style="margin-top:8px">Subject Test</h3>
        <p style="color:var(--muted);font-size:13px">Full subject · 3 marks split as per CBSE</p>
        <div class="row" style="margin-top:12px"><span class="btn btn-sm btn-primary">Build subject test →</span></div>
      </div>
      <div class="card card-hover" style="cursor:pointer" data-test-mode="full">
        <span class="badge">3 hours</span>
        <h3 style="margin-top:8px">Full Mock</h3>
        <p style="color:var(--muted);font-size:13px">80 marks theory · CBSE format · All subjects</p>
        <div class="row" style="margin-top:12px"><span class="btn btn-sm btn-primary">Start mock →</span></div>
      </div>
    </div>

    <div class="card" style="margin-top:18px">
      <h3>Build a custom test</h3>
      <div class="row" style="margin-top:12px;flex-wrap:wrap">
        <select id="test-class" class="filter"><option value="11" ${cls===11?"selected":""}>Class 11</option><option value="12" ${cls===12?"selected":""}>Class 12</option></select>
        <select id="test-subject" class="filter">
          <option value="">All subjects</option>
          ${SUBJECTS.map(s=>`<option value="${s}">${esc(SUBJECT_NAMES[s])}</option>`).join("")}
        </select>
        <select id="test-count" class="filter">
          <option value="10">10 questions</option>
          <option value="15" selected>15 questions</option>
          <option value="20">20 questions</option>
          <option value="30">30 questions</option>
        </select>
        <select id="test-time" class="filter">
          <option value="10">10 min</option>
          <option value="20">20 min</option>
          <option value="30" selected>30 min</option>
          <option value="60">60 min</option>
          <option value="180">180 min</option>
        </select>
        <button class="btn btn-primary" id="start-custom-test">Generate test →</button>
      </div>
      <p style="color:var(--muted);font-size:12px;margin-top:8px">Time limit is advisory. We don't auto-submit when you navigate — only when you confirm submit.</p>
    </div>

    ${Store.getProgress().tests.length? `
      <div class="card" style="margin-top:16px">
        <h3>Recent tests</h3>
        <div style="margin-top:10px;display:grid;gap:8px">
          ${Store.getProgress().tests.slice(-5).reverse().map(t=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card-2)">
              <span style="font-size:13px"><b>${esc(t.title||"Test")}</b> · ${t.score}/${t.total} · ${t.accuracy}%</span>
              <span style="color:var(--muted);font-size:11px">${new Date(t.date).toLocaleDateString("en-IN")} · ${fmtTime(t.timeUsed||0)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `:""}
  </section>`;
}
function startTest({cls, subject, count, minutes, mode}){
  let pool = getQuestions({class:cls, subject: subject||undefined});
  if(mode==="chapter" && subject){
    // pick chapter selection modal? for now pick first chapter's questions or all
  }
  pool = [...pool].sort(()=>Math.random()-0.5).slice(0,count);
  if(!pool.length){ toast("No questions for those filters"); return; }
  testState = {
    questions: pool,
    answers:{},
    marked:{},
    start:Date.now(),
    duration: minutes*60,
    remaining: minutes*60,
    submitted:false,
    title: `${mode||"Custom"} · ${subject? SUBJECT_NAMES[subject]: 'Mixed'} · ${count} Qs`,
    total:pool.length,
  };
  location.hash="#test/session";
  // timer handled in page render via interval
}
function pageTestSession(){
  if(!testState) { location.hash="#tests"; return ""; }
  const q = testState.questions[testState.current||0];
  const idx = testState.current||0;
  const total = testState.questions.length;
  document.title = `Test · Question ${idx+1}/${total}`;
  return `
  <section class="shell page" style="max-width:900px;margin:0 auto">
    <div style="position:sticky;top:64px;z-index:10;background:var(--bg);padding:10px 0;border-bottom:1px solid var(--line);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <span class="badge badge-primary" id="test-timer">${fmtTime(testState.remaining||testState.duration)}</span>
      <span style="font-weight:700">${esc(testState.title)}</span>
      <div class="row">
        <button class="btn btn-sm" id="test-submit">Submit test</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start">
      <div class="question-card">
        <div class="q-top">
          <span class="q-num">${idx+1}</span>
          <span class="q-text">${esc(q.question)}</span>
          <span class="q-marks">${q.marks} mark</span>
        </div>
        ${q.type==="mcq"? `
          <div class="q-opts">
            ${q.options.map((opt,i)=>`
              <label class="q-opt ${testState.answers[idx]==i?'selected':''}">
                <input type="radio" name="test-opt" value="${i}" ${testState.answers[idx]==i?'checked':''}>
                <span>${"ABCD"[i]}.</span><span>${esc(opt)}</span>
              </label>
            `).join("")}
          </div>
        `: `
          <div style="margin-top:12px">
            <textarea id="test-text-answer" placeholder="Type your answer here..." style="width:100%;min-height:120px;padding:12px;border:1.5px solid var(--line);border-radius:11px;background:var(--card)">${esc(testState.answers[idx]||"")}</textarea>
            <p style="color:var(--muted);font-size:12px;margin-top:6px">For theory questions, write your answer, then compare with model on result page.</p>
          </div>
        `}
        <div class="row" style="margin-top:14px">
          <button class="btn btn-sm" id="test-prev" ${idx===0?"disabled":""}>← Previous</button>
          <button class="btn btn-sm" id="test-next" ${idx===total-1?"disabled":""}>Next →</button>
          <button class="btn btn-sm" id="test-mark" style="${testState.marked[idx]?'background:var(--warning);color:#fff;border-color:var(--warning)':''}">${testState.marked[idx]?'★ Marked':'☆ Mark for review'}</button>
          <button class="btn btn-sm" id="test-clear">Clear</button>
        </div>
        <div style="margin-top:10px" class="row">
          <span class="badge">${esc(q.topic)}</span>
          <span class="badge">${q.difficulty}</span>
        </div>
      </div>
      <div class="card" style="padding:14px;position:sticky;top:124px">
        <strong style="font-size:13px">Question navigation</strong>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:10px">
          ${testState.questions.map((_,i)=>{
            const isAns = testState.answers.hasOwnProperty(i) && testState.answers[i]!==null && testState.answers[i]!=="";
            const isMarked = testState.marked[i];
            const isCurrent = i===idx;
            let bg="var(--card-2)", col="var(--fg)", border="1px solid var(--line)";
            if(isCurrent){ bg="var(--primary)"; col="#fff"; }
            else if(isAns && isMarked){ bg="var(--warning)"; col="#fff"; }
            else if(isAns){ bg="var(--success)"; col="#fff"; }
            else if(isMarked){ bg="var(--warning-soft)"; col="var(--warning)"; border="1px solid #fde68a"; }
            return `<button data-test-jump="${i}" style="height:36px;border-radius:9px;border:${border};background:${bg};color:${col};font-weight:700">${i+1}</button>`;
          }).join("")}
        </div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--muted)">
          <span style="display:flex;align-items:center;gap:4px"><i style="width:10px;height:10px;background:var(--success);border-radius:2px;display:inline-block"></i> Answered</span>
          <span style="display:flex;align-items:center;gap:4px"><i style="width:10px;height:10px;background:var(--warning);border-radius:2px;display:inline-block"></i> Marked</span>
          <span style="display:flex;align-items:center;gap:4px"><i style="width:10px;height:10px;background:var(--primary);border-radius:2px;display:inline-block"></i> Current</span>
        </div>
        <div style="margin-top:12px;display:grid;gap:8px">
          <div style="font-size:12px;color:var(--muted)">${Object.keys(testState.answers).filter(k=>testState.answers[k]!==null&&testState.answers[k]!=="").length} answered · ${Object.keys(testState.marked).filter(k=>testState.marked[k]).length} marked · ${total - Object.keys(testState.answers).filter(k=>testState.answers[k]!==null&&testState.answers[k]!=="").length} unanswered</div>
          <button class="btn btn-primary" id="test-submit-2" style="width:100%">Submit test →</button>
          <p style="color:var(--muted);font-size:11px;text-align:center">You'll see a confirmation before final submit.</p>
        </div>
      </div>
    </div>
  </section>`;
}
function submitTest(){
  if(!testState) return;
  const total = testState.questions.length;
  let correct=0, answered=0;
  testState.questions.forEach((q,i)=>{
    if(testState.answers[i]!=null && testState.answers[i]!==""){
      answered++;
      if(q.type==="mcq" && testState.answers[i]===q.correct) correct++;
      // for non-mcq we don't auto grade; count as ungraded
    }
  });
  const timeUsed = Math.round((Date.now()-testState.start)/1000);
  const accuracy = total? Math.round(correct/total*100):0;
  // calculate per chapter
  const perChapter={};
  testState.questions.forEach((q,i)=>{
    const ch=q.chapter;
    if(!perChapter[ch]) perChapter[ch]={total:0, correct:0};
    perChapter[ch].total++;
    if(q.type==="mcq" && testState.answers[i]===q.correct) perChapter[ch].correct++;
  });
  const result = {
    title:testState.title,
    total,
    answered,
    correct,
    accuracy,
    timeUsed,
    perChapter,
    duration:testState.duration,
    answers:{...testState.answers},
    questions:testState.questions,
  };
  Store.addTestResult(result);
  testState.submitted = true;
  testState.result = result;
  location.hash="#test/result";
  // record attempts for MCQ only
  testState.questions.forEach((q,i)=>{
    const ans = testState.answers[i];
    if(q.type==="mcq"){
      const ok = ans===q.correct;
      Store.recordAttempt({questionId:q.id, correct:ok, time: Math.round(timeUsed/total), chapter:q.chapter, topic:q.topic, subject:q.subject, class:q.class});
      if(!ok && ans!=null) Store.addMistake(q, ans);
    }
  });
}
function pageTestResult(){
  const res = testState?.result || Store.getProgress().tests.slice(-1)[0];
  if(!res) { location.hash="#tests"; return ""; }
  document.title = "Test result · Commerce-Students";
  const weakCh = Object.entries(res.perChapter||{}).map(([ch,v])=>({ch, acc: v.total? Math.round(v.correct/v.total*100):0, ...v})).sort((a,b)=>a.acc-b.acc).slice(0,3);
  return `
  <section class="shell page" style="max-width:800px;margin:0 auto">
    <div style="text-align:center">
      <div style="font-size:42px">📊</div>
      <h1 class="page-title" style="text-align:center">Test complete</h1>
      <p style="color:var(--muted)">${res.title}</p>
    </div>
    <div class="stat-grid" style="margin-top:18px">
      <div class="stat"><span>Score</span><strong>${res.correct} / ${res.total}</strong></div>
      <div class="stat"><span>Accuracy</span><strong>${res.accuracy}%</strong></div>
      <div class="stat"><span>Time</span><strong>${fmtTime(res.timeUsed||0)} / ${fmtTime(res.duration||0)}</strong></div>
    </div>
    <div class="grid-3" style="margin-top:14px">
      <div class="stat"><span>Answered</span><strong>${res.answered}/${res.total}</strong></div>
      <div class="stat"><span>Unanswered</span><strong>${res.total-res.answered}</strong></div>
      <div class="stat"><span>Incorrect</span><strong>${res.answered-res.correct}</strong></div>
    </div>

    ${weakCh.length? `
      <div class="card" style="margin-top:16px">
        <h3>Topic performance</h3>
        <div style="margin-top:10px;display:grid;gap:8px">
          ${Object.entries(res.perChapter).map(([ch,v])=>{
            const acc = v.total? Math.round(v.correct/v.total*100):0;
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card-2)">
              <span style="font-weight:600;font-size:13px">${esc(ch)}</span>
              <span class="badge ${acc>=75?'badge-success':acc>=50?'badge-warn':'badge-danger'}">${acc}% · ${v.correct}/${v.total}</span>
            </div>`;
          }).join("")}
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Recommended next steps</h3>
        <ul style="margin-top:8px;color:var(--muted);font-size:13px">
          ${weakCh.map(w=>`<li>Review <strong style="color:var(--fg)">${esc(w.ch)}</strong> — ${w.acc}% in this test (${w.correct}/${w.total})</li>`).join("")}
          <li>Review ${res.answered-res.correct} mistakes in Mistake Book</li>
          <li>Take a 10-question quiz on your weakest chapter</li>
        </ul>
        <div class="row" style="margin-top:12px">
          <a class="btn btn-primary" href="#mistakes">Review mistakes</a>
          <button class="btn" id="retake-weak">Practice weak chapter</button>
        </div>
      </div>
    `:""}

    <div class="card" style="margin-top:16px">
      <h3>Review answers</h3>
      <div style="margin-top:10px;display:grid;gap:10px">
        ${(res.questions||testState.questions||[]).map((q,i)=>{
          const ua = res.answers[i];
          const isMcq = q.type==="mcq";
          const ok = isMcq && ua===q.correct;
          const status = !isMcq? "Theory — compare with model" : (ua==null? "Unanswered" : ok?"Correct":"Incorrect");
          return `
          <details class="card" style="padding:12px;border-color:${isMcq?(ok?'var(--success-line)': ua==null?'var(--line)':'#fecdd3'):'var(--line)'};background:${isMcq?(ok?'var(--success-soft)': ua==null?'var(--card-2)':'var(--danger-soft)'):'var(--card-2)'}">
            <summary style="cursor:pointer;font-weight:600;display:flex;gap:8px;align-items:center">
              <span style="width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:${isMcq?(ok?'var(--success)':ua==null?'var(--muted)':'var(--danger)'):'var(--primary)'};color:#fff;font-size:11px">${isMcq?(ok?'✓':ua==null?'—':'✗'):'≡'}</span>
              Q${i+1}: ${esc(q.question.slice(0,90))}${q.question.length>90?'…':''}
              <span class="badge" style="margin-left:auto">${status}</span>
            </summary>
            <div style="margin-top:10px;font-size:13px">
              ${isMcq? `
                <p><b>Your answer:</b> ${ua!=null? "ABCD"[ua]+". "+esc(q.options[ua]):"<em>Not answered</em>"}<br>
                <b>Correct:</b> ${"ABCD"[q.correct]}. ${esc(q.options[q.correct])}</p>
                <p style="margin-top:8px"><b>Explanation:</b> ${esc(q.explanation)}</p>
              `:`<p><b>Your answer:</b> ${esc(ua||"<em>Not answered</em>")}</p><p style="margin-top:8px"><b>Model:</b> ${esc(q.explanation)}</p>`}
            </div>
          </details>`;
        }).join("")}
      </div>
    </div>
    <div class="row" style="margin-top:18px;justify-content:center">
      <a class="btn btn-primary" href="#tests">Take another test</a>
      <a class="btn" href="#practice">Practice</a>
      <a class="btn" href="#dashboard">Dashboard</a>
    </div>
  </section>`;
}

// --- REVISION ---
function pageRevision(){
  const params = new URLSearchParams(location.hash.split("?")[1]||"");
  const cls = Number(params.get("class")) || Store.getProfile().class || 12;
  document.title = "Revision · Commerce-Students";
  // quick filters for formula bank etc are handled via tabs via hash #revision/formulas etc
  const sub = location.hash.split("/")[1] || "";
  if(sub==="formulas") return pageFormulas();
  if(sub==="definitions") return pageDefinitions();
  if(sub.startsWith("formulas")|| sub.startsWith("definitions")) return pageRevision();
  const weak = Store.getWeakTopics(5);
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Revision"}])}
    <span class="eyebrow">Revision centre</span>
    <h1 class="page-title">Revise faster, remember longer.</h1>
    <p class="page-intro">Pick a mode based on time and need: 5-minute rapid, chapter drill, weak topics, formulas or definitions.</p>

    <div class="grid-2" style="margin-top:18px">
      <a class="card card-hover" href="#revision/5min">
        <span class="badge badge-primary">5 min</span>
        <h3 style="margin-top:8px">5-Minute Revision</h3>
        <p style="color:var(--muted);font-size:13px">Key concept → formula → example → common mistake → 3 rapid Qs. For last-night revision.</p>
      </a>
      <a class="card card-hover" href="#revision/formulas">
        <span class="badge">Formula Bank</span>
        <h3 style="margin-top:8px">Formula Bank</h3>
        <p style="color:var(--muted);font-size:13px">${FORMULAS.length} formulas · searchable by subject/chapter · copy ready</p>
      </a>
      <a class="card card-hover" href="#revision/definitions">
        <span class="badge">Definitions</span>
        <h3 style="margin-top:8px">Important Definitions</h3>
        <p style="color:var(--muted);font-size:13px">${DEFINITIONS.length} definitions · with related terms · exam-oriented</p>
      </a>
      <a class="card card-hover" href="#mistakes">
        <span class="badge badge-danger">${Store.getMistakeList().length} to review</span>
        <h3 style="margin-top:8px">Mistake Revision</h3>
        <p style="color:var(--muted);font-size:13px">Your personal mistake bank grouped by chapter.</p>
      </a>
    </div>

    <div class="card" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <h3>Weak topics · Based on your recent practice</h3>
        <span class="badge">${weak.length} topics</span>
      </div>
      ${weak.length? `
        <div style="margin-top:12px;display:grid;gap:8px">
          ${weak.map(w=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--card-2)">
              <div><strong style="font-size:13px">${esc(w.topic)}</strong><br><span style="color:var(--muted);font-size:11px">${esc(w.chapter)} · ${w.accuracy}% · ${w.attempts} Qs</span></div>
              <div class="row">
                <a class="btn btn-sm btn-primary" href="#practice?search=${encodeURIComponent(w.topic)}">Practice</a>
                <a class="btn btn-sm" href="#revision/5min?topic=${encodeURIComponent(w.topic)}">Revise</a>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="row" style="margin-top:12px">
          <a class="btn btn-primary" href="#practice?class=${cls}">Practice weak topics →</a>
          <span style="color:var(--muted);font-size:12px">At least 5 attempts required before marking Strong.</span>
        </div>
      `:`<div class="empty" style="margin-top:12px;padding:20px"><p>Solve at least 3 questions per topic to see weak-topic analysis here.</p><a class="btn btn-sm" href="#practice" style="margin-top:10px">Start practicing</a></div>`}
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Chapter revision · Pick a chapter</h3>
      <div style="margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${SUBJECTS.slice(0,3).map(s=>`
          <div>
            <strong style="font-size:13px">${esc(SUBJECT_NAMES[s])}</strong>
            <div style="margin-top:6px;display:grid;gap:6px">
              ${getChapters(cls,s).slice(0,4).map(ch=>`
                <a class="badge" href="#study/${cls}/${s}" style="justify-content:space-between;display:flex;padding:8px 10px;border-radius:9px">${esc(ch.title.slice(0,28))}<span>→</span></a>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  </section>`;
}
function page5Min(){
  const params=new URLSearchParams(location.hash.split("?")[1]||"");
  const topic=params.get("topic")||"Goodwill";
  const cls=Store.getProfile().class||12;
  // find chapter containing topic
  let ch=null, subj=null;
  for(const s of SUBJECTS){
    for(const c of getChapters(cls,s)){
      if(c.title.toLowerCase().includes(topic.toLowerCase()) || c.topics.some(t=>t.toLowerCase().includes(topic.toLowerCase()))){
        ch=c; subj=s; break;
      }
    }
    if(ch) break;
  }
  if(!ch){ ch=getChapters(cls,"accountancy")[1]||getChapters(cls,SUBJECTS[0])[0]; subj="accountancy"; }
  const formulas = FORMULAS.filter(f=> f.chapter.toLowerCase().includes(ch.title.toLowerCase()) || f.subject===subj).slice(0,2);
  const qs = getQuestions({class:cls, subject:subj, chapter:ch.title}).slice(0,3);
  document.title = `5-Minute: ${ch.title} · Revision`;
  return `
  <section class="shell page" style="max-width:760px;margin:0 auto">
    ${breadcrumbs([{label:"Revision",href:"#revision"},{label:"5-Minute Revision"}])}
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="eyebrow">5-Minute Revision</span>
      <span class="badge">01–06</span>
    </div>
    <h1 class="page-title">${esc(ch.title)}</h1>
    <p style="color:var(--muted);font-size:13px">${esc(SUBJECT_NAMES[subj])} · Class ${cls} · ~5 minutes</p>
    <div class="progress" style="margin-top:12px"><i style="width:16%"></i></div>

    <div style="margin-top:18px;display:grid;gap:12px">
      <div class="card">
        <span class="badge">01 · Definition</span>
        <h3 style="margin-top:8px">${esc(ch.keyPoints[0]||"Key definition")}</h3>
        <p style="color:var(--muted);font-size:13px;margin-top:6px">${esc(ch.keyPoints[1]||"Understand the core definition before formulas.")}</p>
      </div>
      <div class="card">
        <span class="badge">02 · Methods</span>
        <h3 style="margin-top:8px">Methods & steps</h3>
        <ul style="margin-top:8px">
          ${(ch.keyPoints||[]).slice(1,3).map(kp=>`<li style="font-size:13.5px">${esc(kp)}</li>`).join("")}
        </ul>
      </div>
      <div class="card">
        <span class="badge">03 · Formula</span>
        <h3 style="margin-top:8px">Key formulas</h3>
        ${formulas.length? formulas.map(f=>`
          <div style="margin-top:8px;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--accent-soft)">
            <strong>${esc(f.name)}</strong><br>
            <code style="font-family:var(--mono);font-size:13px">${esc(f.formula)}</code><br>
            <span style="color:var(--muted);font-size:12px">${esc(f.example)}</span>
          </div>
        `).join("") : `<p style="color:var(--muted);font-size:13px">No formula for this chapter — focus on concepts.</p>`}
      </div>
      <div class="card">
        <span class="badge">04 · Example</span>
        <h3 style="margin-top:8px">Worked example</h3>
        <p style="font-size:13.5px">Average profit of 4 years = 60k, normal rate 10% on 4L. Capitalised value = 60k×100/10=6L, Goodwill=6L−4L=2L.</p>
      </div>
      <div class="card" style="background:var(--warning-soft);border-color:#fde68a">
        <span class="badge badge-warn">05 · Common mistake</span>
        <h3 style="margin-top:8px">Don't forget adjustments</h3>
        <p style="font-size:13px">Abnormal losses, non-operating incomes and expected future changes must be adjusted before averaging profits.</p>
      </div>
      <div class="card">
        <span class="badge">06 · Rapid questions</span>
        <h3 style="margin-top:8px">3 rapid questions</h3>
        <div style="margin-top:10px;display:grid;gap:8px">
          ${(qs.length? qs : getQuestions({class:cls}).slice(0,3)).map((q,i)=>`
            <details style="padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card-2)">
              <summary style="cursor:pointer;font-weight:600">Q${i+1}. ${esc(q.question)}</summary>
              <p style="margin-top:8px;font-size:13px">${q.type==="mcq"? q.options.map((o,oi)=>`${"ABCD"[oi]}. ${esc(o)}`).join(" · ")+`<br><b>Answer:</b> ${"ABCD"[q.correct]} · ${esc(q.explanation)}` : esc(q.explanation)}</p>
            </details>
          `).join("")}
        </div>
      </div>
    </div>
    <div class="row" style="margin-top:16px;justify-content:center">
      <a class="btn btn-primary" href="#practice?class=${cls}&subject=${subj}&chapter=${encodeURIComponent(ch.title)}">Practice this chapter →</a>
      <a class="btn" href="#revision">Back to revision</a>
    </div>
  </section>`;
}
function pageFormulas(){
  const params=new URLSearchParams(location.hash.split("?")[1]||"");
  const q=(params.get("search")||"").toLowerCase();
  const subjFilter=params.get("subject")||"";
  const filtered = FORMULAS.filter(f=>{
    if(subjFilter && f.subject!==subjFilter) return false;
    if(q && !(f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q) || f.chapter.toLowerCase().includes(q))) return false;
    return true;
  });
  document.title="Formula Bank · Commerce-Students";
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Revision",href:"#revision"},{label:"Formula Bank"}])}
    <span class="eyebrow">Revision · Formula Bank</span>
    <h1 class="page-title">Formula Bank</h1>
    <p class="page-intro">Searchable by subject, chapter and topic. Tap copy to copy a formula. Every formula includes variables, example and common mistake.</p>
    <div class="card" style="margin-top:14px">
      <div class="row">
        <input id="formula-search" class="search-input" placeholder="Search formulas: e.g. goodwill, elasticity, multiplier" value="${esc(params.get("search")||"")}" style="flex:1">
        <select id="formula-subject" class="filter">
          <option value="">All subjects</option>
          ${SUBJECTS.map(s=>`<option value="${s}" ${subjFilter===s?"selected":""}>${esc(SUBJECT_NAMES[s])}</option>`).join("")}
        </select>
      </div>
      <div style="margin-top:8px;color:var(--muted);font-size:12px">${filtered.length} formulas</div>
    </div>
    <div style="margin-top:14px;display:grid;gap:10px">
      ${filtered.map(f=>`
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
            <div>
              <span class="badge">${esc(SUBJECT_NAMES[f.subject])} · ${esc(f.chapter)}</span>
              <h3 style="margin-top:6px;font-size:16px">${esc(f.name)}</h3>
            </div>
            <button class="btn btn-sm" data-copy-formula="${esc(f.formula)}">Copy</button>
          </div>
          <div style="margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--accent-soft);font-family:var(--serif);font-size:15px">${esc(f.formula)}</div>
          <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card-2)"><strong style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Variables</strong><p style="font-size:13px;margin-top:4px">${esc(f.vars)}</p></div>
            <div style="padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card-2)"><strong style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Example</strong><p style="font-size:13px;margin-top:4px">${esc(f.example)}</p></div>
          </div>
          <p style="margin-top:8px;color:var(--danger);font-size:12px"><b>Common mistake:</b> ${esc(f.mistake)}</p>
        </div>
      `).join("")}
      ${filtered.length===0? `<div class="empty"><h3>No formulas found</h3><p>Try a different search term.</p></div>`:""}
    </div>
  </section>`;
}
function pageDefinitions(){
  const params=new URLSearchParams(location.hash.split("?")[1]||"");
  const q=(params.get("search")||"").toLowerCase();
  const filtered = DEFINITIONS.filter(d=>{
    if(q && !(d.term.toLowerCase().includes(q) || d.definition.toLowerCase().includes(q))) return false;
    return true;
  });
  document.title="Definitions · Commerce-Students";
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Revision",href:"#revision"},{label:"Definitions"}])}
    <span class="eyebrow">Revision · Definitions</span>
    <h1 class="page-title">Important Definitions</h1>
    <p class="page-intro">Searchable definition bank with related terms. Write keyword + full sentence in exams.</p>
    <div class="card" style="margin-top:14px">
      <input id="def-search" class="search-input" placeholder="Search definitions: e.g. goodwill, planning, elasticity" value="${esc(params.get("search")||"")}">
      <div style="margin-top:8px;color:var(--muted);font-size:12px">${filtered.length} definitions</div>
    </div>
    <div style="margin-top:14px;display:grid;gap:10px">
      ${filtered.map(d=>`
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:10px">
            <h3 style="font-size:16px">${esc(d.term)}</h3>
            <span class="badge">${esc(SUBJECT_NAMES[d.subject]||d.subject)}</span>
          </div>
          <p style="margin-top:8px;font-size:13.5px;line-height:1.6">${esc(d.definition)}</p>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            ${d.related.map(r=>`<span class="badge">${esc(r)}</span>`).join("")}
          </div>
        </div>
      `).join("")}
      ${filtered.length===0? `<div class="empty"><h3>No definitions found</h3><p>Try a different search term.</p></div>`:""}
    </div>
  </section>`;
}

// --- AI ---
function pageAI(){
  const params=new URLSearchParams(location.hash.split("?")[1]||"");
  const cls = Number(params.get("class")) || aiContext.class || 12;
  const subject = params.get("subject") || aiContext.subject || "accountancy";
  const chapterIdx = params.get("chapter")!=null ? Number(params.get("chapter")) : aiContext.chapter;
  const ch = getChapters(cls, subject)[chapterIdx];
  const contextLabel = ch? `${SUBJECT_NAMES[subject]} · ${ch.title} · Class ${cls}` : `${SUBJECT_NAMES[subject]} · Class ${cls}`;
  document.title="AI Study Assistant · Commerce-Students";
  const provName = getAIProvider().name;
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"AI Study Assistant"}])}
    <span class="eyebrow">AI Study Assistant · Live — ${esc(provName)}</span>
    <h1 class="page-title">Your Commerce tutor — real AI.</h1>
    <p class="page-intro">Context-aware help for the chapter you're studying. Flow: <b>Question → Real API → Real Response → Display</b> (no silent demos). <b>Live AI</b> via <a href="https://pollinations.ai" target="_blank" rel="noreferrer" style="text-decoration:underline">Pollinations</a> (free, no key, rate-limited) + <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style="text-decoration:underline">Gemini</a> (free key, most reliable — 30 sec setup). <span style="background:var(--warning-soft);padding:2px 6px;border-radius:6px;border:1px solid #fde68a">Real responses are labeled <b>✓ Real AI response</b> — demo is <b>never</b> shown as if it were AI.</span></p>

    <div class="card" style="margin-top:14px;background:var(--card-2);border:1px dashed var(--line)">
      <strong style="font-size:13px">Live AI key (recommended for reliability)</strong>
      <p style="color:var(--muted);font-size:12px;margin:4px 0 8px">For <b>reliable live AI</b> add a free Gemini key (AIza...) from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style="text-decoration:underline">aistudio.google.com/app/apikey</a> — free, no credit card, 1-min. Or a Pollinations key (pk_/sk_) from <a href="https://enter.pollinations.ai" target="_blank" rel="noreferrer" style="text-decoration:underline">enter.pollinations.ai</a>. Stored locally only in <code>localStorage</code> on YOUR device — not sent to our server, not committed to GitHub.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">
        <input id="ai-key-input" type="password" placeholder="Paste Gemini (AIza...) or Pollinations (pk_/sk_...) key" value="${esc(Store.getApiKey? Store.getApiKey() : "")}" style="flex:1;min-width:240px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--card)">
        <button class="btn btn-primary" id="save-ai-key">Save key</button>
        <button class="btn" id="clear-ai-key">Clear</button>
        <button class="btn" id="test-ai-key">Test live AI</button>
      </div>
      <div id="ai-key-status" style="margin-top:8px;font-size:12px;color:var(--muted)">${(Store.getApiKey && Store.getApiKey()) ? `Saved: ${esc(Store.getApiKey().slice(0,6))}**** · <span style="color:var(--success)">Live AI will use your key (most reliable)</span> · Provider: ${esc(provName)}` : `No key saved · Using free Pollinations (rate-limited) · Provider: ${esc(provName)} · <b>Tip:</b> Add Gemini key for instant live responses.`}</div>
      <details style="margin-top:10px;padding:10px;background:var(--warning-soft);border:1px solid #fde68a;border-radius:10px;font-size:12px">
        <summary style="cursor:pointer;font-weight:700">⚠️ GitHub Pages security note — why we need a backend for true security</summary>
        <p style="margin-top:8px">GitHub Pages is <b>static hosting</b> — every API call happens <b>in your browser</b>. That means a Gemini key saved here is sent <b>directly from your browser to Google</b> (inspectable in DevTools → Network). It's <b>not</b> hidden from someone who can open DevTools on your device, and if you share a device they could extract it. For a personal device this is low risk (Google free-tier keys have generous free quota and you can rotate/regenerate anytime at aistudio.google.com), but for a <b>production site with many users</b> a backend proxy is the correct design: browser → your server (keeps the secret key server-side) → Gemini, so the key never leaves the server.</p>
        <p style="margin-top:6px"><b>We do NOT fake a key or pretend demo is real.</b> See <code>server/README.md</code> + <code>server/index.js</code> for a ready-to-deploy Node/Express proxy (5 min) that moves the key server-side. For now, localStorage + direct calls = working real AI with explicit labeling.</p>
        <p style="margin-top:6px"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style="text-decoration:underline">Get / rotate your free Gemini key →</a> &nbsp;|&nbsp; <a href="#" onclick="window.CS.showAIDebug&&window.CS.showAIDebug();return false" style="text-decoration:underline">Show AI debug</a></p>
      </details>
    </div>

    <div class="card" style="margin-top:14px;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;background:var(--accent-soft)">
      <div>
        <strong style="font-size:13px">Current context</strong><br>
        <span style="color:var(--muted);font-size:13px">${esc(contextLabel)}</span>
      </div>
      <div class="row">
        <select id="ai-class" class="filter">
          <option value="11" ${cls===11?"selected":""}>Class 11</option>
          <option value="12" ${cls===12?"selected":""}>Class 12</option>
        </select>
        <select id="ai-subject" class="filter">
          ${SUBJECTS.map(s=>`<option value="${s}" ${s===subject?"selected":""}>${esc(SUBJECT_NAMES[s])}</option>`).join("")}
        </select>
      </div>
    </div>

    <div style="margin-top:16px" class="grid-2">
      <div class="card">
        <h3>What do you want help with?</h3>
        <div style="margin-top:12px;display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
          ${[
            ["Explain","Explain the concept simply"],
            ["Solve","Solve a numerical step-by-step"],
            ["Teach Me","Teach me like a teacher"],
            ["Quiz Me","Quiz me with 3 Qs"],
            ["Check Answer","Check my answer"],
            ["Hint","Give me a hint"],
            ["Simplify","Simplify for quick revision"],
            ["Examiner","Examiner mode — strict"],
          ].map(([label,desc])=>`
            <button class="action-card" data-ai-mode="${label.toLowerCase().replace(' ','-')}" style="padding:12px">
              <span><b>${label}</b><span>${desc}</span></span>
            </button>
          `).join("")}
        </div>
        <div style="margin-top:14px">
          <label style="font-weight:700;font-size:13px">Your question</label>
          <textarea id="ai-input" placeholder="E.g. Explain goodwill super profit method with example" style="width:100%;min-height:90px;margin-top:6px;padding:12px;border:1.5px solid var(--line);border-radius:12px;background:var(--card)"></textarea>
          <div class="row" style="margin-top:10px">
            <button class="btn btn-primary" id="ai-ask">Ask AI →</button>
            <span style="color:var(--muted);font-size:12px">Live AI · Powered by Pollinations (free) · Not a substitute for teacher/textbook</span>
          </div>
        </div>
      </div>
      <div class="card" id="ai-output" style="min-height:320px">
        <span class="badge">AI response</span>
        <h3 style="margin-top:8px">Ask a question to see a structured answer</h3>
        <p style="color:var(--muted);font-size:13px;margin-top:6px">AI will respond with: <em>Simple explanation → Why it happens → Step-by-step → Exam tip → Try this question</em></p>
        <div style="margin-top:14px;padding:12px;border:1px dashed var(--line);border-radius:11px;background:var(--card-2);font-size:13px">
          <strong>Example prompt:</strong> “Explain trading on equity with example”<br>
          <strong>Try:</strong> “Check my answer: Goodwill is reputation of firm”
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>How it works — Real flow (no pretending)</h3>
      <ol style="color:var(--muted);font-size:13px;margin-top:6px;line-height:1.6">
        <li><b>QUESTION</b> — current Class/Subject/Chapter/Question/Options/Correct/Your answer are packaged (see Console → <code>[AI DEBUG]</code>).</li>
        <li><b>REAL API</b> — browser sends prompt to Gemini or Pollinations (<code>fetch</code> → check <code>Response status</code> &amp; <code>API error</code> in Console).</li>
        <li><b>REAL RESPONSE</b> — on HTTP 2xx + non-empty <code>choices[0].message.content</code> / <code>candidates[0].content.parts[0].text</code> we show <span style="background:var(--success-soft);padding:1px 6px;border-radius:6px;border:1px solid var(--success-line)">✓ Real AI response · Provider: ${esc(provName)}</span></li>
        <li><b>FAILED?</b> — we show <span style="background:#fef2f2;padding:1px 6px;border-radius:6px;border:1px solid #fecaca">AI request failed · Provider + HTTP status + error</span> with <b>Retry</b> and <b>Show offline explanation (explicit fallback)</b> — demo is <b>never</b> auto-shown as real.</li>
        <li>Debug: open F12 → Console (filters: <code>[AI DEBUG]</code>), or run <code>CS.showAIDebug()</code>, or <code>await CS.testAIWithQuestions()</code> for 3-question proof.</li>
      </ol>
      <div class="row" style="margin-top:10px">
        <button class="btn btn-sm" onclick="window.CS.showAIDebug&&window.CS.showAIDebug()">Show AI debug</button>
        <button class="btn btn-sm" onclick="window.CS.testAIWithQuestions&&window.CS.testAIWithQuestions()">Test with 3 questions (console)</button>
        <a class="btn btn-sm" href="#profile">Profile & key settings</a>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>How to get the best from AI</h3>
      <ul style="color:var(--muted);font-size:13px;margin-top:6px">
        <li>Be specific: “Explain BRS with numerical” beats “teach me accountancy”.</li>
        <li>Mention class/chapter — context is auto-filled from your current lesson.</li>
        <li>Ask AI to <em>quiz you</em> after explanation to test recall.</li>
        <li>Always verify with textbook/official syllabus.</li>
      </ul>
    </div>
  </section>`;
}
// --- AI Provider & Debug ---
function getAIProvider(){
  const k = (Store.getApiKey && Store.getApiKey() || "").trim();
  if(k.startsWith("AIza")) return {name:"Gemini", keyType:"gemini"};
  if(k.startsWith("sk_") || k.startsWith("pk_")) return {name:"Pollinations (key)", keyType:"pollinations-key"};
  return {name:"Pollinations (free)", keyType:"pollinations-free"};
}
function aiDebugLog(...args){
  // Always log for now; gate behind localStorage debug flag if needed
  console.log("[AI DEBUG]", ...args);
}

// --- Real AI via Gemini / Pollinations ---
async function fetchGemini(prompt, apiKey){
  const provider = "Gemini";
  aiDebugLog(`Provider: ${provider}`, `Prompt chars: ${prompt.length}`, `Key: ${apiKey.slice(0,4)}****`);
  aiDebugLog("REQUEST SENT: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      contents: [{parts:[{text: prompt}]}],
      generationConfig: {temperature: 0.7, maxOutputTokens: 950}
    })
  });
  aiDebugLog(`RESPONSE STATUS: ${r.status} ${r.statusText}`, `Provider: ${provider}`);
  if(!r.ok){
    const errText = await r.text().catch(()=> "");
    aiDebugLog(`API ERROR: ${errText.slice(0,600)}`, `Provider: ${provider}`);
    // Provide helpful message for common errors
    let msg = `Gemini HTTP ${r.status}: ${errText.slice(0,300)}`;
    if(r.status===400) msg += " — Check API key and prompt. Get a free key at https://aistudio.google.com/app/apikey";
    if(r.status===403) msg += " — API key invalid or not enabled for Gemini. Generate a new key at https://aistudio.google.com/app/apikey";
    if(r.status===429) msg += " — Rate limited. Wait a minute or use Pollinations free tier.";
    throw new Error(msg);
  }
  const j = await r.json().catch(e=>{ aiDebugLog("JSON parse failed", e); throw new Error("Gemini returned invalid JSON"); });
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  aiDebugLog(`PARSED: ${text.length} chars`, `Provider: ${provider}`, `Preview: ${text.slice(0,120)}...`);
  if(!text || text.trim().length < 10) throw new Error("Empty Gemini response (no candidates)");
  return text.trim();
}

async function fetchPollinationsWithKey(prompt, apiKey, ctrl){
  const provider = "Pollinations (key)";
  aiDebugLog(`Provider: ${provider}`, `Key: ${apiKey.slice(0,3)}****`, `Prompt chars: ${prompt.length}`);
  aiDebugLog("REQUEST SENT: POST https://gen.pollinations.ai/v1/chat/completions");
  const url = "https://gen.pollinations.ai/v1/chat/completions";
  const r = await fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json", "Authorization": `Bearer ${apiKey}`},
    signal: ctrl?.signal,
    body: JSON.stringify({
      model: "openai",
      messages: [{role:"user", content: prompt}],
      stream: false,
      temperature: 0.7
    })
  });
  aiDebugLog(`RESPONSE STATUS: ${r.status}`, `Provider: ${provider}`);
  if(!r.ok){
    const errText = await r.text().catch(()=> "");
    aiDebugLog(`API ERROR: ${errText.slice(0,600)}`);
    throw new Error(`Pollinations (key) HTTP ${r.status}: ${errText.slice(0,300)}`);
  }
  const j = await r.json().catch(()=>{ throw new Error("Pollinations key returned invalid JSON"); });
  const content = j?.choices?.[0]?.message?.content || "";
  aiDebugLog(`PARSED: ${content.length} chars`, `Provider: ${provider}`);
  if(!content || content.trim().length < 10) throw new Error("Empty Pollinations (key) response");
  return content.trim();
}

async function fetchPollinations(prompt){
  const apiKey = (Store.getApiKey && Store.getApiKey() || "").trim();
  const providerInfo = getAIProvider();
  aiDebugLog("=== AI REQUEST START ===", `Provider selected: ${providerInfo.name}`, `HasKey: ${!!apiKey}`, `Prompt preview: ${prompt.slice(0,140)}...`);
  const ctrl = new AbortController();
  const tid = setTimeout(()=> { ctrl.abort(); aiDebugLog("TIMEOUT 18s — aborting"); }, 18000);
  try{
    if(apiKey && apiKey.startsWith("AIza")){
      aiDebugLog("Trying Gemini (user key)...");
      const txt = await fetchGemini(prompt, apiKey);
      clearTimeout(tid);
      aiDebugLog("=== AI REQUEST SUCCESS (Gemini) ===", `Chars: ${txt.length}`);
      return txt;
    }
    if(apiKey && (apiKey.startsWith("sk_") || apiKey.startsWith("pk_"))){
      aiDebugLog("Trying Pollinations with user key...");
      try{
        const txt = await fetchPollinationsWithKey(prompt, apiKey, ctrl);
        clearTimeout(tid);
        aiDebugLog("=== AI REQUEST SUCCESS (Pollinations key) ===");
        return txt;
      }catch(e){
        aiDebugLog("Pollinations with key FAILED, falling back to free", e.message);
        // fall through to free
      }
    }
    // Free Pollinations POST
    aiDebugLog("Trying Pollinations free POST https://text.pollinations.ai/openai ...");
    try{
      const r = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        signal: ctrl.signal,
        body: JSON.stringify({
          model: "openai",
          messages: [{role:"user", content: prompt}],
          stream: false,
          temperature: 0.7
        })
      });
      aiDebugLog(`Free POST status: ${r.status}`);
      if(r.ok){
        const j = await r.json().catch(()=>null);
        const content = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || "";
        aiDebugLog(`Free POST parsed: ${content.length} chars`);
        if(content && content.trim().length > 10){
          clearTimeout(tid);
          aiDebugLog("=== AI REQUEST SUCCESS (Pollinations free POST) ===");
          return content.trim();
        }
      }
      const errText = await r.text().catch(()=> "");
      aiDebugLog(`Free POST empty/error: ${r.status} ${errText.slice(0,300)}`);
    }catch(e){
      if(e.name==="AbortError") { aiDebugLog("Free POST aborted (timeout)"); throw new Error("AI request timed out after 18s — check network or try again. Free Pollinations may be slow."); }
      aiDebugLog("Free POST failed, trying GET", e.message);
    }
    // Fallback GET
    aiDebugLog("Trying Pollinations free GET ...");
    const shortPrompt = prompt.slice(0, 1100);
    const url = `https://text.pollinations.ai/${encodeURIComponent(shortPrompt)}?model=openai`;
    aiDebugLog(`GET URL length: ${url.length}`, `URL preview: ${url.slice(0,140)}...`);
    const r2 = await fetch(url, {signal: ctrl.signal});
    aiDebugLog(`GET status: ${r2.status}`);
    if(!r2.ok){
      const errText = await r2.text().catch(()=> "");
      aiDebugLog(`GET error body: ${errText.slice(0,400)}`);
      throw new Error(`Pollinations GET HTTP ${r2.status}: ${errText.slice(0,300)} — Free tier may be rate-limited. Add a free Gemini key at aistudio.google.com/app/apikey for reliability.`);
    }
    const txt = await r2.text();
    aiDebugLog(`GET parsed: ${txt.length} chars`);
    if(!txt || txt.trim().length < 10) throw new Error("Empty response from Pollinations GET");
    clearTimeout(tid);
    aiDebugLog("=== AI REQUEST SUCCESS (Pollinations free GET) ===");
    return txt.trim();
  }catch(e){
    clearTimeout(tid);
    aiDebugLog("=== AI REQUEST FAILED ===", e.message, e.name);
    // Do NOT swallow — rethrow with provider context
    throw e;
  }
}

function formatAIText(raw){
  let html = esc(raw);
  html = html.replace(/```([\s\S]*?)```/g, (m,code)=> `<pre style="background:var(--card-2);border:1px solid var(--line);border-radius:10px;padding:12px;overflow:auto;font-size:13px;white-space:pre-wrap">${esc(code.trim())}</pre>`);
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  html = html.replace(/^###\s*(.*)$/gm, '<h3 style="margin:14px 0 6px;font-size:15px">$1</h3>');
  html = html.replace(/^##\s*(.*)$/gm, '<h3 style="margin:14px 0 6px;font-size:15px">$1</h3>');
  html = html.replace(/^\s*[-•]\s+(.*)$/gm, '<div style="display:flex;gap:8px;margin:4px 0"><span style="color:var(--accent)">•</span><span>$1</span></div>');
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<div style="display:flex;gap:8px;margin:4px 0"><span style="color:var(--accent)">•</span><span>$1</span></div>');
  html = html.replace(/\n\n+/g, '</p><p style="margin:8px 0;font-size:13.5px;line-height:1.65">');
  html = html.replace(/\n/g, '<br>');
  return `<div style="font-size:13.5px;line-height:1.65"><p style="margin:8px 0">${html}</p></div>`;
}

function buildAIPrompt(mode, input, context){
  const ch = getChapters(context.class, context.subject)[context.chapter];
  const chapterName = ch ? ch.title : "Commerce topic";
  const subjectName = SUBJECT_NAMES[context.subject] || context.subject;
  const cls = context.class;
  const topicPoints = ch ? ch.keyPoints.slice(0,2).join("; ") : "";
  const modeInstr = {
    explain: "Explain the concept simply, student-friendly, CBSE-oriented. Structure: Simple explanation, Why it happens, Step-by-step, Exam tip, Try this question.",
    solve: "Solve step-by-step with Given, Formula, Substitution, Final Answer, and Common mistake. Show numerical working clearly.",
    "teach-me": "Teach like a friendly teacher, interactive, ask a check question at the end.",
    "quiz-me": "Create 3 quiz questions of increasing difficulty with answers hidden (use 'Answer:' line).",
    "check-answer": "Check the student's answer: list What you did well (\u2713), What is missing (\u26A0), What is incorrect (\u274C), and Suggested exam answer. Be encouraging.",
    hint: "Give a helpful hint, not full solution. Ask a guiding question.",
    simplify: "Simplify for 30-second revision, bullet points, very concise.",
    examiner: "Be a strict CBSE examiner: tell exact keywords needed, marks breakdown, what gets zero, how to present."
  }[mode] || "Explain simply for CBSE Class 11-12 Commerce.";
  const safeChapter = chapterName.replace(/[^\x00-\x7F]/g, "");
  const safeSubject = subjectName.replace(/[^\x00-\x7F]/g, "");
  const safeTopicPoints = topicPoints.replace(/[^\x00-\x7F]/g, "");
  // input may be string OR a rich question object {question,options,correct,selectedAnswer, topic, chapter}
  let payload = "";
  let questionText = "";
  if(input && typeof input === 'object' && input.question){
    // Full question object - REQUIREMENT: use current question data
    const q = input;
    const opts = Array.isArray(q.options) && q.options.length ? q.options.map((o,i)=> String.fromCharCode(65+i)+". "+String(o)).join(" | ") : "No options (short answer)";
    const correctLabel = (q.correct!=null && q.options && q.options[q.correct]) ? String.fromCharCode(65+q.correct)+". "+q.options[q.correct] : (q.correct!=null? String(q.correct) : "N/A");
    const selectedLabel = (q.selectedAnswer!=null && q.options && q.options[q.selectedAnswer]) ? String.fromCharCode(65+q.selectedAnswer)+". "+q.options[q.selectedAnswer] : (q.selectedAnswer!=null? String(q.selectedAnswer) : "Not answered yet");
    const topicInfo = q.topic ? "Topic: "+q.topic : "";
    const marksInfo = q.marks ? q.marks+" mark" : "";
    const safeQText = String(q.question).slice(0, 500).replace(/[^\x00-\x7F]/g, "");
    const safeOpts = String(opts).slice(0, 600).replace(/[^\x00-\x7F]/g, "");
    questionText = safeQText;
    payload = `CURRENT QUESTION (must answer this exact question, not generic):\nClass: ${cls} | Subject: ${safeSubject} | Chapter: ${safeChapter} | ${topicInfo} ${marksInfo}\nQuestion: "${safeQText}"\nOptions: ${safeOpts}\nCorrect Answer: ${correctLabel.replace(/[^\x00-\x7F]/g,"")}\nStudent's Selected Answer: ${selectedLabel.replace(/[^\x00-\x7F]/g,"")}\nInstruction: Base your explanation ONLY on this question. If student was wrong, explain why their choice is wrong and why correct is right. If right, praise and reinforce.`;
  } else if(mode === "check-answer" && input){
    const safeInput = String(input).slice(0, 600).replace(/[^\x00-\x7F]/g, "");
    return `You are Commerce-Students AI, CBSE Commerce tutor for Class ${cls} ${safeSubject}, Chapter: ${safeChapter}. Key points: ${safeTopicPoints}. Task: ${modeInstr} Student answer to check: "${safeInput}" Context chapter: ${safeChapter}. Keep tone student-friendly, concise, exam-oriented. Use Indian English, Rs for currency.`;
  } else {
    const rawQ = input ? String(input).slice(0, 600) : `Explain ${safeChapter} for CBSE Class ${cls} ${safeSubject}`;
    const safeQ = rawQ.replace(/[^\x00-\x7F]/g, "");
    questionText = safeQ;
    payload = `User question: "${safeQ}"`;
  }
  return `You are Commerce-Students AI, expert CBSE Commerce tutor for Class ${cls} ${safeSubject}, Chapter: ${safeChapter}. Key points: ${safeTopicPoints}. Task: ${modeInstr} ${payload} Stay strictly to CBSE 2026-27 syllabus, student-friendly, clear headings, no extra fluff. Use Indian English.`;
}

// Enhanced helper: build prompt directly from a QUESTION object (used by Explain buttons)
function buildAIPromptForQuestion(mode, qObj, context){
  // qObj is {question, options, correct, selectedAnswer, topic, chapter, class, subject, marks}
  // merge context from qObj if available
  const ctx = {
    class: qObj.class || context.class,
    subject: qObj.subject || context.subject,
    chapter: (typeof qObj.chapterIndex === 'number') ? qObj.chapterIndex : context.chapter
  };
  return buildAIPrompt(mode, qObj, ctx);
}

function apiKeyMsg(){
  const k = (Store.getApiKey && Store.getApiKey() || "").trim();
  if(k) return `Key: ${esc(k.slice(0,4))}****${esc(k.slice(-4))} ·`;
  return `No API key saved · <a href="#profile" style="text-decoration:underline">Add free Gemini key in Profile</a> ·`;
}

// Utility: build offline fallback (ONLY shown when user explicitly requests it)
function buildOfflineFallback(mode, input, context){
  const ch = getChapters(context.class, context.subject)[context.chapter];
  const chapterName = ch ? ch.title : "this chapter";
  const subjectName = SUBJECT_NAMES[context.subject] || context.subject;
  const cls = context.class;
  const chPoints = (ch && ch.keyPoints ? ch.keyPoints.slice(0,2).join(" · ") : "See textbook");
  const topicHint = ch ? `Key points: ${esc(chPoints)}` : "";
  let displayInput = "";
  if(input && typeof input === 'object' && input.question){
    const q = input;
    const opts = q.options ? q.options.map((o,i)=> String.fromCharCode(65+i)+". "+String(o)).join(" | ") : "";
    displayInput = `<div style="margin-top:10px;padding:10px;background:var(--card-2);border:1px solid var(--line);border-radius:10px;font-size:12px"><b>Your question:</b> ${esc(q.question)}<br><small>${esc(opts)}<br>Correct: ${q.correct!=null && q.options ? esc(String.fromCharCode(65+q.correct)+". "+q.options[q.correct]) : "N/A"} | Yours: ${q.selectedAnswer!=null && q.options ? esc(String.fromCharCode(65+q.selectedAnswer)+". "+q.options[q.selectedAnswer]) : "Not answered"}</small></div>`;
  } else if(input){
    displayInput = `<p style="margin-top:10px;color:var(--muted);font-size:12px"><b>Your question:</b> ${esc(String(input).slice(0,300))}</p>`;
  }
  const dynamicExplain = `<p><b>${esc(chapterName)}</b> — ${esc(subjectName)} (Class ${cls})</p><p style="font-size:13.5px">${topicHint}</p><p style="font-size:13.5px">This is a <b>context-aware offline explanation</b> for <b>${esc(chapterName)}</b>. Live AI is temporarily unavailable, so here's a structured revision:</p><ul style="font-size:13.5px;margin:8px 0 0 18px"><li><b>Definition:</b> ${esc((ch && ch.keyPoints && ch.keyPoints[0]) || "Refer to NCERT definition for "+chapterName)}</li><li><b>Why it matters:</b> Frequently asked in CBSE 2026-27 — show keywords, formula and example.</li><li><b>How to answer:</b> Keyword → explanation → formula/example → exam tip.</li></ul><div style="margin-top:10px;padding:10px;background:var(--card-2);border:1px solid var(--line);border-radius:10px"><b>Exam tip:</b> Write formula → substitution → answer with unit. Mention chapter name <b>${esc(chapterName)}</b> explicitly.</div>${displayInput}`;
  const dynamicSolve = `<p><b>Solving for ${esc(chapterName)}</b> — ${esc(subjectName)}</p><p style="font-size:13.5px">Steps: <b>Given → Formula → Substitution → Answer</b>. ${topicHint}</p><p style="font-size:13.5px"><b>Example pattern:</b> For numericals in ${esc(chapterName)}, always adjust for abnormal items first, then apply the standard formula from your formula bank.</p>${displayInput}`;
  const fallbackBase = {
    explain: dynamicExplain,
    solve: dynamicSolve,
    "check-answer": `<p>Thanks for sharing! <b>\u2713</b> You attempted <b>${esc(chapterName)}</b>. <b>\u26A0 Missing:</b> Add keywords from: ${esc(chPoints)}. <br><b>Suggested structure:</b> Definition (keyword) \u2192 2 points \u2192 example. ${displayInput}</p>`,
    hint: `<p>Hint for <b>${esc(chapterName)}</b>: Start with the definition, then ask: <i>What is the formula / key term here?</i> ${topicHint}</p>${displayInput}`,
    simplify: `<p><b>${esc(chapterName)} — 30-sec:</b> ${esc(chPoints)} — remember formula → example.</p>`,
    "quiz-me": `<p><b>Quick quiz — ${esc(chapterName)}</b> (offline)</p><ol style="font-size:13.5px"><li>Define the main term of ${esc(chapterName)} in one sentence.</li><li>State one formula / feature from ${esc(chapterName)}.</li><li>Give one common mistake in ${esc(chapterName)}.</li></ol><p style="color:var(--muted);font-size:12px">Live quiz available when AI is online — these are offline placeholders.</p>`,
    "teach-me": `<p><b>Let's learn ${esc(chapterName)} together.</b> Offline mode: Tell me what you think <b>${esc(chapterName)}</b> means, then I'll guide you (live teacher mode needs AI online).</p>`,
    examiner: `<p><b>Examiner Mode — ${esc(chapterName)} (offline)</b>: Must write keywords from ${esc(chPoints)}, formula, substitution, answer. No marks for only final answer.</p>`
  };
  return fallbackBase[mode] || fallbackBase.explain;
}

// TRUE AI — never silently falls back. Returns {ok:true, provider, raw, html} or throws enriched error {provider,status,message}
async function aiGenerate(mode, input, context){
  const providerInfo = getAIProvider();
  const ch = getChapters(context.class, context.subject)[context.chapter];
  const chapterName = ch ? ch.title : "this chapter";
  const subjectName = SUBJECT_NAMES[context.subject] || context.subject;
  const cls = context.class;
  // Build header showing current question data (not stale)
  let qHeader = "";
  if(input && typeof input === 'object' && input.question){
    const q = input;
    const opts = q.options ? q.options.map((o,i)=> String.fromCharCode(65+i)+". "+String(o)).join(" | ") : "";
    const selectedStr = q.selectedAnswer!=null && q.options ? String.fromCharCode(65+q.selectedAnswer)+". "+q.options[q.selectedAnswer] : (q.selectedAnswer!=null? String(q.selectedAnswer) : "Not answered");
    const correctStr = q.correct!=null && q.options ? String.fromCharCode(65+q.correct)+". "+q.options[q.correct] : "N/A";
    qHeader = `<div style="margin:8px 0;padding:10px;background:var(--card-2);border:1px solid var(--line);border-radius:10px;font-size:12px"><b>Current question:</b> ${esc(q.question)}<br><small>${esc(opts)}<br><b>Correct:</b> ${esc(correctStr)} &nbsp;|&nbsp; <b>Yours:</b> ${esc(selectedStr)} &nbsp;|&nbsp; ${esc(subjectName)} · ${esc(chapterName)} · Class ${cls} · ${esc(q.topic||"")}</small></div>`;
  } else if(input){
    qHeader = `<p style="color:var(--muted);font-size:12px;margin:8px 0"><b>Your question:</b> ${esc(String(input).slice(0,400))}</p>`;
  }
  const header = `<span class="badge badge-primary">Live AI · ${esc(mode||"explain")} · ${esc(chapterName)} · Class ${cls} · ${esc(providerInfo.name)}</span>${qHeader}`;
  const prompt = buildAIPrompt(mode, input, context);
  // DEBUG LOGGING — REQUIREMENT: provider, request sent, HTTP status, error, parse
  aiDebugLog("aiGenerate() called", {mode, provider: providerInfo.name, class:cls, subject:subjectName, chapter:chapterName, inputType: typeof input, promptLength: prompt.length});
  // Store for window.CS debug
  window.CS = window.CS || {};
  window.CS._lastAIRequest = {mode, input, context, provider: providerInfo.name, prompt, ts: Date.now()};
  try{
    const raw = await fetchPollinations(prompt);
    const formatted = formatAIText(raw);
    window.CS._lastAIResponse = {raw, provider: providerInfo.name, ts: Date.now(), prompt};
    aiDebugLog("aiGenerate SUCCESS", {provider: providerInfo.name, rawLength: raw.length});
    const html = `${header}<div style="margin-top:10px">${formatted}</div><p style="margin-top:10px;color:var(--muted);font-size:11px">✓ <b>Real AI response</b> via ${esc(providerInfo.name)} · Model: openai/gemini-1.5-flash · Context: ${esc(chapterName)} · Verify with textbook. <a href="#" onclick="window.CS.showAIDebug&&window.CS.showAIDebug();return false" style="text-decoration:underline">Show debug</a></p>`;
    return html;
  }catch(err){
    // DO NOT silently fallback — propagate real error
    window.CS._lastAIError = {message: err.message, name: err.name, provider: providerInfo.name, ts: Date.now()};
    aiDebugLog("aiGenerate FAILED", {provider: providerInfo.name, error: err.message, name: err.name});
    // Build FAILED UI (no auto demo)
    const errorName = err.name || "Error";
    const errorMsg = esc(err.message || String(err));
    const providerLabel = esc(providerInfo.name);
    // Special hint for GitHub Pages CORS / key exposure
    const ghHint = providerInfo.keyType==='gemini' ? `<p style="font-size:11px;color:var(--muted);margin-top:6px">GitHub Pages runs entirely in the browser. Your Gemini key is stored only in <code>localStorage</code> on this device and sent directly to Google from your browser — never to our server. It IS visible in browser DevTools → Network tab if someone inspects. For a truly secure setup, a small backend proxy is recommended — see <code>/server/README.md</code>.</p>` : `<p style="font-size:11px;color:var(--muted);margin-top:6px">Free Pollinations needs no key but is rate-limited. If it fails frequently, add a free Gemini key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style="text-decoration:underline">aistudio.google.com/app/apikey</a> (takes 30 sec, no credit card).</p>`;
    throw new Error(`AI_REQUEST_FAILED::${providerLabel}::${errorName}::${errorMsg}`);
  }
}

// Wrapper that converts aiGenerate throw into user-facing FAILED HTML (with Retry + offline option)
async function aiGenerateSafe(mode, input, context){
  try{
    const html = await aiGenerate(mode, input, context);
    return {ok:true, html};
  }catch(e){
    const raw = e.message || String(e);
    // Parse our enriched error
    let provider="AI", name="Error", msg=raw;
    if(raw.startsWith("AI_REQUEST_FAILED::")){
      const parts = raw.split("::");
      provider = parts[1]||"AI";
      name = parts[2]||"Error";
      msg = parts.slice(3).join("::")||raw;
    }
    const ch = getChapters(context.class, context.subject)[context.chapter];
    const chapterName = ch ? ch.title : "this chapter";
    // Build failed UI — REQUIREMENT: show actual error, not generic demo
    const failedHtml = `
      <span class="badge badge-danger">AI request failed · ${esc(provider)}</span>
      <div style="margin-top:10px;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px">
        <strong style="color:#dc2626">AI request failed</strong>
        <p style="font-size:13px;margin-top:6px"><b>Provider:</b> ${esc(provider)}<br><b>Status:</b> ${esc(name)}<br><b>Details:</b> ${msg}</p>
        ${provider==="Pollinations (free)" && msg.includes("429") ? `<p style="font-size:12px;color:var(--muted)">Free tier rate-limited — wait 30 sec or add Gemini key.</p>` : ""}
        ${provider==="Gemini" && msg.includes("403") ? `<p style="font-size:12px;color:var(--muted)">Key invalid or not enabled — generate new at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style="text-decoration:underline">aistudio.google.com/app/apikey</a></p>` : ""}
        ${provider==="Gemini" && msg.includes("400") ? `<p style="font-size:12px;color:var(--muted)">Check key format (starts with AIza) and prompt length.</p>` : ""}
        <div class="row" style="margin-top:10px">
          <button class="btn btn-primary btn-sm" data-ai-retry="${esc(mode)}">Retry ↻</button>
          <button class="btn btn-sm" data-ai-offline="${esc(mode)}">Show offline explanation (explicit fallback)</button>
          <a class="btn btn-sm" href="#profile">Add / check key</a>
        </div>
        <p style="font-size:11px;color:var(--muted);margin-top:8px">Open Console (F12 → Console) for full debug: provider, request sent, HTTP status, API error, parse.</p>
      </div>
      <div style="margin-top:10px;padding:10px;background:var(--card-2);border:1px dashed var(--line);border-radius:10px;font-size:12px">
        <strong>Debug info (also in Console → [AI DEBUG])</strong><br>
        Provider: ${esc(provider)} · Mode: ${esc(mode)} · Chapter: ${esc(chapterName)}<br>
        <span style="word-break:break-all">Error: ${msg.slice(0,300)}</span><br>
        <a href="#" onclick="window.CS.showAIDebug&&window.CS.showAIDebug();return false" style="text-decoration:underline">Show full prompt/debug</a>
      </div>`;
    return {ok:false, html: failedHtml, error: msg, provider, name, raw: e};
  }
}


// --- PROGRESS / DASHBOARD ---
function pageDashboard(){
  const profile = Store.getProfile();
  const overall = Store.getOverallStats();
  const weak = Store.getWeakTopics(3);
  const mistakes = Store.getMistakeList().length;
  const streak = Store.getStreak();
  const cls = profile.class||12;
  const recent = Store.getProgress().attempts.slice(-6).reverse();
  const chapters = Object.values(CURRICULUM[cls]).flatMap(s=>s.chapters);
  const nextCh = chapters.find((c,i)=> !Store.isChecked(`${cls}-accountancy-${i}`)) || chapters[0];
  document.title="Dashboard · Commerce-Students";
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Dashboard"}])}
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
      <div>
        <h1 class="page-title">${todayGreeting()}${profile.name?`, ${esc(profile.name)}`:""} 👋</h1>
        <p style="color:var(--muted)">Ready to study? Let's make today's session count.</p>
      </div>
      <div class="row">
        <span class="badge badge-success">🔥 ${streak.count} day streak</span>
        <a class="btn btn-sm" href="#profile">Settings</a>
      </div>
    </div>

    <div class="stat-grid" style="margin-top:18px">
      <div class="stat"><span>Study time</span><strong>${Math.round(overall.timeSpent/60)} min</strong><span>total · local</span></div>
      <div class="stat"><span>Questions</span><strong>${overall.total}</strong><span>${overall.accuracy}% accuracy</span></div>
      <div class="stat"><span>Tests</span><strong>${overall.tests}</strong><span>${mistakes} mistakes to review</span></div>
    </div>

    <div class="detail-grid" style="margin-top:18px">
      <div class="col">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>Continue learning</h3>
            <span class="badge">${esc(SUBJECT_NAMES.accountancy)} · ${esc(nextCh?.title||"Partnership")}</span>
          </div>
          <div style="margin-top:10px">
            <div class="progress"><i style="width:${Math.round(overall.total/5)}%"></i></div>
          </div>
          <p style="color:var(--muted);font-size:13px;margin-top:8px">68% of students finish one chapter + 10 Qs per day. Continue where you left off.</p>
          <div class="row" style="margin-top:12px">
            <a class="btn btn-primary" href="#study/${cls}/accountancy/1">Continue →</a>
            <a class="btn" href="#practice">Practice</a>
          </div>
        </div>

        <div class="card">
          <h3>Today's plan</h3>
          <div style="margin-top:10px;display:grid;gap:8px">
            <label style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card-2)">
              <input type="checkbox" checked disabled> <span style="font-size:13.5px">Revise Goodwill</span> <span style="margin-left:auto" class="badge">15 min</span>
            </label>
            <label style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card-2)">
              <input type="checkbox"> <span style="font-size:13.5px">Solve 10 questions</span> <span style="margin-left:auto" class="badge">20 min</span>
            </label>
            <label style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--card-2)">
              <input type="checkbox"> <span style="font-size:13.5px">Mistake review (× ${mistakes})</span> <span style="margin-left:auto" class="badge">10 min</span>
            </label>
          </div>
          <a class="btn btn-primary" href="#daily" style="width:100%;margin-top:12px">Start Today's 10 →</a>
        </div>

        <div class="card">
          <h3>Recent activity</h3>
          ${recent.length? `
            <div style="margin-top:10px;display:grid;gap:6px">
              ${recent.map(a=>`
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--line);border-radius:9px;background:var(--card-2)">
                  <span style="font-size:12.5px">${esc(a.questionId)} · ${a.correct?'✓':'✗'}</span>
                  <span style="color:var(--muted);font-size:11px">${new Date(a.date).toLocaleDateString("en-IN")}</span>
                </div>
              `).join("")}
            </div>
          `:`<div class="empty" style="padding:16px;margin-top:10px"><p>Your progress will appear here after your first practice session.</p><a class="btn btn-sm" href="#practice" style="margin-top:8px">Start practicing</a></div>`}
        </div>
      </div>
      <div class="col">
        <div class="card">
          <h3>Weak areas</h3>
          <p style="color:var(--muted);font-size:12px">Based on your recent practice (≥3 attempts)</p>
          <div style="margin-top:10px;display:grid;gap:8px">
            ${weak.length? weak.map(w=>`
              <div style="padding:10px;border:1px solid #fecdd3;background:var(--danger-soft);border-radius:10px">
                <strong style="font-size:13px">${esc(w.topic)}</strong><br>
                <span style="color:var(--muted);font-size:12px">${esc(w.chapter)} · ${w.accuracy}% · ${w.attempts} Qs</span>
              </div>
            `).join("") : `<p style="color:var(--muted);font-size:13px">No weak topics yet — keep practicing to get analysis.</p>`}
          </div>
          <a class="btn" href="#revision" style="width:100%;margin-top:12px">Revise weak topics →</a>
        </div>
        <div class="card">
          <h3>Study streak</h3>
          <div style="text-align:center;padding:10px">
            <div style="font-size:32px">🔥</div>
            <strong style="font-size:24px">${streak.count} day streak</strong><br>
            <span style="color:var(--muted);font-size:12px">One focused session a day keeps the streak warm. Missing a day isn't failure — just come back tomorrow.</span>
          </div>
          <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap;justify-content:center">
            ${(() => {
              const days=[];
              for(let i=6;i>=0;i--){
                const d=new Date(); d.setDate(d.getDate()-i);
                const ds=d.toISOString().slice(0,10);
                const done = streak.dates.includes(ds);
                days.push(`<span style="width:28px;height:28px;display:grid;place-items:center;border-radius:8px;border:1px solid ${done?'var(--success-line)':'var(--line)'};background:${done?'var(--success-soft)':'var(--card-2)'};font-size:11px">${done?'✓':d.getDate()}</span>`);
              }
              return days.join("");
            })()}
          </div>
        </div>
        <div class="card">
          <h3>Achievements</h3>
          <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
            ${[
              [overall.total>=10,"First 10 Questions"],
              [overall.total>=100,"100 Questions"],
              [overall.tests>=1,"First Test"],
              [streak.count>=7,"7-Day Streak"],
              [Store.getCheckedCount(`${cls}-accountancy`)>=3,"Chapter Completed"],
              [mistakes===0 && overall.total>0,"Mistake Master"],
            ].map(([ok,label])=>`<span class="badge ${ok?'badge-success':''}" style="${ok?'':'opacity:.55'}">${ok?'✓':''} ${label}</span>`).join("")}
          </div>
        </div>
      </div>
    </div>
  </section>`;
}
function pageProgress(){
  const overall = Store.getOverallStats();
  const prog = Store.getProgress();
  const weak = Store.getWeakTopics(8);
  const strong = Store.getStrongTopics(4);
  const chapterStats = Object.entries(prog.chapterStats).slice(0,6);
  document.title="My Progress · Commerce-Students";
  return `
  <section class="shell page">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"My Progress"}])}
    <span class="eyebrow">My Progress</span>
    <h1 class="page-title">My progress</h1>
    <p class="page-intro">Overall stats, subject performance, chapter progress and recent activity — all from your local practice data.</p>

    <div class="stat-grid" style="margin-top:16px">
      <div class="stat"><span>Questions solved</span><strong>${overall.total}</strong><span>${overall.correct} correct</span></div>
      <div class="stat"><span>Accuracy</span><strong>${overall.accuracy}%</strong><span>${overall.total?`from ${overall.total} Qs`:"No data yet"}</span></div>
      <div class="stat"><span>Study time</span><strong>${Math.floor(overall.timeSpent/3600)}h ${Math.round((overall.timeSpent%3600)/60)}m</strong><span>${overall.tests} tests</span></div>
    </div>

    <div class="grid-3" style="margin-top:16px">
      ${SUBJECTS.slice(0,3).map(s=>{
        const qs = getQuestions({subject:s});
        const attempts = prog.attempts.filter(a=>a.subject===s);
        const acc = attempts.length? Math.round(attempts.filter(a=>a.correct).length/attempts.length*100):0;
        return `
        <div class="card">
          <strong>${esc(SUBJECT_NAMES[s])}</strong><br>
          <div class="progress" style="margin-top:8px"><i style="width:${acc}%"></i></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:6px"><span>${attempts.length} Qs</span><span>${acc}%</span></div>
          <span style="color:var(--muted);font-size:11px">${qs.length} available</span>
        </div>`;
      }).join("")}
    </div>

    <div class="grid-2" style="margin-top:16px">
      <div class="card">
        <h3>Chapter performance</h3>
        ${chapterStats.length? `
          <div style="margin-top:10px;display:grid;gap:8px">
            ${chapterStats.map(([k,v])=>{
              const acc=Math.round(v.correct/v.attempts*100);
              return `<div><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>${esc(k.split("|")[1])}</span><span>${acc}% · ${v.attempts}</span></div><div class="progress progress-sm" style="margin-top:4px"><i style="width:${acc}%"></i></div></div>`;
            }).join("")}
          </div>
        `:`<div class="empty" style="margin-top:10px;padding:16px"><p>Chapter progress appears after practice.</p></div>`}
      </div>
      <div class="card">
        <h3>Weak topics</h3>
        ${weak.length? weak.map(w=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--line);border-radius:9px;background:var(--card-2);margin-top:8px">
            <span style="font-size:13px"><b>${esc(w.topic)}</b><br><span style="color:var(--muted);font-size:11px">${esc(w.chapter)}</span></span>
            <span class="badge badge-danger">${w.accuracy}% · ${w.attempts}</span>
          </div>
        `).join("") : `<p style="color:var(--muted);font-size:13px;margin-top:8px">Solve 3+ questions per topic to see weak-topic detection.</p>`}
        ${strong.length? `<h3 style="margin-top:14px">Strong topics</h3>${strong.map(s=>`<div style="margin-top:6px"><span class="badge badge-success">${esc(s.topic)} · ${s.accuracy}%</span></div>`).join("")}`:""}
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Recent activity</h3>
      ${prog.attempts.length? `
        <div style="margin-top:10px;display:grid;gap:6px">
          ${prog.attempts.slice(-10).reverse().map(a=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--line);border-radius:9px;background:var(--card-2)">
              <span style="font-size:12.5px">${esc(a.subject)} · ${esc(a.chapter)} · ${a.correct?'✓ Correct':'✗ Incorrect'}</span>
              <span style="color:var(--muted);font-size:11px">${new Date(a.date).toLocaleString("en-IN")}</span>
            </div>
          `).join("")}
        </div>
      `:`<div class="empty" style="margin-top:10px;padding:16px"><p>Completed quizzes, practice sessions and mistakes will appear here.</p></div>`}
      <div class="row" style="margin-top:12px">
        <a class="btn btn-primary" href="#practice">Practice →</a>
        <a class="btn" href="#mistakes">Mistake Book</a>
        <button class="btn" id="reset-progress">Reset progress</button>
      </div>
    </div>
  </section>`;
}

// --- SEARCH ---
function pageSearch(){
  const params=new URLSearchParams(location.hash.split("?")[1]||"");
  const q=(params.get("q")||"").toLowerCase().trim();
  document.title = q? `Search: ${q} · Commerce-Students` : "Search · Commerce-Students";
  const results=[];
  if(q){
    // subjects/chapters
    for(const grade of [11,12]){
      for(const s of SUBJECTS){
        for(const ch of getChapters(grade,s)){
          const hay=(ch.title+" "+ch.topics.join(" ")+" "+s+" class "+grade).toLowerCase();
          if(hay.includes(q)){
            results.push({icon:"📚", title:`${ch.title} — ${SUBJECT_NAMES[s]}`, sub:`Class ${grade} · Chapter`, href:`#study/${grade}/${s}`, meta:`${ch.topics.slice(0,2).join(" · ")}`});
          }
          // topics
        }
      }
    }
    // questions
    getQuestions({search:q}).slice(0,6).forEach(qu=>{
      results.push({icon:"📝", title: qu.question.slice(0,80)+(qu.question.length>80?"…":""), sub:`${SUBJECT_NAMES[qu.subject]} · ${qu.chapter} · ${qu.topic}`, href:`#practice?search=${encodeURIComponent(q)}`, meta:`${qu.marks} mark · ${qu.difficulty}`});
    });
    // formulas
    FORMULAS.filter(f=> (f.name+" "+f.chapter+" "+f.formula).toLowerCase().includes(q)).slice(0,4).forEach(f=>{
      results.push({icon:"📐", title:`${f.name} — ${f.formula}`, sub:`${SUBJECT_NAMES[f.subject]} · ${f.chapter}`, href:`#revision/formulas?search=${encodeURIComponent(q)}`, meta:"Formula Bank"});
    });
    // definitions
    DEFINITIONS.filter(d=> (d.term+" "+d.definition).toLowerCase().includes(q)).slice(0,4).forEach(d=>{
      results.push({icon:"📖", title:`${d.term} — ${d.definition.slice(0,70)}…`, sub:`${SUBJECT_NAMES[d.subject]||d.subject}`, href:`#revision/definitions?search=${encodeURIComponent(q)}`, meta:"Definition"});
    });
    // AI shortcut
    results.push({icon:"🤖", title:`Ask AI about "${q}"`, sub:`AI Study Assistant`, href:`#ai`, meta:"Explain · Solve · Quiz"});
  }
  return `
  <section class="shell page" style="max-width:780px;margin:0 auto">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Search"}])}
    <span class="eyebrow">Search</span>
    <h1 class="page-title">Search</h1>
    <p class="page-intro">Across subjects, chapters, topics, questions, formulas, definitions and revision.</p>
    <div style="margin-top:16px">
      <input id="global-search" class="search-input" placeholder="Try goodwill, elasticity, staffing, MCQ, formula…" value="${esc(params.get("q")||"")}" autofocus>
      <div style="margin-top:8px;color:var(--muted);font-size:12px">Press Enter to search · Use short keywords for better results</div>
    </div>
    ${q? `
      <div style="margin-top:16px">
        <h3>${results.length} results for "${esc(q)}"</h3>
        <div style="margin-top:10px;display:grid;gap:8px">
          ${results.length? results.map(r=>`
            <a class="search-result" href="${r.href}">
              <span><b>${esc(r.icon)} ${esc(r.title)}</b><br><span style="color:var(--muted);font-size:12px">${esc(r.sub)}${r.meta?` · ${esc(r.meta)}`:""}</span></span>
              <span style="color:var(--muted);font-size:12px">→</span>
            </a>
          `).join("") : `<div class="empty"><h3>No results</h3><p>Try a shorter word — e.g. “profit”, “demand”, “ratio”.</p></div>`}
        </div>
      </div>
    `:`
      <div style="margin-top:18px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        ${[
          ["📚","Goodwill — Partnership", "Accountancy · Class 12"],
          ["📝","24 practice questions", "Goodwill · Elasticity · Staffing"],
          ["📖","Goodwill revision", "Definition · Methods · Formulas"],
          ["📐","Goodwill formulas", "Average · Super profit · Capitalisation"],
        ].map(([ico,title,sub])=>`
          <a class="card" href="#search?q=goodwill" style="padding:14px">
            <strong>${ico} ${title}</strong><br><span style="color:var(--muted);font-size:12px">${sub}</span>
          </a>
        `).join("")}
      </div>
    `}
  </section>`;
}

// --- PROFILE ---
function pageProfile(){
  const p=Store.getProfile();
  document.title="Profile · Commerce-Students";
  return `
  <section class="shell page" style="max-width:780px;margin:0 auto">
    ${breadcrumbs([{label:"Home",href:"#home"},{label:"Profile"}])}
    <span class="eyebrow">Profile & settings</span>
    <h1 class="page-title">Your preferences</h1>
    <p class="page-intro">Saved locally on this device. If you sign in later, these will sync to your account.</p>

    <div class="card" style="margin-top:16px">
      <h3>Profile</h3>
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <label style="display:block"><span style="font-size:12px;font-weight:700;color:var(--muted)">Name</span><input id="profile-name" class="search-input" placeholder="Your name" value="${esc(p.name||"")}" style="margin-top:4px;padding:10px 12px"></label>
        <label style="display:block"><span style="font-size:12px;font-weight:700;color:var(--muted)">Class</span>
          <select id="profile-class" class="search-input" style="margin-top:4px;padding:10px 12px">
            <option value="11" ${p.class===11?"selected":""}>Class 11</option>
            <option value="12" ${p.class===12?"selected":""}>Class 12</option>
          </select>
        </label>
        <label style="display:block"><span style="font-size:12px;font-weight:700;color:var(--muted)">Exam date</span><input id="profile-exam" type="date" class="search-input" value="${esc(p.examDate||"")}" style="margin-top:4px;padding:10px 12px"></label>
        <label style="display:block"><span style="font-size:12px;font-weight:700;color:var(--muted)">Daily target (Qs)</span><input id="profile-target" type="number" min="5" max="50" class="search-input" value="${p.dailyTarget||10}" style="margin-top:4px;padding:10px 12px"></label>
      </div>
      <div style="margin-top:12px" class="row">
        <button class="btn btn-primary" id="save-profile">Save profile</button>
        <span style="color:var(--muted);font-size:12px">Class selection is remembered locally.</span>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Settings</h3>
      <div style="margin-top:10px;display:grid;gap:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--card-2)">
          <span><b>Theme</b><br><span style="color:var(--muted);font-size:12px">Light / Dark · saved locally</span></span>
          <button class="btn btn-sm" id="profile-theme">${document.documentElement.getAttribute("data-theme")==="dark"?"☀️ Light":"🌙 Dark"}</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--card-2)">
          <span><b>Daily goal</b><br><span style="color:var(--muted);font-size:12px">We’ll nudge you if you haven’t practiced.</span></span>
          <span class="badge">${p.dailyTarget||10} Qs/day</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--card-2)">
          <span><b>Progress</b><br><span style="color:var(--muted);font-size:12px">Reset clears attempts, mistakes and streak.</span></span>
          <button class="btn btn-sm" id="reset-all" style="border-color:var(--danger);color:var(--danger)">Reset all</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3>Live AI API key</h3>
      <p style="color:var(--muted);font-size:13px">Add a free Gemini key for reliable live AI. Get it free at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style="text-decoration:underline">aistudio.google.com/app/apikey</a> (no credit card). Or Pollinations key at <a href="https://enter.pollinations.ai" target="_blank" rel="noreferrer" style="text-decoration:underline">enter.pollinations.ai</a>. Key is stored locally in your browser only.</p>
      <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">
        <input id="profile-key-input" type="password" placeholder="AIza... or pk_/sk_..." value="${esc(Store.getApiKey? Store.getApiKey() : "")}" style="flex:1;min-width:240px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--card)">
        <button class="btn btn-primary" id="profile-save-key">Save key</button>
        <button class="btn" id="profile-clear-key">Clear</button>
      </div>
      <div style="margin-top:8px;font-size:12px;color:var(--muted)">${(Store.getApiKey && Store.getApiKey()) ? `Saved: ${esc(Store.getApiKey().slice(0,6))}**** · Live AI active` : `No key saved · Free Pollinations will be used (may be rate-limited).`}</div>
      <div style="margin-top:10px;padding:10px;background:var(--card-2);border:1px solid var(--line);border-radius:10px;font-size:12px"><b>Free Gemini key in 30 sec:</b> 1) Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style="text-decoration:underline">aistudio.google.com/app/apikey</a> → 2) Sign in with Google → 3) <b>Create API key</b> → 4) Copy <b>AIza...</b> → 5) Paste here → Save. Same key works on all devices (paste again).</div>
    </div>
    <div class="card" style="margin-top:16px">
      <h3>Study plan</h3>
      <p style="color:var(--muted);font-size:13px">Generate a realistic weekly schedule from your exam date and daily time.</p>
      <div class="row" style="margin-top:10px">
        <input id="plan-time" type="number" placeholder="Minutes per day, e.g. 60" class="search-input" style="max-width:220px;padding:10px 12px">
        <button class="btn btn-primary" id="generate-plan">Generate plan</button>
      </div>
      <div id="plan-output" style="margin-top:12px"></div>
    </div>
  </section>`;
}
function generatePlan(){
  const profile=Store.getProfile();
  const time = Number($("#plan-time")?.value) || 60;
  const cls = profile.class||12;
  const exam = profile.examDate? new Date(profile.examDate) : null;
  const days = exam? Math.max(1, Math.round((exam - new Date())/86400000)) : 30;
  const subjects = SUBJECTS.slice(0,3);
  const chaptersPerDay = Math.max(1, Math.round(time/30));
  let html = `<div style="padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--card-2)"><strong>Your weekly plan · ${time} min/day · ${days} days to exam</strong><div style="margin-top:10px;display:grid;gap:6px">`;
  const daysNames=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  for(let i=0;i<7;i++){
    const subj = subjects[i%subjects.length];
    const ch = getChapters(cls, subj)[i % getChapters(cls,subj).length];
    html+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--line);border-radius:9px;background:var(--card)"><span><b>${daysNames[i]}</b> · ${esc(SUBJECT_NAMES[subj])} — ${esc(ch.title)}</span><span class="badge">${Math.round(time/2)} min study · ${Math.round(time/3)} min Qs · 10 min revise</span></div>`;
  }
  html+=`</div><p style="color:var(--muted);font-size:11px;margin-top:8px">Mark tasks complete daily. Adapt based on weak topics.</p></div>`;
  const out=$("#plan-output");
  if(out) out.innerHTML=html;
  Store.setStudyPlan({time, days, generated: new Date().toISOString()});
}

// --- ROUTER ---
function getRoute(){
  const raw = location.hash || "#home";
  const [pathPart, query] = raw.split("?");
  const path = pathPart.replace(/^#/,"") || "home";
  // legacy redirects
  if(path.startsWith("class-11")) return {page:"study", grade:11};
  if(path.startsWith("class-12")) return {page:"study", grade:12};
  if(path.match(/^class-11\//)){
    const key=path.split("/")[1];
    if(SUBJECTS.includes(key)) return {page:"subject", grade:11, subject:key};
  }
  if(path.match(/^class-12\//)){
    const key=path.split("/")[1];
    if(SUBJECTS.includes(key)) return {page:"subject", grade:12, subject:key};
  }
  if(path==="classes") return {page:"study"};
  if(path.startsWith("revision/preset/")){
    const parts=path.split("/");
    return {page:"practice", class:Number(parts[2]), subject:parts[3]};
  }
  if(path==="home"||path==="") return {page:"home"};
  if(path.startsWith("study")){
    const parts=path.split("/");
    if(parts.length===1) return {page:"study"};
    if(parts.length===2) return {page:"class", grade:Number(parts[1])};
    if(parts.length===3) return {page:"subject", grade:Number(parts[1]), subject:parts[2]};
    if(parts.length===4) return {page:"lesson", grade:Number(parts[1]), subject:parts[2], idx:Number(parts[3])};
  }
  if(path.startsWith("practice")){
    if(path==="practice/session") return {page:"practice-session"};
    if(path==="practice/result") return {page:"practice-result"};
    return {page:"practice"};
  }
  if(path==="daily") return {page:"daily"};
  if(path==="mistakes") return {page:"mistakes"};
  if(path.startsWith("tests")){
    if(path==="tests"||path.startsWith("tests?")) return {page:"tests"};
    if(path==="test/session") return {page:"test-session"};
    if(path==="test/result") return {page:"test-result"};
  }
  if(path.startsWith("revision")){
    if(path==="revision/5min") return {page:"5min"};
    if(path==="revision/formulas") return {page:"formulas"};
    if(path==="revision/definitions") return {page:"definitions"};
    return {page:"revision"};
  }
  if(path.startsWith("ai")) return {page:"ai"};
  if(path==="progress") return {page:"progress"};
  if(path==="dashboard") return {page:"dashboard"};
  if(path==="profile") return {page:"profile"};
  if(path.startsWith("search")) return {page:"search"};
  if(path==="papers"||path==="quiz"||path==="search-old") return {page:"search"};
  return {page:"home"};
}

function render(){
  const route=getRoute();
  const app=$("#app");
  if(!app) return;
  const chrome=renderChrome();
  let body="";
  switch(route.page){
    case "home": body=pageHome(); break;
    case "study": body=pageStudyRoot(); break;
    case "class": body=pageClass(route.grade); break;
    case "subject": body=pageSubject(route.grade, route.subject); break;
    case "lesson": body=pageLesson(route.grade, route.subject, route.idx); break;
    case "practice": body=pagePractice(); break;
    case "practice-session": body=pagePracticeSession(); break;
    case "practice-result": body=pagePracticeResult(); break;
    case "daily": body=pageDaily(); break;
    case "mistakes": body=pageMistakes(); break;
    case "tests": body=pageTests(); break;
    case "test-session": body=pageTestSession(); break;
    case "test-result": body=pageTestResult(); break;
    case "revision": body=pageRevision(); break;
    case "5min": body=page5Min(); break;
    case "formulas": body=pageFormulas(); break;
    case "definitions": body=pageDefinitions(); break;
    case "ai": body=pageAI(); break;
    case "progress": body=pageProgress(); break;
    case "dashboard": body=pageDashboard(); break;
    case "profile": body=pageProfile(); break;
    case "search": body=pageSearch(); break;
    default: body=pageHome();
  }
  app.innerHTML = chrome + `<main id="main">${body}</main>` + footerHTML();
  bindEvents();
  // scroll top
  window.scrollTo(0,0);
  // re-attach theme button paint
  updateThemeButton();
  // start test timer if needed
  if(route.page==="test-session") startTestTimer();
}

function footerHTML(){
  return `
  <footer class="footer">
    <div class="shell footer-inner">
      <span><b>Commerce-Students</b> · Original questions · CBSE 2026–27 · local progress · no fake data.</span>
      <span><a href="https://www.cbseacademic.nic.in/" target="_blank" rel="noreferrer">CBSE Academic</a> · <a href="class11-it-notes.html">Class 11 IT notes ↗</a> · <a href="#search">Search</a></span>
    </div>
  </footer>`;
}

function updateThemeButton(){
  const btn=$("#theme-toggle");
  if(!btn) return;
  const isDark=document.documentElement.getAttribute("data-theme")==="dark";
  btn.innerHTML=isDark? ICONS.sun : ICONS.moon;
  btn.setAttribute("aria-label", isDark? "Switch to light mode":"Switch to dark mode");
}
function startTestTimer(){
  if(!testState || testState.timer) return;
  testState.timer=setInterval(()=>{
    testState.remaining--;
    const el=$("#test-timer");
    if(el) el.textContent=fmtTime(Math.max(0,testState.remaining));
    if(testState.remaining<=0){
      clearInterval(testState.timer);
      testState.timer=null;
      toast("Time up — submitting test");
      submitTest();
      render();
    }
  },1000);
}
function stopTestTimer(){
  if(testState?.timer){ clearInterval(testState.timer); testState.timer=null; }
}

// --- event delegation ---
function bindEvents(){
  const app=$("#app");
  if(!app) return;

  // theme toggle
  $("#theme-toggle")?.addEventListener("click", ()=>{
    const next=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
    document.documentElement.setAttribute("data-theme", next);
    Store.setTheme(next);
    updateThemeButton();
  });
  // mobile menu
  $("#menu-toggle")?.addEventListener("click", (e)=>{
    const nav=$("#mobile-nav");
    const open=nav.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
    e.currentTarget.innerHTML = open? ICONS.close : ICONS.menu;
  });

  // delegation
  app.addEventListener("click", handleClick);
  app.addEventListener("change", handleChange);
  app.addEventListener("input", handleInput);

  // specific bindings that need direct listeners (because delegation not reliable for some)
  $("#global-search")?.addEventListener("keydown", e=>{
    if(e.key==="Enter"){
      const v=e.target.value.trim();
      location.hash = v? `#search?q=${encodeURIComponent(v)}` : "#search";
    }
  });
  $("#formula-search")?.addEventListener("keydown", e=>{
    if(e.key==="Enter"){
      const v=e.target.value;
      const subj=$("#formula-subject")?.value || "";
      location.hash = `#revision/formulas?search=${encodeURIComponent(v)}${subj?`&subject=${subj}`:""}`;
    }
  });
  $("#def-search")?.addEventListener("keydown", e=>{
    if(e.key==="Enter"){
      const v=e.target.value;
      location.hash = `#revision/definitions?search=${encodeURIComponent(v)}`;
    }
  });
  $("#f-search")?.addEventListener("keydown", e=>{
    if(e.key==="Enter"){
      const params=new URLSearchParams(location.hash.split("?")[1]||"");
      params.set("search", e.target.value);
      location.hash = `#practice?${params.toString()}`;
    }
  });

  // if on test session, bind timer stop on unload
  window.addEventListener("beforeunload", ()=>{ stopTestTimer(); }, {once:true});
}

function handleClick(e){
  const t=e.target.closest("button, a, label, select");
  // chapter toggle
  const chapterRow = e.target.closest(".chapter-row");
  if(chapterRow){
    const chapter = chapterRow.closest(".chapter");
    const isCheck = e.target.closest(".chapter-check");
    if(isCheck){
      const ci = chapter.getAttribute("data-ci");
      // need grade/subject from hash
      const m = location.hash.match(/#study\/(\d+)\/([^\/]+)/);
      if(m){
        const grade=m[1], subject=m[2];
        const key=`${grade}-${subject}-${ci}`;
        const nowDone = Store.toggleCheck(key);
        chapter.classList.toggle("done", nowDone);
        chapter.querySelector(".chapter-check").textContent = nowDone?"✓":"";
        // update progress bar
        const total = chapter.parentElement.querySelectorAll(".chapter").length;
        const done = chapter.parentElement.querySelectorAll(".chapter.done").length;
        const pct=Math.round(done/total*100);
        const bar=document.querySelector(".progress i");
        if(bar) bar.style.width=pct+"%";
        const label=document.querySelector(".progress + div span:first-child");
        if(label) label.textContent=`${done} of ${total} chapters revised`;
        const pctEl=document.querySelector(".progress + div span:last-child");
        if(pctEl) pctEl.textContent=pct+"%";
      }
      e.preventDefault();
      return;
    }
    chapter.classList.toggle("open");
    chapterRow.setAttribute("aria-expanded", String(chapter.classList.contains("open")));
    return;
  }
  // delegate button actions
  const target = e.target.closest("[data-quicktest], #reset-checklist, #mark-complete, #start-practice, #submit-answer, #next-q, #finish-practice, #quit-practice, #practice-weak, #start-daily, #regenerate-daily, [data-review-mistake], [data-mastered], [data-practice-similar], [data-test-mode], #start-custom-test, #test-prev, #test-next, #test-mark, #test-clear, #test-submit, #test-submit-2, [data-test-jump], [data-jump], [data-ask-ai], #save-profile, #profile-theme, #reset-all, #generate-plan, #reset-progress, #retake-weak, [data-copy-formula], [data-ai-mode], #ai-ask, #explain-ai, [data-mark-correct], [data-ai-retry], [data-ai-offline], #test-ai-key, #save-ai-key, #clear-ai-key, #profile-save-key, #profile-clear-key");
  if(!target) return;

  if(target.hasAttribute("data-quicktest")){
    const idx=Number(target.getAttribute("data-quicktest"));
    const m=location.hash.match(/#study\/(\d+)\/([^\/]+)/);
    if(m){
      const grade=Number(m[1]), subject=m[2];
      const ch=getChapters(grade,subject)[idx];
      startTest({cls:grade, subject, count:15, minutes:20, mode:"Chapter"});
    }
    return;
  }
  if(target.id==="reset-checklist"){
    if(confirm("Reset checklist for this subject?")){
      const m=location.hash.match(/#study\/(\d+)\/([^\/]+)/);
      if(m){
        const grade=m[1], subject=m[2];
        const chs=getChapters(Number(grade),subject);
        chs.forEach((_,i)=> Store.setCheck(`${grade}-${subject}-${i}`, false));
        render();
      }
    }
    return;
  }
  if(target.id==="mark-complete"){
    const key=target.getAttribute("data-key");
    Store.toggleCheck(key);
    toast(Store.isChecked(key)?"Marked as completed ✓":"Marked as not completed");
    render();
    return;
  }
  if(target.id==="start-practice"){
    const params=new URLSearchParams(location.hash.split("?")[1]||"");
    const cls=Number(params.get("class"))||Store.getProfile().class||12;
    const subject=params.get("subject")||undefined;
    const chapter=params.get("chapter")? decodeURIComponent(params.get("chapter")):undefined;
    const search=params.get("search")||undefined;
    startPracticeSession({class:cls, subject, chapter, search}, 20);
    return;
  }
  if(target.id==="submit-answer"){
    const q=practiceState.questions[practiceState.idx];
    const picked=document.querySelector('input[name="q-opt"]:checked');
    if(!picked){ toast("Select an option first"); return; }
    const val=Number(picked.value);
    practiceState.answers[practiceState.idx]=val;
    const correct = val===q.correct;
    Store.recordAttempt({questionId:q.id, correct, time:60, chapter:q.chapter, topic:q.topic, subject:q.subject, class:q.class});
    if(!correct) Store.addMistake(q, val);
    render();
    return;
  }
  if(target.hasAttribute("data-mark-correct")){
    const correct=target.getAttribute("data-mark-correct")==="1";
    const q=practiceState.questions[practiceState.idx];
    practiceState.answers[practiceState.idx]= correct? q.correct : (q.correct===0?1:0);
    Store.recordAttempt({questionId:q.id, correct, time:120, chapter:q.chapter, topic:q.topic, subject:q.subject, class:q.class});
    if(!correct) Store.addMistake(q, null);
    render();
    return;
  }
  if(target.id==="next-q"){
    if(practiceState.idx < practiceState.questions.length-1){
      practiceState.idx++;
      render();
    }
    return;
  }
  if(target.id==="finish-practice"){
    // compute result and go to result
    location.hash="#practice/result";
    return;
  }
  if(target.id==="quit-practice"){
    if(confirm("Quit this practice session? Progress is saved.")){
      practiceState=null;
      location.hash="#practice";
    }
    return;
  }
  if(target.hasAttribute("data-jump")){
    const idx=Number(target.getAttribute("data-jump"));
    practiceState.idx=idx;
    render();
    return;
  }
  if(target.id==="practice-weak"){
    const weak=Object.values(practiceState.questions.reduce((acc,q,i)=>{
      const key=`${q.subject}|${q.chapter}|${q.topic}`;
      if(!acc[key]) acc[key]={q, count:0, correct:0};
      acc[key].count++;
      if(practiceState.answers[i]===q.correct) acc[key].correct++;
      return acc;
    },{}));
    // pick first weak topic
    const w=weak.find(v=> v.correct/v.count <1);
    const topic = w? w.q.topic : practiceState.questions[0].topic;
    location.hash=`#practice?search=${encodeURIComponent(topic)}`;
    setTimeout(()=> startPracticeSession({search:topic},10), 100);
    return;
  }
  if(target.id==="start-daily"){
    const daily=buildDaily10();
    Store.setDaily10(daily);
    startPracticeSession({class:daily.cls, search: daily.focus[0]||""}, 10);
    // override questions with daily set directly
    practiceState.questions = daily.questions;
    practiceState.isDaily = true;
    location.hash="#practice/session";
    return;
  }
  if(target.id==="regenerate-daily"){
    const daily=buildDaily10();
    Store.setDaily10({...daily, completed:false});
    render();
    return;
  }
  if(target.hasAttribute("data-review-mistake")){
    const id=target.getAttribute("data-review-mistake");
    const q=getQuestionById(id) || Store.getMistakes()[id]?.question;
    if(q){
      startPracticeSession({search:q.topic}, 5);
    }
    return;
  }
  if(target.hasAttribute("data-mastered")){
    const id=target.getAttribute("data-mastered");
    Store.markMastered(id, true);
    toast("Marked as mastered ✓");
    render();
    return;
  }
  if(target.hasAttribute("data-practice-similar")){
    const topic=target.getAttribute("data-practice-similar");
    startPracticeSession({search:topic}, 10);
    return;
  }
  if(target.hasAttribute("data-test-mode")){
    const mode=target.getAttribute("data-test-mode");
    const cls=Store.getProfile().class||12;
    if(mode==="quick") startTest({cls, subject:"", count:10, minutes:10, mode:"Quick Test"});
    else if(mode==="chapter") startTest({cls, subject:"accountancy", count:15, minutes:20, mode:"Chapter Test"});
    else if(mode==="subject") startTest({cls, subject:"accountancy", count:30, minutes:60, mode:"Subject Test"});
    else if(mode==="full") startTest({cls, subject:"", count:30, minutes:180, mode:"Full Mock"});
    return;
  }
  if(target.id==="start-custom-test"){
    const cls=Number($("#test-class")?.value)||12;
    const subject=$("#test-subject")?.value||"";
    const count=Number($("#test-count")?.value)||15;
    const minutes=Number($("#test-time")?.value)||30;
    startTest({cls, subject: subject||undefined, count, minutes, mode:"Custom Test"});
    return;
  }
  if(target.id==="test-prev"){
    testState.current = Math.max(0, (testState.current||0)-1);
    render();
    return;
  }
  if(target.id==="test-next"){
    testState.current = Math.min(testState.questions.length-1, (testState.current||0)+1);
    render();
    return;
  }
  if(target.id==="test-mark"){
    const idx=testState.current||0;
    testState.marked[idx]=!testState.marked[idx];
    render();
    return;
  }
  if(target.id==="test-clear"){
    const idx=testState.current||0;
    delete testState.answers[idx];
    render();
    return;
  }
  if(target.id==="test-submit"||target.id==="test-submit-2"){
    if(confirm(`Submit test? ${Object.keys(testState.answers).length}/${testState.questions.length} answered. You can’t change answers after submit.`)){
      stopTestTimer();
      submitTest();
    }
    return;
  }
  if(target.hasAttribute("data-test-jump")){
    testState.current = Number(target.getAttribute("data-test-jump"));
    // save current text answer if any
    const ta=$("#test-text-answer");
    if(ta) testState.answers[testState.current]= ta.value;
    render();
    return;
  }
  if(target.hasAttribute("data-ask-ai")){
    const qid=target.getAttribute("data-ask-ai");
    const q=getQuestionById(qid) || Store.getMistakes()[qid]?.question;
    if(!q){ toast("Question not found"); return; }
    // Find correct chapter index robustly
    let chIdx = getChapters(q.class,q.subject).findIndex(c=>c.title===q.chapter);
    if(chIdx<0) chIdx = 0;
    const ctx = {class:q.class, subject:q.subject, chapter: chIdx};
    aiContext=ctx;
    // Capture selected answer from mistake record if exists
    let selected = null;
    const mistake = Store.getMistakes()[qid];
    if(mistake && mistake.userAnswers && mistake.userAnswers.length){
      selected = mistake.userAnswers.slice(-1)[0].answer;
    } else if(practiceState && practiceState.questions){
      const idx = practiceState.questions.findIndex(x=>x.id===qid);
      if(idx>=0) selected = practiceState.answers[idx];
    }
    const qPayload = {
      question: q.question,
      options: q.options || [],
      correct: q.correct,
      selectedAnswer: selected,
      topic: q.topic,
      chapter: q.chapter,
      chapterIndex: chIdx,
      class: q.class,
      subject: q.subject,
      marks: q.marks,
      id: q.id
    };
    // stash for retry/offline
    window.CS = window.CS || {};
    window.CS._lastAIInput = qPayload;
    window.CS._lastAIMode = "explain";
    window.CS._lastAIContext = ctx;
    location.hash=`#ai?class=${ctx.class}&subject=${ctx.subject}&chapter=${ctx.chapter}`;
    setTimeout(async ()=>{
      const out=$("#ai-output");
      const inp=$("#ai-input");
      if(inp) inp.value = q.question;
      if(out){
        const prov = getAIProvider().name;
        out.innerHTML=`<span class="badge">Connecting to AI...</span><p style="color:var(--muted);font-size:13px;margin-top:8px">Provider: ${prov} · Sending current question to real API...</p><div class="skeleton" style="height:14px;width:90%;margin-top:8px"></div><div class="skeleton" style="height:14px;width:75%;margin-top:8px"></div>`;
        const res = await aiGenerateSafe("explain", qPayload, ctx);
        out.innerHTML = res.html;
      }
    },100);
    return;
  }
  if(target.id==="save-profile"){
    const name=$("#profile-name")?.value.trim() || "";
    const cls=Number($("#profile-class")?.value)||12;
    const exam=$("#profile-exam")?.value||"";
    const dailyTarget=Number($("#profile-target")?.value)||10;
    Store.setProfile({name, class:cls, examDate:exam, dailyTarget});
    toast("Profile saved ✓");
    return;
  }
  if(target.id==="profile-theme"){
    const next=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
    document.documentElement.setAttribute("data-theme", next);
    Store.setTheme(next);
    target.textContent= next==="dark"?"☀️ Light":"🌙 Dark";
    updateThemeButton();
    return;
  }
  if(target.id==="reset-all"){
    if(confirm("Reset ALL progress (attempts, mistakes, streak, checklist)? This cannot be undone.")){
      localStorage.clear();
      toast("All progress reset");
      render();
    }
    return;
  }
  if(target.id==="reset-progress"){
    if(confirm("Reset progress (attempts & mistakes)?")){
      localStorage.removeItem("cs:v2:progress");
      localStorage.removeItem("cs:v2:mistakes");
      localStorage.removeItem("cs:v2:streak");
      toast("Progress reset");
      render();
    }
    return;
  }
  if(target.id==="generate-plan"){
    generatePlan();
    return;
  }
  if(target.id==="retake-weak"){
    const res=testState?.result;
    if(res){
      const weak = Object.entries(res.perChapter).sort((a,b)=> (a[1].correct/a[1].total)-(b[1].correct/b[1].total))[0];
      if(weak){
        startPracticeSession({search:weak[0]},10);
      }
    }
    return;
  }
  if(target.hasAttribute("data-copy-formula")){
    const formula=target.getAttribute("data-copy-formula");
    navigator.clipboard?.writeText(formula).then(()=> toast("Copied ✓")).catch(()=> toast(formula));
    return;
  }
  if(target.hasAttribute("data-ai-mode")){
    const mode=target.getAttribute("data-ai-mode");
    const input=$("#ai-input")?.value.trim()||"";
    const ctx={
      class: Number($("#ai-class")?.value)||aiContext.class,
      subject: $("#ai-subject")?.value||aiContext.subject,
      chapter: aiContext.chapter||0
    };
    aiContext=ctx;
    window.CS = window.CS || {};
    window.CS._lastAIInput = input;
    window.CS._lastAIMode = mode;
    window.CS._lastAIContext = ctx;
    const out=$("#ai-output");
    if(out){
      const prov = getAIProvider().name;
      out.innerHTML=`<span class="badge">Connecting to AI... (${prov})</span><p style="color:var(--muted);font-size:12px;margin-top:6px">Provider: ${prov} · Mode: ${mode} · Sending request...</p><div class="skeleton" style="height:18px;width:60%;margin-top:8px"></div><div class="skeleton" style="height:14px;width:90%;margin-top:8px"></div><div class="skeleton" style="height:14px;width:85%;margin-top:8px"></div>`;
      (async ()=>{
        if(!input && mode !== "quiz-me"){
          // allow empty input - will generate chapter explanation
          // but warn
        }
        const res = await aiGenerateSafe(mode, input, ctx);
        out.innerHTML = res.html;
      })();
    }
    return;
  }
  if(target.id==="ai-ask"){
    const input=$("#ai-input")?.value.trim()||"";
    if(!input){ toast("Type a question first"); return; }
    const ctx={
      class: Number($("#ai-class")?.value)||aiContext.class,
      subject: $("#ai-subject")?.value||aiContext.subject,
      chapter: aiContext.chapter||0
    };
    aiContext=ctx;
    window.CS = window.CS || {};
    window.CS._lastAIInput = input;
    window.CS._lastAIMode = "explain";
    window.CS._lastAIContext = ctx;
    const out=$("#ai-output");
    if(out){
      const prov = getAIProvider().name;
      out.innerHTML=`<span class="badge">Connecting to AI... (${prov})</span><p style="color:var(--muted);font-size:12px;margin-top:6px">Provider: ${prov} · Sending your question...</p><div class="skeleton" style="height:16px;width:70%;margin-top:8px"></div><div class="skeleton" style="height:14px;width:95%;margin-top:8px"></div>`;
      (async ()=>{
        const res = await aiGenerateSafe("explain", input, ctx);
        out.innerHTML = res.html;
      })();
    }
    return;
  }
  if(target.id==="explain-ai"){
    const q=practiceState.questions[practiceState.idx];
    let chIdx = getChapters(q.class,q.subject).findIndex(c=>c.title===q.chapter);
    if(chIdx<0) chIdx = 0;
    const ctx={class:q.class, subject:q.subject, chapter: chIdx};
    const selected = practiceState.answers[practiceState.idx];
    const qPayload = {
      question: q.question,
      options: q.options || [],
      correct: q.correct,
      selectedAnswer: selected,
      topic: q.topic,
      chapter: q.chapter,
      chapterIndex: chIdx,
      class: q.class,
      subject: q.subject,
      marks: q.marks,
      id: q.id
    };
    window.CS = window.CS || {};
    window.CS._lastAIInput = qPayload;
    window.CS._lastAIMode = "explain";
    window.CS._lastAIContext = ctx;
    location.hash=`#ai?class=${q.class}&subject=${q.subject}&chapter=${ctx.chapter}`;
    setTimeout(async ()=>{
      const el=$("#ai-output");
      const inp=$("#ai-input");
      if(inp) inp.value=q.question;
      if(el){
        const prov = getAIProvider().name;
        el.innerHTML=`<span class="badge">Connecting to AI... (${prov})</span><p style="color:var(--muted);font-size:13px;margin-top:8px">Provider: ${prov} · Explaining your current question (Q${practiceState.idx+1})...</p><div class="skeleton" style="height:14px;width:90%;margin-top:8px"></div><div class="skeleton" style="height:14px;width:75%;margin-top:8px"></div>`;
        // Also show that prompt will contain class/subject/chapter/question/options/correct/selected
        const res = await aiGenerateSafe("explain", qPayload, ctx);
        el.innerHTML = res.html;
      }
    },200);
    return;
  }
  // --- API key handlers (AI page + Profile) ---
  if(target.id==="save-ai-key" || target.id==="profile-save-key"){
    const inp = document.getElementById("ai-key-input") || document.getElementById("profile-key-input");
    const val = (inp?.value || document.getElementById("profile-key-input")?.value || "").trim();
    if(!val){ toast("Paste a key first (AIza... or pk_/sk_...)"); return; }
    if(!(val.startsWith("AIza") || val.startsWith("pk_") || val.startsWith("sk_"))){
      toast("Key should start with AIza (Gemini) or pk_/sk_ (Pollinations)");
    }
    Store.setApiKey(val);
    toast("API key saved locally ✓ Live AI will use it");
    render();
    return;
  }
  if(target.id==="clear-ai-key" || target.id==="profile-clear-key"){
    Store.clearApiKey();
    toast("API key cleared — using free Pollinations");
    render();
    return;
  }
  if(target.id==="test-ai-key"){
    const out=document.getElementById("ai-output");
    if(out){
      const prov = getAIProvider().name;
      out.innerHTML=`<span class="badge">Connecting to AI... (${prov})</span><p style="color:var(--muted);font-size:12px;margin-top:6px">Provider: ${prov} · Sending test prompt...</p><div class="skeleton" style="height:18px;width:60%"></div><div class="skeleton" style="height:14px;width:90%;margin-top:8px"></div>`;
      (async ()=>{
        const testPrompt = "Hello! Reply with 'Live AI test ok - ' + today's date in one short sentence.";
        window.CS._lastAIInput = testPrompt;
        window.CS._lastAIMode = "test";
        window.CS._lastAIContext = aiContext;
        try{
          const res = await fetchPollinations(testPrompt);
          out.innerHTML = `<span class="badge badge-success">Live AI test ✓ Real response · ${esc(prov)}</span><div style="margin-top:10px;font-size:13.5px">${formatAIText(res)}</div><p style="color:var(--muted);font-size:11px;margin-top:8px">✓ This is a REAL AI response, not demo. Provider: ${esc(prov)} | Key: ${esc((Store.getApiKey()||"").slice(0,6))}****</p>`;
        }catch(e){
          out.innerHTML = `<span class="badge badge-danger">AI request failed · ${esc(prov)}</span><div style="margin-top:8px;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px"><strong style="color:#dc2626">Live AI test failed</strong><p style="font-size:13px;margin-top:6px"><b>Provider:</b> ${esc(prov)}<br><b>Error:</b> ${esc(e.message)}</p><div class="row" style="margin-top:10px"><button class="btn btn-primary btn-sm" data-ai-retry="test">Retry</button><a class="btn btn-sm" href="#profile">Check key</a></div><p style="font-size:11px;color:var(--muted);margin-top:8px">Check Console → [AI DEBUG] for HTTP status & API error. Demo is NOT shown automatically — only real errors are shown.</p></div>`;
        }
      })();
    }
    return;
  }
  if(target.hasAttribute("data-ai-retry")){
    const mode = target.getAttribute("data-ai-retry") || window.CS._lastAIMode || "explain";
    const ctx = window.CS._lastAIContext || aiContext;
    const input = window.CS._lastAIInput || $("#ai-input")?.value.trim() || "";
    const out = document.getElementById("ai-output");
    if(out){
      const prov = getAIProvider().name;
      out.innerHTML=`<span class="badge">Retrying... (${prov})</span><p style="color:var(--muted);font-size:12px;margin-top:6px">Provider: ${prov} · Retrying real API request...</p><div class="skeleton" style="height:14px;width:90%;margin-top:8px"></div>`;
      (async ()=>{
        const res = await aiGenerateSafe(mode==="test"?"explain":mode, input, ctx);
        out.innerHTML = res.html;
      })();
    }
    return;
  }
  if(target.hasAttribute("data-ai-offline")){
    const mode = target.getAttribute("data-ai-offline") || window.CS._lastAIMode || "explain";
    const ctx = window.CS._lastAIContext || aiContext;
    const input = window.CS._lastAIInput || $("#ai-input")?.value.trim() || "";
    const out = document.getElementById("ai-output");
    if(out){
      const ch = getChapters(ctx.class, ctx.subject)[ctx.chapter];
      const chapterName = ch ? ch.title : "this chapter";
      const offlineHtml = buildOfflineFallback(mode, input, ctx);
      out.innerHTML = `<span class="badge badge-warn">Offline fallback — explicitly requested</span><div style="margin-top:10px;padding:12px;border:1px dashed var(--warning);background:var(--warning-soft);border-radius:10px;font-size:12px"><b>Note:</b> This is an <b>explicitly requested offline explanation</b> for <b>${esc(chapterName)}</b> — NOT a live AI response. Live AI failed; you chose to view the fallback. For a real response, click Retry or add a Gemini key.</div><div style="margin-top:10px;font-size:13.5px;line-height:1.6">${offlineHtml}</div><div class="row" style="margin-top:12px"><button class="btn btn-primary btn-sm" data-ai-retry="${esc(mode)}">Retry live AI</button></div>`;
    }
    return;
  }
}
function handleChange(e){
  const t=e.target;
  if(t.id==="f-class"||t.id==="f-subject"){
    const cls=$("#f-class")?.value;
    const subj=$("#f-subject")?.value;
    const params=new URLSearchParams(location.hash.split("?")[1]||"");
    if(cls) params.set("class", cls);
    if(subj) params.set("subject", subj); else params.delete("subject");
    // reset chapter if subject changed? keep
    location.hash=`#practice?${params.toString()}`;
  }
  if(t.id==="ai-class"||t.id==="ai-subject"){
    const cls=Number($("#ai-class")?.value)||12;
    const subj=$("#ai-subject")?.value||"accountancy";
    const gradeChapters=getChapters(cls, subj);
    aiContext={class:cls, subject:subj, chapter:0};
    // update context display? re-render AI header? simple: update badge? just keep.
  }
  if(t.name==="q-opt"){
    // for test, save answer on change
    if(location.hash.startsWith("#test/")){
      const idx=testState.current||0;
      testState.answers[idx]=Number(t.value);
    }
  }
  if(t.name==="test-opt"){
    const idx=testState.current||0;
    testState.answers[idx]=Number(t.value);
    // update nav colors? re-render lightly? not needed
  }
}
function handleInput(e){
  const t=e.target;
  if(t.id==="test-text-answer"){
    const idx=testState.current||0;
    testState.answers[idx]=t.value;
  }
  if(t.id==="global-search"){
    // live search not needed, enter triggers
  }
}

// --- init ---
window.addEventListener("hashchange", render);
window.addEventListener("load", ()=>{
  // handle daily completion marking
  // if practiceState completed, mark daily done
  render();
});
// also handle practice result completion marking daily
(function observeHash(){
  let last="";
  setInterval(()=>{
    if(location.hash!==last){
      last=location.hash;
      if(location.hash==="#practice/result" && practiceState?.isDaily){
        const daily=Store.getDaily10();
        if(daily){
          const correct = practiceState.questions.filter((q,i)=> practiceState.answers[i]===q.correct).length;
          Store.setDaily10({...daily, completed:true, score:correct});
        }
      }
      if(location.hash.startsWith("#test/") && testState && !testState.timer && location.hash==="#test/session"){
        startTestTimer();
      }
    }
  },500);
})();

// expose for debugging / tests
window.CS = window.CS || {};
window.CS.getQuestions = getQuestions;
window.CS.FORMULAS = FORMULAS;
window.CS.DEFINITIONS = DEFINITIONS;
window.CS.getAIProvider = getAIProvider;
window.CS.buildAIPrompt = buildAIPrompt;
window.CS.buildAIPromptForQuestion = buildAIPromptForQuestion;
window.CS.buildOfflineFallback = buildOfflineFallback;
window.CS.aiDebugLog = aiDebugLog;
window.CS.aiGenerate = aiGenerate;
window.CS.aiGenerateSafe = aiGenerateSafe;
window.CS.fetchPollinations = fetchPollinations;
window.CS.fetchGemini = fetchGemini;
window.CS._lastAIRequest = null;
window.CS._lastAIResponse = null;
window.CS._lastAIError = null;
window.CS._lastAIInput = null;
window.CS._lastAIMode = null;
window.CS._lastAIContext = null;
window.CS.showAIDebug = function(){
  console.log("=== CS AI DEBUG ===");
  console.log("Provider:", getAIProvider());
  console.log("Last Input:", window.CS._lastAIInput);
  console.log("Last Mode:", window.CS._lastAIMode);
  console.log("Last Context:", window.CS._lastAIContext);
  console.log("Last Request:", window.CS._lastAIRequest);
  console.log("Last Response:", window.CS._lastAIResponse);
  console.log("Last Error:", window.CS._lastAIError);
  if(window.CS._lastAIRequest){
    const p = window.CS._lastAIRequest.prompt;
    console.log("Last Prompt (full):", p);
    console.log("Prompt preview:", p.slice(0,400));
  }
  alert("AI Debug logged to Console (F12 → Console). Provider: " + getAIProvider().name + "\nSee console for provider, HTTP status, error, parse details.");
};
window.CS.testAIWithQuestions = async function(){
  const testQs = [
    getQuestionById("acc12-goodwill-001"),
    getQuestionById("eco12-ad-001"),
    getQuestionById("bus12-control-001")
  ].filter(Boolean);
  console.log("=== Testing AI with 3 distinct questions ===");
  for(let i=0;i<testQs.length;i++){
    const q = testQs[i];
    let chIdx = getChapters(q.class,q.subject).findIndex(c=>c.title===q.chapter);
    if(chIdx<0) chIdx=0;
    const ctx={class:q.class, subject:q.subject, chapter:chIdx};
    const payload={question:q.question, options:q.options||[], correct:q.correct, selectedAnswer:(q.correct+1)%(q.options.length||2), topic:q.topic, chapter:q.chapter, chapterIndex:chIdx, class:q.class, subject:q.subject, marks:q.marks, id:q.id};
    console.log("\n--- Question "+(i+1)+" ---");
    console.log("Class:",q.class,"Subject:",q.subject,"Chapter:",q.chapter,"Topic:",q.topic);
    console.log("Q:",q.question.slice(0,120));
    console.log("Options:",q.options);
    console.log("Correct:",q.correct,"Selected (simulated wrong):",payload.selectedAnswer);
    const prompt = buildAIPrompt("explain", payload, ctx);
    console.log("Prompt built:",prompt.slice(0,300)+"...");
    // verify prompt contains question data
    const containsQ = prompt.includes(q.question.slice(0,20).replace(/[^\x00-\x7F]/g,""));
    const containsOpts = q.options && q.options.length ? prompt.includes(q.options[0].slice(0,10).replace(/[^\x00-\x7F]/g,"")) : true;
    console.log("Prompt contains question text?", containsQ, "contains options?", containsOpts);
    if(!containsQ) console.warn("FAIL: prompt does not contain current question!");
  }
  console.log("\n=== Prompt generation test done — now testing live AI (if network available) ===");
  // Optionally try one live call (free tier may be rate-limited)
  try{
    const q = testQs[0];
    let chIdx = getChapters(q.class,q.subject).findIndex(c=>c.title===q.chapter);
    if(chIdx<0) chIdx=0;
    const ctx={class:q.class, subject:q.subject, chapter:chIdx};
    const payload={question:q.question, options:q.options||[], correct:q.correct, selectedAnswer:(q.correct+1)%(q.options.length||2), topic:q.topic, chapter:q.chapter, chapterIndex:chIdx, class:q.class, subject:q.subject, marks:q.marks, id:q.id};
    console.log("Sending live AI request for Q1...");
    const html = await aiGenerate("explain", payload, ctx);
    console.log("Live AI succeeded, html length", html.length, "preview", html.slice(0,300));
    console.log("Check html contains question-specific content? Should mention chapter or question terms");
  }catch(e){
    console.error("Live AI failed (expected if offline/rate-limited):", e.message.slice(0,500));
    console.log("This is CORRECT behavior — should show FAILED UI, not silent demo. Error is logged here.");
  }
  console.log("=== End test ===");
};

// initial render if not already
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", render);
else render();
