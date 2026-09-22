/* ============================================================
   Commerce-Students Study OS (Classes 11 & 12 Commerce)
   ============================================================ */
(function () {
  'use strict';

  var W = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
  W.QB = W.QB || {};

  /* ---------------- constants ---------------- */

  var SUBJECTS = ['accountancy', 'business', 'economics', 'english', 'information'];
  var SUBJECT_NAMES = {
    accountancy: 'Accountancy',
    business: 'Business Studies',
    economics: 'Economics',
    english: 'English Core',
    information: 'Information Technology'
  };
  var SUBJECT_ICONS = {
    accountancy: '₹',
    business: '⇈',
    economics: '∿',
    english: 'Aa',
    information: '</>'
  };
  var CURRICULUM_LINKS = {
    accountancy: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Accountancy_SecP2_2026-27.pdf',
    business: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/BusinessStudies_SecP2_2026-27.pdf',
    economics: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/Economics_SecP2_2026-27.pdf',
    english: 'https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart2/English_core_SecP2_2026-27.pdf',
    information: 'https://cbseacademic.nic.in/web_material/Curriculum27/SrSec/802-IT.pdf'
  };

  var BANK_KEY = {
    accountancy: 'acc',
    business: 'bus',
    economics: 'eco',
    english: 'eng',
    information: 'it'
  };

  var TYPE_ORDER = ['mcq', 'short', 'long', 'mixed', 'full'];
  var TYPE_META = {
    mcq: { label: '20-Question MCQ Quiz', desc: 'Objective test with instant score and answer explanations', duration: '25 min', marksNote: '1 mark each' },
    short: { label: 'Short Answer Paper', desc: 'Short-answer questions with concise model answer points', duration: '60 min', marksNote: '2 marks each' },
    long: { label: 'Long Answer Paper', desc: 'Long-answer questions with detailed model answer points', duration: '90 min', marksNote: '4 marks each' },
    mixed: { label: 'Mixed Paper', desc: '10 MCQ + 5 short + 3 long in one sitting', duration: '60 min', marksNote: '1 / 2 / 4 marks' },
    full: { label: 'All-in-One Paper', desc: 'Full subject paper in the current CBSE layout with correct marks', duration: '3 hours', marksNote: '80 theory · 60 theory for IT' }
  };

  var STORAGE = {
    theme: 'cs-theme',
    rev: 'cs-rev',
    check: 'cs-check',
    bookmark: 'cs:bookmarks',
    mistakes: 'cs:mistakes',
    quizScores: 'cs:quiz-scores',
    lastStudy: 'cs:last-study',
    paper: 'cs-paper'
  };

  /* ---------------- helpers ---------------- */

  function loadJSON(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch];
    });
  }

  function bank(grade, subject) {
    var key = (BANK_KEY[subject] || subject) + '-' + grade;
    return (W.QB && W.QB[key]) || null;
  }

  function bankTotals(grade, subject) {
    var b = bank(grade, subject);
    if (!b) return null;
    var t = { mcq: 0, sh: 0, lg: 0, cs: 0, chapters: b.chapters.length };
    b.chapters.forEach(function (ch) {
      t.mcq += (ch.mcq || []).length;
      t.sh += (ch.sh || []).length;
      t.lg += (ch.lg || []).length;
      t.cs += (ch.cs || []).length;
    });
    return t;
  }

  function selectedPools(grade, subject, chapterSel) {
    var b = bank(grade, subject);
    if (!b) return [];
    return b.chapters
      .map(function (ch, ci) {
        return {
          ci: ci,
          title: ch.t,
          mcq: ch.mcq || [],
          sh: ch.sh || [],
          lg: ch.lg || [],
          cs: ch.cs || []
        };
      })
      .filter(function (p) { return chapterSel && chapterSel[p.ci]; });
  }

  /* Intelligent question picking: uses only unique questions unless repeat requested */
  function pickKind(pools, kind, count, cursor, allowRepeat) {
    var result = [];
    var wrapped = false;
    var totalAvailable = pools.reduce(function (s, p) { return s + p[kind].length; }, 0);
    var active = pools.filter(function (p) { return p[kind].length; });
    var targetCount = allowRepeat ? count : Math.min(count, totalAvailable);
    var guard = 0;

    while (result.length < targetCount && active.length && guard < 5000) {
      guard++;
      var best = 0;
      for (var i = 1; i < active.length; i++) {
        var remA = active[i][kind].length - (cursor[active[i].ci + ':' + kind] || 0);
        var remB = active[best][kind].length - (cursor[active[best].ci + ':' + kind] || 0);
        if (remA > remB) best = i;
      }
      var p = active[best];
      var key = p.ci + ':' + kind;
      var used = cursor[key] || 0;
      var pos = used % p[kind].length;
      if (used >= p[kind].length) wrapped = true;
      result.push({ ci: p.ci, qi: pos, item: p[kind][pos], isRepeated: used >= p[kind].length });
      cursor[key] = used + 1;
    }
    return { items: result, wrapped: wrapped, totalAvailable: totalAvailable };
  }

  var KIND_CODE = { mcq: 'm', sh: 's', lg: 'l', cs: 'c' };

  function normItem(kind, ci, qi, raw, num, marks, grade, subject, isRepeated) {
    var base = {
      kind: kind,
      id: grade + '-' + subject + '-c' + ci + '-' + KIND_CODE[kind] + qi,
      num: num,
      marks: marks,
      chapter: ci,
      isRepeated: !!isRepeated
    };
    if (kind === 'mcq') {
      base.q = raw[0];
      base.opts = raw[1];
      base.correct = raw[2];
      base.exp = raw[3];
    } else {
      base.q = raw[0];
      base.model = raw[1];
    }
    return base;
  }

  /* Build a full paper. Deterministic: same spec => same paper. */
  function buildPaper(spec, forceAllRequested) {
    var b = bank(spec.grade, spec.subject);
    if (!b) return null;
    var pools = selectedPools(spec.grade, spec.subject, spec.chapters);
    var isIT = spec.subject === 'information';
    var sections = [];
    var total = 0;
    var duration;
    var reused = false;
    var extraNote = '';
    var cursor = {};
    var numCounter = 0;

    function addSection(heading, kind, count, marksEach) {
      var pick = pickKind(pools, kind, count, cursor, forceAllRequested);
      reused = reused || pick.wrapped;
      var items = pick.items.map(function (it) {
        numCounter++;
        return normItem(kind, it.ci, it.qi, it.item, numCounter, marksEach, spec.grade, spec.subject, it.isRepeated);
      });
      if (items.length) {
        sections.push({ heading: heading, items: items, marksEach: marksEach });
        total += items.length * marksEach;
      }
    }

    if (spec.type === 'mcq') {
      duration = TYPE_META.mcq.duration;
      addSection('Section A · Multiple Choice Questions', 'mcq', 20, 1);
      extraNote = 'Tick one option per question, then press “Check answers” for instant scoring and explanations.';
    } else if (spec.type === 'short') {
      duration = TYPE_META.short.duration;
      addSection('Short Answer Questions', 'sh', 20, 2);
      extraNote = 'Each question carries 2 marks. Use the model points to structure your own answer.';
    } else if (spec.type === 'long') {
      duration = TYPE_META.long.duration;
      addSection('Long Answer Questions', 'lg', 20, 4);
      extraNote = 'Each question carries 4 marks. Aim for 6–10 points with an opening line and a short conclusion.';
    } else if (spec.type === 'mixed') {
      duration = TYPE_META.mixed.duration;
      addSection('Section A · Multiple Choice (10 × 1)', 'mcq', 10, 1);
      addSection('Section B · Short Answer (5 × 2)', 'sh', 5, 2);
      addSection('Section C · Long Answer (3 × 4)', 'lg', 3, 4);
      extraNote = 'A quick full-cycle rehearsal: objective, short and long in one paper.';
    } else { /* full */
      duration = '3 hours';
      if (isIT) {
        addSection('Section A · Objective (16 × 1)', 'mcq', 16, 1);
        addSection('Section B · Very Short Answer (8 × 2)', 'sh', 8, 2);
        addSection('Section C · Short Answer (5 × 4)', 'lg', 5, 4);
        addSection('Section D · Application / Case Based (2 × 4)', 'cs', 2, 4);
        extraNote = 'CBSE format for IT (802): Theory 60 marks in this paper · Practical 40 marks assessed outside the exam · 3 hours.';
      } else {
        addSection('Section A · MCQs & Assertion–Reason (20 × 1)', 'mcq', 20, 1);
        addSection('Section B · Very Short Answer (5 × 2)', 'sh', 5, 2);
        addSection('Section C · Short Answer (6 × 3)', 'lg', 6, 3);
        addSection('Section D · Long Answer (4 × 5)', 'lg', 4, 5);
        addSection('Section E · Case-Based (3 × 4)', 'cs', 3, 4);
        extraNote = 'CBSE format: Theory 80 marks in this paper · Project / internal assessment 20 marks outside the exam · 3 hours.';
      }
    }

    if (reused) {
      extraNote += ' Notice: Questions have been repeated because selected chapters hold fewer unique items than the standard quota.';
    }

    return {
      spec: spec,
      title: 'Class ' + spec.grade + ' · ' + SUBJECT_NAMES[spec.subject],
      typeLabel: TYPE_META[spec.type].label,
      sections: sections,
      total: total,
      duration: duration,
      extraNote: extraNote,
      questionCount: numCounter
    };
  }

  /* Expose globals for testing and extensions */
  W.CS = {
    esc: esc,
    bank: bank,
    bankTotals: bankTotals,
    buildPaper: buildPaper,
    pickKind: pickKind,
    selectedPools: selectedPools,
    SUBJECTS: SUBJECTS,
    SUBJECT_NAMES: SUBJECT_NAMES,
    TYPE_META: TYPE_META,
    TYPE_ORDER: TYPE_ORDER,
    STORAGE: STORAGE,
    loadJSON: loadJSON,
    saveJSON: saveJSON
  };

  /* ---------------- DOM Handles ---------------- */

  var app = document.getElementById('app');
  var brandMark = document.getElementById('brand-mark');
  var LOGO_MARKUP = '<img src="assets/logo.svg" alt="" loading="eager" decoding="async">';
  if (brandMark) brandMark.innerHTML = LOGO_MARKUP;

  var ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 14.2A8.6 8.6 0 0 1 9.8 3.8a8.6 8.6 0 1 0 10.4 10.4z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    gemini: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.8l2.6 7.6 7.6 2.6-7.6 2.6L12 22.2l-2.6-7.6-7.6-2.6 7.6-2.6z"/></svg>',
    notebooklm: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="2.8" width="16" height="18.4" rx="2.6" stroke="currentColor" stroke-width="1.8"/><path d="M8.4 2.8v18.4" stroke="currentColor" stroke-width="1.8"/><path fill="currentColor" d="M15.2 8.9l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z"/></svg>'
  };

  /* ---------------- theme ---------------- */

  var themeBtn = document.getElementById('theme-toggle');
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
  function applyTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    try { localStorage.setItem(STORAGE.theme, name); } catch (e) {}
    if (themeBtn) {
      themeBtn.innerHTML = name === 'dark' ? ICONS.sun : ICONS.moon;
      themeBtn.setAttribute('aria-label', name === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }

  var savedTheme = null;
  try { savedTheme = localStorage.getItem(STORAGE.theme); } catch (e) {}
  if (!savedTheme && W.matchMedia && W.matchMedia('(prefers-color-scheme: dark)').matches) {
    savedTheme = 'dark';
  }
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------------- mobile nav ---------------- */

  var menuBtn = document.getElementById('menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  var menuOpen = false;

  var NAV_LINKS = [
    { nav: 'home', href: '#home', label: 'Home' },
    { nav: 'classes', href: '#classes', label: 'Classes' },
    { nav: 'revision', href: '#revision', label: 'Practice' },
    { nav: 'quiz', href: '#quiz', label: 'Timed Quiz' },
    { nav: 'study', href: '#study', label: 'My Study' },
    { nav: 'ai', href: '#ai', label: 'AI Assistant' }
  ];

  function paintMenu() {
    if (!menuBtn || !mobileNav) return;
    menuBtn.innerHTML = menuOpen ? ICONS.close : ICONS.menu;
    menuBtn.setAttribute('aria-expanded', String(menuOpen));
    menuBtn.setAttribute('aria-label', menuOpen ? 'Close navigation menu' : 'Open navigation menu');
    mobileNav.classList.toggle('open', menuOpen);
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      menuOpen = !menuOpen;
      paintMenu();
    });
  }

  function setNavActive(name) {
    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === name);
    });
    if (mobileNav) {
      mobileNav.innerHTML = NAV_LINKS.map(function (item) {
        return '<a class="' + (item.nav === name ? 'active' : '') + '" href="' + item.href + '">' + item.label + '</a>';
      }).join('');
    }
  }

  function crumbs(list) {
    return '<nav class="breadcrumbs" aria-label="Breadcrumb">' +
      list.map(function (c, i) {
        if (i === list.length - 1 || !c.href) {
          return '<span aria-current="page">' + esc(c.label) + '</span>';
        }
        return '<a href="' + c.href + '">' + esc(c.label) + '</a><span>/</span>';
      }).join('') +
    '</nav>';
  }

  function subjectBlurb(key) {
    return {
      accountancy: 'Financial statements, partnership reconstitution, company accounts and cash flows.',
      business: 'Principles of management, business finance, marketing, and legal protections.',
      economics: 'Microeconomic producer behavior, macroeconomic national aggregates, money and fiscal budgets.',
      english: 'CBSE Flamingo, Vistas prose and poetry, and business correspondence models.',
      information: 'Operating systems, RDBMS SQL, networking, cloud systems, and cyber security.'
    }[key] || '';
  }

  /* ---------------- home view ---------------- */

  function renderHome() {
    setNavActive('home');
    document.title = 'Commerce-Students · CBSE Commerce Revision & Study OS';

    var lastStudy = loadJSON(STORAGE.lastStudy, null);
    var continueHTML = '';
    if (lastStudy && lastStudy.grade && lastStudy.subject) {
      continueHTML =
        '<section class="section" style="padding-top:20px; padding-bottom:10px;">' +
          '<div style="padding:16px 20px; border:1px solid var(--fg); border-radius:14px; background:var(--card); display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">' +
            '<div>' +
              '<div class="eyebrow" style="margin-bottom:4px;">Continue Studying</div>' +
              '<strong>Class ' + lastStudy.grade + ' ' + esc(SUBJECT_NAMES[lastStudy.subject]) + '</strong>' +
              (lastStudy.chapterTitle ? '<span style="color:var(--muted); font-size:13px;"> · ' + esc(lastStudy.chapterTitle) + '</span>' : '') +
            '</div>' +
            '<a class="btn btn-solid btn-sm" href="#class-' + lastStudy.grade + '/' + lastStudy.subject + '">Open Subject →</a>' +
          '</div>' +
        '</section>';
    }

    var totalBankQs = 0;
    [11, 12].forEach(function (g) {
      SUBJECTS.forEach(function (s) {
        var t = bankTotals(g, s);
        if (t) totalBankQs += (t.mcq + t.sh + t.lg + t.cs);
      });
    });

    app.innerHTML =
      '<section class="shell home-hero"><div class="hero-copy">' +
        '<div class="hero-logo" aria-hidden="true">' + LOGO_MARKUP + '</div>' +
        '<span class="eyebrow">Commerce · XI – XII</span>' +
        '<h1>Commerce-<em>Students</em></h1>' +
        '<p class="hero-sub">The quiet, distraction-free study operating system for CBSE Commerce. Chapter checklists, original questions, timed tests and custom exam papers with zero login walls.</p>' +
        '<div class="hero-actions">' +
          '<a class="btn btn-solid" href="#class-12">Class 12 Board Prep</a>' +
          '<a class="btn btn-soft" href="#class-11">Class 11 Foundation</a>' +
          '<a class="btn btn-soft" href="#quiz">⚡ 5-Min Timed Quiz</a>' +
        '</div>' +
        '<div class="hero-meta">' +
          '<span><i></i> ' + totalBankQs + '+ Original Questions</span>' +
          '<span><i></i> 5 Subjects</span>' +
          '<span><i></i> 100% CBSE 2026–27 Format</span>' +
          '<span><i></i> Local & Private</span>' +
        '</div>' +
      '</div></section>' +
      '<div class="shell">' +
        continueHTML +
        '<section class="section">' +
          '<div class="section-head">' +
            '<div><span class="eyebrow">Curriculum</span><h2>Choose your year</h2></div>' +
            '<p>Class 11 builds conceptual accounting principles and economic models; Class 12 focuses directly on board examination preparation.</p>' +
          '</div>' +
          '<div class="class-grid">' +
            '<a class="class-card" href="#class-11" data-grade="11">' +
              '<span class="class-kicker">Foundation Year</span>' +
              '<h3>Class 11 Commerce</h3>' +
              '<span class="class-count">5 Subjects · Accountancy, BST, Economics, English, IT</span>' +
              '<span class="card-arrow">Start Class 11 →</span>' +
            '</a>' +
            '<a class="class-card" href="#class-12" data-grade="12">' +
              '<span class="class-kicker">Board Year</span>' +
              '<h3>Class 12 Commerce</h3>' +
              '<span class="class-count">5 Subjects · Board-aligned question banks & case studies</span>' +
              '<span class="card-arrow">Start Class 12 →</span>' +
            '</a>' +
          '</div>' +
        '</section>' +
        '<section class="section">' +
          '<div class="section-head">' +
            '<div><span class="eyebrow">Quick Practice</span><h2>Instant study shortcuts</h2></div>' +
            '<p>Jump directly into practice drills or review mistakes from your previous tests.</p>' +
          '</div>' +
          '<div class="choice-grid cols-3">' +
            '<a class="choice" href="#quiz">' +
              '<strong>⚡ 5-Minute Timed Quiz</strong>' +
              '<small>Rapid-fire 10 MCQs with countdown timer across any commerce subject.</small>' +
            '</a>' +
            '<a class="choice" href="#revision">' +
              '<strong>📝 Custom Paper Builder</strong>' +
              '<small>Generate 20-MCQ quizzes, mixed tests, or complete 80-mark mock papers.</small>' +
            '</a>' +
            '<a class="choice" href="#study">' +
              '<strong>⭐ My Study & Mistakes</strong>' +
              '<small>Review your saved bookmarks, chapter progress, and error notebook.</small>' +
            '</a>' +
          '</div>' +
        '</section>' +
      '</div>';
  }

  /* ---------------- classes view ---------------- */

  function renderClasses() {
    setNavActive('classes');
    document.title = 'Classes · Commerce-Students';

    var block = function (grade) {
      return '<section class="class-block" style="margin-bottom:36px;">' +
        '<div class="section-head">' +
          '<div><span class="eyebrow">Year ' + (grade - 10) + '</span><h2>Class ' + grade + ' Subjects</h2></div>' +
          '<a class="btn btn-soft btn-sm" href="#class-' + grade + '">Explore Class ' + grade + ' →</a>' +
        '</div>' +
        '<div class="subjects-grid">' +
          SUBJECTS.map(function (key) {
            var b = bank(grade, key);
            var chCount = b ? b.chapters.length : 0;
            return '<a class="subject-card" href="#class-' + grade + '/' + key + '">' +
              '<span class="subject-icon">' + SUBJECT_ICONS[key] + '</span>' +
              '<h4>' + esc(SUBJECT_NAMES[key]) + '</h4>' +
              '<p>' + esc(subjectBlurb(key)) + '</p>' +
              '<span class="subject-meta">' + chCount + ' chapters</span>' +
            '</a>';
          }).join('') +
        '</div>' +
      '</section>';
    };

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Classes' }]) +
        '<div class="eyebrow">Academic Curriculum</div>' +
        '<h1 class="page-title">Classes 11 and 12</h1>' +
        '<p class="page-intro">Complete syllabi and question banks for CBSE Commerce students across both senior secondary years.</p>' +
        block(11) +
        block(12) +
      '</section>';
  }

  /* ---------------- class detail view ---------------- */

  function renderClass(grade) {
    setNavActive('classes');
    document.title = 'Class ' + grade + ' Commerce · Commerce-Students';

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Classes', href: '#classes' }, { label: 'Class ' + grade }]) +
        '<div class="eyebrow">CBSE Class ' + grade + '</div>' +
        '<h1 class="page-title">Class ' + grade + ' Commerce</h1>' +
        '<p class="page-intro">Select a subject to view the chapter checklist, revise flashcard key points, and generate custom revision papers.</p>' +
        '<div class="subjects-grid">' +
          SUBJECTS.map(function (key) {
            var b = bank(grade, key);
            var t = bankTotals(grade, key) || {};
            var qCount = (t.mcq || 0) + (t.sh || 0) + (t.lg || 0) + (t.cs || 0);
            return '<a class="subject-card" href="#class-' + grade + '/' + key + '">' +
              '<span class="subject-icon">' + SUBJECT_ICONS[key] + '</span>' +
              '<h4>' + esc(SUBJECT_NAMES[key]) + '</h4>' +
              '<p>' + esc(subjectBlurb(key)) + '</p>' +
              '<span class="subject-meta">' + (b ? b.chapters.length : 0) + ' chapters · ' + qCount + ' questions</span>' +
            '</a>';
          }).join('') +
        '</div>' +
      '</section>';
  }

  /* ---------------- subject view (checklist & quick revision) ---------------- */

  function renderSubject(grade, key) {
    setNavActive('classes');
    var b = bank(grade, key);
    if (!b) { location.hash = '#classes'; return; }
    document.title = SUBJECT_NAMES[key] + ' · Class ' + grade + ' · Commerce-Students';

    saveJSON(STORAGE.lastStudy, { grade: grade, subject: key, chapterTitle: b.chapters[0] ? b.chapters[0].t : '' });

    var totals = bankTotals(grade, key) || { mcq: 0, sh: 0, lg: 0, cs: 0 };
    var chKey = STORAGE.check + ':' + grade + ':' + key;
    var checked = loadJSON(chKey, []) || [];
    while (checked.length < b.chapters.length) checked.push(false);
    var done = checked.filter(Boolean).length;
    var pct = Math.round((done / b.chapters.length) * 100);

    var cards = [];
    b.chapters.forEach(function (ch, ci) {
      (ch.k || []).forEach(function (point) {
        cards.push({ chapterIndex: ci, chapter: 'Ch ' + (ci + 1) + ' · ' + ch.t, text: point });
      });
    });

    var qrState = { i: 0, filterChapter: 'all', cards: cards };

    function activeCards() {
      if (qrState.filterChapter === 'all') return qrState.cards;
      var ci = Number(qrState.filterChapter);
      return qrState.cards.filter(function (c) { return c.chapterIndex === ci; });
    }

    var chaptersHTML = b.chapters.map(function (ch, ci) {
      var isDone = !!checked[ci];
      return '<div class="chapter' + (isDone ? ' checked' : '') + '" data-ci="' + ci + '">' +
        '<div class="chapter-row">' +
          '<button class="chapter-check" type="button" aria-label="Mark chapter ' + (ci + 1) + ' completed">' + (isDone ? '✓' : '') + '</button>' +
          '<span class="chapter-num">' + String(ci + 1).padStart(2, '0') + '</span>' +
          '<span class="chapter-title">' + esc(ch.t) + '</span>' +
          '<span class="chapter-toggle" aria-hidden="true">▼</span>' +
        '</div>' +
        '<div class="chapter-body">' +
          '<strong>Core syllabus concepts:</strong>' +
          '<ul>' + (ch.k || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
          '<div class="chapter-actions">' +
            '<a class="btn btn-soft btn-sm" href="#revision/preset/' + grade + '/' + key + '">Practice this chapter →</a>' +
            '<button class="btn btn-soft btn-sm ai-ask-btn" type="button" data-grade="' + grade + '" data-subject="' + key + '" data-chapter="' + ci + '">Ask AI about Chapter</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Class ' + grade, href: '#class-' + grade }, { label: SUBJECT_NAMES[key] }]) +
        '<div class="subject-hero">' +
          '<div>' +
            '<span class="eyebrow">Class ' + grade + ' · ' + (key === 'information' ? 'Subject 802' : 'Core subject') + '</span>' +
            '<h1>' + esc(SUBJECT_NAMES[key]) + '</h1>' +
            '<p>' + esc(subjectBlurb(key)) + '</p>' +
          '</div>' +
          '<div class="subject-hero-meta">' +
            '<strong>' + b.chapters.length + '</strong><span>chapters</span>' +
            '<div style="margin-top:8px"><strong style="font-size:22px">' + (totals.mcq + totals.sh + totals.lg + totals.cs) + '</strong><span>questions in bank</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="detail-grid">' +
          '<section class="panel">' +
            '<div class="panel-title"><h2>Chapter checklist</h2><span>Tick chapters as you revise</span></div>' +
            '<div class="chapter-list" id="chapter-list">' + chaptersHTML + '</div>' +
            '<div class="progress-wrap">' +
              '<div class="progress-line"><i id="check-progress" style="width:' + pct + '%"></i></div>' +
              '<div class="progress-meta"><span id="check-label">' + done + ' of ' + b.chapters.length + ' chapters revised</span><span id="check-pct">' + pct + '%</span></div>' +
            '</div>' +
            '<button class="btn btn-soft btn-sm checklist-reset" id="check-reset" type="button" style="margin-top:14px;">Reset checklist</button>' +
          '</section>' +
          '<aside>' +
            '<div class="panel">' +
              '<div class="panel-title">' +
                '<h2>Quick revision</h2>' +
                '<select id="qr-filter" style="padding:4px 8px; font-size:12px; border:1px solid var(--line); border-radius:6px; background:var(--card);">' +
                  '<option value="all">All Chapters</option>' +
                  b.chapters.map(function (c, i) { return '<option value="' + i + '">Ch ' + (i + 1) + '</option>'; }).join('') +
                '</select>' +
              '</div>' +
              '<div class="qr-card">' +
                '<span class="qr-tag" id="qr-chapter"></span>' +
                '<p class="qr-text" id="qr-text"></p>' +
                '<div class="qr-nav">' +
                  '<button class="btn btn-soft btn-sm" id="qr-prev" type="button" aria-label="Previous card">←</button>' +
                  '<span class="qr-count" id="qr-count"></span>' +
                  '<button class="btn btn-soft btn-sm" id="qr-next" type="button" aria-label="Next card">→</button>' +
                  '<button class="btn btn-soft btn-sm" id="qr-shuffle" type="button">Shuffle</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="side-actions">' +
              '<a class="btn btn-solid" href="#revision/preset/' + grade + '/' + key + '">Practice this subject →</a>' +
              '<a class="btn btn-soft" href="#quiz">Timed Quiz (Class ' + grade + ') →</a>' +
              '<a class="btn btn-soft" href="#class-' + grade + '">← All Class ' + grade + ' subjects</a>' +
              (key === 'information' && grade === 11 ? '<a class="btn btn-soft" href="class11-it-notes.html">Open detailed IT notes ↗</a>' : '') +
              '<a class="btn btn-soft" href="' + CURRICULUM_LINKS[key] + '" target="_blank" rel="noreferrer">CBSE curriculum PDF ↗</a>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</section>';

    function paintQr() {
      var pool = activeCards();
      if (!pool.length) {
        document.getElementById('qr-chapter').textContent = 'No cards';
        document.getElementById('qr-text').textContent = 'No key points available for this chapter.';
        document.getElementById('qr-count').textContent = '0 / 0';
        return;
      }
      qrState.i = Math.max(0, Math.min(qrState.i, pool.length - 1));
      var c = pool[qrState.i];
      document.getElementById('qr-count').textContent = (qrState.i + 1) + ' / ' + pool.length;
      document.getElementById('qr-chapter').textContent = c.chapter;
      document.getElementById('qr-text').textContent = c.text;
    }

    paintQr();

    document.getElementById('qr-filter').addEventListener('change', function (e) {
      qrState.filterChapter = e.target.value;
      qrState.i = 0;
      paintQr();
    });

    document.getElementById('qr-next').addEventListener('click', function () {
      var pool = activeCards();
      if (pool.length) { qrState.i = (qrState.i + 1) % pool.length; paintQr(); }
    });
    document.getElementById('qr-prev').addEventListener('click', function () {
      var pool = activeCards();
      if (pool.length) { qrState.i = (qrState.i - 1 + pool.length) % pool.length; paintQr(); }
    });
    document.getElementById('qr-shuffle').addEventListener('click', function () {
      var pool = activeCards();
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
      }
      qrState.i = 0;
      paintQr();
    });

    var list = document.getElementById('chapter-list');
    list.addEventListener('click', function (e) {
      var row = e.target.closest('.chapter-row');
      var chkBtn = e.target.closest('.chapter-check');
      var aiBtn = e.target.closest('.ai-ask-btn');

      if (aiBtn) {
        var g = Number(aiBtn.getAttribute('data-grade'));
        var s = aiBtn.getAttribute('data-subject');
        var c = Number(aiBtn.getAttribute('data-chapter'));
        openAIPromptModal('chapter', { grade: g, subject: s, chapterIndex: c });
        return;
      }

      if (chkBtn) {
        var pEl = chkBtn.closest('.chapter');
        var ci = Number(pEl.getAttribute('data-ci'));
        checked[ci] = !checked[ci];
        saveJSON(chKey, checked);
        var n = checked.filter(Boolean).length;
        var p = Math.round((n / b.chapters.length) * 100);
        pEl.classList.toggle('checked', checked[ci]);
        chkBtn.textContent = checked[ci] ? '✓' : '';
        document.getElementById('check-progress').style.width = p + '%';
        document.getElementById('check-label').textContent = n + ' of ' + b.chapters.length + ' chapters revised';
        document.getElementById('check-pct').textContent = p + '%';
        return;
      }

      if (row) {
        var chEl = row.closest('.chapter');
        chEl.classList.toggle('open');
      }
    });

    document.getElementById('check-reset').addEventListener('click', function () {
      checked = b.chapters.map(function () { return false; });
      saveJSON(chKey, checked);
      app.querySelectorAll('#chapter-list .chapter').forEach(function (el) {
        el.classList.remove('checked');
        el.querySelector('.chapter-check').textContent = '';
      });
      document.getElementById('check-progress').style.width = '0%';
      document.getElementById('check-label').textContent = '0 of ' + b.chapters.length + ' chapters revised';
      document.getElementById('check-pct').textContent = '0%';
    });
  }

  /* ---------------- revision paper builder ---------------- */

  var revState = { grade: 11, type: 'mcq', subject: 'accountancy', chapters: {} };

  function defaultChapters(grade, subject) {
    var b = bank(grade, subject);
    var sel = {};
    if (b) b.chapters.forEach(function (_, ci) { sel[ci] = true; });
    return sel;
  }

  function loadRevState() {
    var saved = loadJSON(STORAGE.rev, null);
    if (saved && [11, 12].indexOf(saved.grade) !== -1 && SUBJECTS.indexOf(saved.subject) !== -1 && TYPE_ORDER.indexOf(saved.type) !== -1) {
      revState.grade = saved.grade;
      revState.type = saved.type;
      revState.subject = saved.subject;
      revState.chapters = saved.chapters || {};
      if (!Object.keys(revState.chapters).some(function (k) { return revState.chapters[k]; })) {
        revState.chapters = defaultChapters(revState.grade, revState.subject);
      }
    } else {
      revState.chapters = defaultChapters(revState.grade, revState.subject);
    }
  }

  function saveRevState() { saveJSON(STORAGE.rev, revState); }

  var lastPaper = null;

  function renderRevision(preset) {
    setNavActive('revision');
    document.title = 'Practice & Paper Builder · Commerce-Students';

    if (preset) {
      var parts = preset.split(':');
      var g = Number(parts[0]);
      if ([11, 12].indexOf(g) !== -1 && SUBJECTS.indexOf(parts[1]) !== -1) {
        revState.grade = g;
        revState.subject = parts[1];
        revState.chapters = defaultChapters(g, parts[1]);
        saveRevState();
      }
    } else {
      loadRevState();
    }

    var b = bank(revState.grade, revState.subject);
    if (!b) return;

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Practice' }]) +
        '<div class="eyebrow">Five steps</div>' +
        '<h1 class="page-title">Practice & Revision Paper Builder</h1>' +
        '<p class="page-intro">Build custom practice papers, 20-question quizzes, or full CBSE mock examinations. Your preferences are saved automatically.</p>' +
        '<div class="steps-rail">' +
          ['Class', 'Paper type', 'Subject', 'Chapters', 'Generate'].map(function (label, i) {
            return '<span class="step-pill" id="step-pill-' + i + '"><i>' + (i + 1) + '</i>' + label + '</span>';
          }).join('') +
        '</div>' +
        '<div class="rev-grid">' +
          revStepHTML(0, 'Class', 'Which year are you revising?',
            '<div class="choice-grid cols-2">' +
              [11, 12].map(function (g2) {
                return '<button type="button" class="choice' + (revState.grade === g2 ? ' selected' : '') + '" data-role="grade" data-value="' + g2 + '">' +
                  '<span class="choice-check" aria-hidden="true">✓</span><span class="choice-tag">Year ' + (g2 - 10) + '</span><strong>Class ' + g2 + '</strong>' +
                '</button>';
              }).join('') +
            '</div>') +
          revStepHTML(1, 'Paper type', 'What kind of practice test do you need?',
            '<div class="choice-grid cols-5">' +
              TYPE_ORDER.map(function (t) {
                return '<button type="button" class="choice' + (revState.type === t ? ' selected' : '') + '" data-role="type" data-value="' + t + '">' +
                  '<span class="choice-check" aria-hidden="true">✓</span><strong>' + TYPE_META[t].label + '</strong><small>' + esc(TYPE_META[t].desc) + '</small>' +
                '</button>';
              }).join('') +
            '</div>') +
          revStepHTML(2, 'Subject', 'Pick one of the five commerce subjects.',
            '<div class="choice-grid cols-2">' +
              SUBJECTS.map(function (key) {
                return '<button type="button" class="choice' + (revState.subject === key ? ' selected' : '') + '" data-role="subject" data-value="' + key + '">' +
                  '<span class="choice-check" aria-hidden="true">✓</span><span class="choice-tag">' + SUBJECT_ICONS[key] + '</span><strong>' + esc(SUBJECT_NAMES[key]) + '</strong>' +
                '</button>';
              }).join('') +
            '</div>') +
          revStepHTML(3, 'Chapters', 'Select all, one, or multiple chapters for ' + esc(SUBJECT_NAMES[revState.subject]) + '.',
            '<div class="chip-tools"><button type="button" id="ch-all">Select all</button><button type="button" id="ch-none">Clear all</button></div>' +
            '<div class="chips-grid" id="chip-grid">' +
              b.chapters.map(function (ch, ci) {
                return '<button type="button" class="chip' + (revState.chapters[ci] ? ' selected' : '') + '" data-role="chapter" data-value="' + ci + '">' +
                  '<span class="chip-box" aria-hidden="true">' + (revState.chapters[ci] ? '✓' : '') + '</span>' +
                  '<span class="chip-num">' + String(ci + 1).padStart(2, '0') + '</span>' +
                  '<span class="chip-label">' + esc(ch.t) + '</span>' +
                '</button>';
              }).join('') +
            '</div>') +
          revStepHTML(4, 'Generate', 'Check the plan, then generate the paper.',
            '<div class="summary-box" id="rev-summary"></div>' +
            '<div class="rev-actions">' +
              '<button class="btn btn-solid" id="rev-generate" type="button">Generate paper →</button>' +
              '<span class="rev-note" id="rev-note"></span>' +
            '</div>') +
        '</div>' +
      '</section>';

    function revStepHTML(i, title, hint, body) {
      return '<section class="rev-step" id="rev-step-' + i + '"><h3>' + (i + 1) + '. ' + title + '</h3><p class="step-hint">' + hint + '</p>' + body + '</section>';
    }

    function selCount() {
      return Object.keys(revState.chapters).filter(function (k) { return revState.chapters[k]; }).length;
    }

    function summaryRows() {
      var pools = selectedPools(revState.grade, revState.subject, revState.chapters);
      var availMCQ = pools.reduce(function (s, p) { return s + p.mcq.length; }, 0);
      return '<div class="summary-row"><span>Class</span><span>Class ' + revState.grade + '</span></div>' +
        '<div class="summary-row"><span>Paper</span><span>' + TYPE_META[revState.type].label + ' · ' + TYPE_META[revState.type].duration + '</span></div>' +
        '<div class="summary-row"><span>Subject</span><span>' + esc(SUBJECT_NAMES[revState.subject]) + '</span></div>' +
        '<div class="summary-row"><span>Chapters</span><span>' + selCount() + ' of ' + b.chapters.length + ' selected</span></div>' +
        '<div class="summary-row"><span>Questions in Selection</span><span>' + availMCQ + ' MCQs available</span></div>';
    }

    function paintSteps() {
      var count = selCount();
      document.getElementById('rev-summary').innerHTML = summaryRows();
      var genBtn = document.getElementById('rev-generate');
      var note = document.getElementById('rev-note');
      if (count === 0) {
        genBtn.disabled = true;
        genBtn.style.opacity = '0.5';
        note.textContent = 'Please select at least one chapter to build a paper.';
      } else {
        genBtn.disabled = false;
        genBtn.style.opacity = '1';
        note.textContent = 'Ready to generate.';
      }
    }

    function paintChipStates() {
      document.querySelectorAll('#chip-grid .chip').forEach(function (btn) {
        var ci = Number(btn.getAttribute('data-value'));
        var on = !!revState.chapters[ci];
        btn.classList.toggle('selected', on);
        btn.querySelector('.chip-box').textContent = on ? '✓' : '';
      });
    }

    var grid = app.querySelector('.rev-grid');
    grid.addEventListener('click', function (e) {
      var trigger = e.target.closest('button');
      if (!trigger) return;
      if (trigger.id === 'ch-all' || trigger.id === 'ch-none') {
        var all = trigger.id === 'ch-all';
        b.chapters.forEach(function (_, ci) { revState.chapters[ci] = all; });
        saveRevState();
        paintChipStates();
        paintSteps();
        return;
      }
      var role = trigger.getAttribute('data-role');
      if (!role) return;
      if (role === 'grade') {
        revState.grade = Number(trigger.getAttribute('data-value'));
        revState.chapters = defaultChapters(revState.grade, revState.subject);
        saveRevState();
        renderRevision();
        return;
      }
      if (role === 'subject') {
        revState.subject = trigger.getAttribute('data-value');
        revState.chapters = defaultChapters(revState.grade, revState.subject);
        saveRevState();
        renderRevision();
        return;
      }
      if (role === 'type') {
        revState.type = trigger.getAttribute('data-value');
        saveRevState();
        app.querySelectorAll('[data-role="type"]').forEach(function (el) {
          el.classList.toggle('selected', el.getAttribute('data-value') === revState.type);
        });
        paintSteps();
        return;
      }
      if (role === 'chapter') {
        var ci = Number(trigger.getAttribute('data-value'));
        revState.chapters[ci] = !revState.chapters[ci];
        saveRevState();
        paintChipStates();
        paintSteps();
      }
    });

    document.getElementById('rev-generate').addEventListener('click', function () {
      if (!selCount()) return;
      var spec = { grade: revState.grade, subject: revState.subject, type: revState.type, chapters: revState.chapters };
      lastPaper = buildPaper(spec, false);
      saveRevState();
      saveJSON(STORAGE.paper, spec);
      location.hash = '#paper';
    });

    paintSteps();
  }

  /* ---------------- paper view & scoring ---------------- */

  var paperCtx = { spec: null, paper: null };

  function renderPaper() {
    setNavActive('revision');
    var spec = lastPaper && lastPaper.spec ? lastPaper.spec : loadJSON(STORAGE.paper, null);
    if (!spec) { location.hash = '#revision'; return; }
    paperCtx = { spec: spec, paper: buildPaper(spec, false) };
    var paper = paperCtx.paper;
    if (!paper) { location.hash = '#revision'; return; }
    document.title = paper.typeLabel + ' · Class ' + spec.grade + ' · Commerce-Students';

    var bookmarked = loadJSON(STORAGE.bookmark, {}) || {};
    var bmCount = Object.keys(bookmarked).filter(function (id) { return bookmarked[id]; }).length;
    var hasMcq = paper.sections.some(function (s) { return s.items.some(function (it) { return it.kind === 'mcq'; }); });
    var b = bank(spec.grade, spec.subject);

    function questionHTML(it, si) {
      var chTitle = b.chapters[it.chapter] ? b.chapters[it.chapter].t : '';
      var isBM = !!bookmarked[it.id];
      var body = '<div class="q-top">' +
        '<span class="q-num">' + it.num + '</span>' +
        '<span class="q-text">' + esc(it.q) + (it.isRepeated ? ' <span style="font-size:11px; color:var(--muted); font-weight:normal;">(repeated item)</span>' : '') + '</span>' +
        '<button class="bm-btn' + (isBM ? ' on' : '') + '" type="button" data-qid="' + esc(it.id) + '" aria-label="Bookmark question" title="Bookmark">' + (isBM ? '★' : '☆') + '</button>' +
        '<span class="q-marks">' + it.marks + ' mark' + (it.marks > 1 ? 's' : '') + '</span>' +
      '</div>';

      if (it.kind === 'mcq') {
        body += '<div class="q-opts" role="radiogroup" aria-label="Options for question ' + it.num + '">' +
          it.opts.map(function (opt, oi) {
            return '<label class="q-opt" data-oi="' + oi + '"><input type="radio" name="q-' + si + '-' + it.num + '" value="' + oi + '"><span class="opt-letter">' + 'ABCD'[oi] + '.</span><span>' + esc(opt) + '</span></label>';
          }).join('') +
        '</div>' +
        '<div class="q-feedback" id="fb-' + si + '-' + it.num + '"></div>';
      } else {
        body += '<details class="model-answer"><summary>Model answer · ' + it.model.length + ' points</summary><div class="answer-list"><ul>' +
          it.model.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') +
        '</ul></div></details>';
      }

      body += '<div class="q-actions-row">' +
        '<span class="q-chapter-tag">Chapter ' + (it.chapter + 1) + ' · ' + esc(chTitle) + '</span>' +
        '<button type="button" class="q-explain-btn" data-qid="' + esc(it.id) + '">Explain with AI</button>' +
      '</div>';

      return '<div class="question" data-qid="' + esc(it.id) + '">' + body + '</div>';
    }

    app.innerHTML =
      '<section class="shell page-view">' +
        '<div class="paper-wrap">' +
          crumbs([{ label: 'Home', href: '#home' }, { label: 'Practice', href: '#revision' }, { label: paper.typeLabel }]) +
          '<div class="paper-toolbar">' +
            '<a class="btn btn-soft btn-sm" href="#revision">← Change plan</a>' +
            (hasMcq ? '<button class="btn btn-solid btn-sm" id="paper-check" type="button">Check answers</button>' : '') +
            '<button class="btn btn-soft btn-sm" id="paper-restart" type="button">Reset attempts</button>' +
            '<button class="btn btn-soft btn-sm" id="paper-print" type="button">Print paper</button>' +
          '</div>' +
          '<div class="score-banner" id="score-banner"></div>' +
          '<div class="paper-sheet">' +
            '<div class="paper-head">' +
              '<span class="paper-brand">Commerce-Students · Original Practice Paper</span>' +
              '<h1>' + esc(paper.title) + ' — ' + esc(paper.typeLabel) + '</h1>' +
              '<div class="paper-sub">' + esc(paper.extraNote) + '</div>' +
              '<div class="paper-meta-row">' +
                '<span class="paper-meta">' + paper.total + ' marks</span>' +
                '<span class="paper-meta">' + paper.duration + '</span>' +
                '<span class="paper-meta">' + paper.questionCount + ' questions</span>' +
                '<span class="paper-meta" id="bm-meta">' + bmCount + ' bookmarked</span>' +
              '</div>' +
            '</div>' +
            paper.sections.map(function (sec, si) {
              return '<div class="paper-section">' +
                '<div class="section-head-row"><h2>' + esc(sec.heading) + '</h2><span class="section-marks">' + sec.items.length + ' questions · ' + sec.marksEach + ' mark' + (sec.marksEach > 1 ? 's' : '') + ' each</span></div>' +
                sec.items.map(function (it) { return questionHTML(it, si); }).join('') +
              '</div>';
            }).join('') +
            '<div class="paper-foot">' +
              '<span>Questions are original, written strictly from the official CBSE 2026–27 curriculum.</span>' +
              '<span>Bookmark stars and mistakes are saved locally on this device.</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  /* Delegated clicks on #app for Paper, Bookmarks, and AI prompts */
  function qElFor(id) { return app.querySelector('.question[data-qid="' + id + '"]'); }

  app.addEventListener('click', function (e) {
    var t = e.target;

    // Explain question with AI modal trigger
    var expBtn = t.closest('.q-explain-btn');
    if (expBtn) {
      var qid = expBtn.getAttribute('data-qid');
      openAIPromptModal('question', { qid: qid });
      return;
    }

    // Bookmark toggle
    var bm = t.closest('.bm-btn');
    if (bm) {
      var id = bm.getAttribute('data-qid');
      var marks = loadJSON(STORAGE.bookmark, {}) || {};
      marks[id] = !marks[id];
      saveJSON(STORAGE.bookmark, marks);
      bm.classList.toggle('on', marks[id]);
      bm.textContent = marks[id] ? '★' : '☆';
      var bmMeta = document.getElementById('bm-meta');
      if (bmMeta) {
        var count = Object.keys(marks).filter(function (k) { return marks[k]; }).length;
        bmMeta.textContent = count + ' bookmarked';
      }
      return;
    }

    // Print paper
    if (t.closest('#paper-print')) { W.print(); return; }

    // Reset attempts
    if (t.closest('#paper-restart')) {
      var paper = paperCtx.paper;
      if (!paper) return;
      paper.sections.forEach(function (sec, si) {
        sec.items.forEach(function (it) {
          var qEl = qElFor(it.id);
          if (!qEl) return;
          qEl.classList.remove('correct', 'wrong');
          var fb = document.getElementById('fb-' + si + '-' + it.num);
          if (fb) { fb.classList.remove('show'); fb.innerHTML = ''; }
          qEl.querySelectorAll('input[type="radio"]').forEach(function (r) { r.checked = false; });
          qEl.querySelectorAll('.q-opt').forEach(function (o) { o.classList.remove('picked', 'opt-correct', 'opt-wrong'); });
        });
      });
      var banner = document.getElementById('score-banner');
      if (banner) banner.classList.remove('show');
      return;
    }

    // Check answers
    if (t.closest('#paper-check')) { checkAnswers(); }
  });

  app.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.type !== 'radio') return;
    var wrap = input.closest('.q-opts');
    if (!wrap) return;
    wrap.querySelectorAll('.q-opt').forEach(function (o) {
      o.classList.toggle('picked', o.querySelector('input').checked);
    });
  });

  function checkAnswers() {
    var paper = paperCtx.paper;
    if (!paper) return;
    var score = 0, answered = 0, totalMcq = 0;
    var mistakes = loadJSON(STORAGE.mistakes, {}) || {};
    var chapterPerformance = {};

    paper.sections.forEach(function (sec, si) {
      sec.items.forEach(function (it) {
        if (it.kind !== 'mcq') return;
        totalMcq++;
        var chKey = 'Chapter ' + (it.chapter + 1);
        chapterPerformance[chKey] = chapterPerformance[chKey] || { total: 0, correct: 0 };
        chapterPerformance[chKey].total++;

        var qEl = qElFor(it.id);
        if (!qEl) return;
        var picked = qEl.querySelector('input[type="radio"]:checked');
        var fb = document.getElementById('fb-' + si + '-' + it.num);
        qEl.classList.remove('correct', 'wrong');
        qEl.querySelectorAll('.q-opt').forEach(function (o) { o.classList.remove('opt-correct', 'opt-wrong'); });

        if (!picked) {
          if (fb) { fb.classList.remove('show'); fb.innerHTML = ''; }
          return;
        }

        answered++;
        var choice = Number(picked.value);
        if (choice === it.correct) {
          score++;
          chapterPerformance[chKey].correct++;
          qEl.classList.add('correct');
          var okOpt = qEl.querySelector('.q-opt[data-oi="' + choice + '"]');
          if (okOpt) okOpt.classList.add('opt-correct');
          if (fb) { fb.innerHTML = '<b>✓ Correct</b>' + esc(it.exp || 'Well done.'); fb.classList.add('show'); }
          // Remove from mistakes if previously marked
          if (mistakes[it.id]) delete mistakes[it.id];
        } else {
          qEl.classList.add('wrong');
          var badOpt = qEl.querySelector('.q-opt[data-oi="' + choice + '"]');
          var goodOpt = qEl.querySelector('.q-opt[data-oi="' + it.correct + '"]');
          if (badOpt) badOpt.classList.add('opt-wrong');
          if (goodOpt) goodOpt.classList.add('opt-correct');
          if (fb) { fb.innerHTML = '<b>✕ Incorrect — correct option: ' + 'ABCD'[it.correct] + '</b>' + esc(it.exp || ''); fb.classList.add('show'); }
          // Save mistake
          mistakes[it.id] = { grade: paper.spec.grade, subject: paper.spec.subject, chapter: it.chapter, q: it.q, correct: it.correct, exp: it.exp };
        }
      });
    });

    saveJSON(STORAGE.mistakes, mistakes);

    var banner = document.getElementById('score-banner');
    if (!banner) return;
    var pct = totalMcq ? Math.round((score / totalMcq) * 100) : 0;

    var weakChapters = Object.keys(chapterPerformance).filter(function (k) {
      return chapterPerformance[k].correct < chapterPerformance[k].total;
    });

    banner.innerHTML =
      '<div style="flex:1;">' +
        '<strong>' + score + ' / ' + totalMcq + ' correct (' + pct + '%)</strong>' +
        '<div class="score-detail">' + (totalMcq - answered) + ' unanswered · ' + (totalMcq - score) + ' mistakes automatically saved to your <a href="#study" style="text-decoration:underline;">Mistake Bank</a>.</div>' +
        (weakChapters.length ? '<div style="margin-top:8px; font-size:12.5px; color:var(--muted);"><b>Topics to review:</b> ' + esc(weakChapters.join(', ')) + '</div>' : '') +
      '</div>' +
      '<div>' +
        '<a class="btn btn-solid btn-sm" href="#study">Review in My Study →</a>' +
      '</div>';

    banner.classList.add('show');
    if (banner.scrollIntoView) banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------------- Timed Quiz Engine (All Subjects & Classes) ---------------- */

  var quizTimer = null;
  var quizState = null;

  function stopQuizTimer() {
    if (quizTimer) { clearInterval(quizTimer); quizTimer = null; }
  }

  function renderQuizSetup() {
    setNavActive('quiz');
    document.title = 'Timed Practice Quiz · Commerce-Students';
    stopQuizTimer();

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Timed Quiz' }]) +
        '<div class="eyebrow">Timed Practice</div>' +
        '<h1 class="page-title">Commerce Timed Quiz</h1>' +
        '<p class="page-intro">Sharpen your speed and accuracy. Select class, subject, and time limit to attempt real CBSE-style MCQs under exam pressure.</p>' +
        '<div class="rev-step" style="max-width:600px;">' +
          '<div style="display:grid; gap:16px;">' +
            '<div>' +
              '<label style="display:block; font-weight:700; font-size:13.5px; margin-bottom:6px;">Select Class:</label>' +
              '<select id="quiz-grade" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:8px; background:var(--card);">' +
                '<option value="12">Class 12</option>' +
                '<option value="11">Class 11</option>' +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-weight:700; font-size:13.5px; margin-bottom:6px;">Select Subject:</label>' +
              '<select id="quiz-subject" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:8px; background:var(--card);">' +
                SUBJECTS.map(function (s) { return '<option value="' + s + '">' + esc(SUBJECT_NAMES[s]) + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
            '<div>' +
              '<label style="display:block; font-weight:700; font-size:13.5px; margin-bottom:6px;">Number of Questions:</label>' +
              '<select id="quiz-count" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:8px; background:var(--card);">' +
                '<option value="10">10 Questions (5 Minutes)</option>' +
                '<option value="15">15 Questions (8 Minutes)</option>' +
                '<option value="20">20 Questions (10 Minutes)</option>' +
              '</select>' +
            '</div>' +
            '<button class="btn btn-solid" id="start-quiz-btn" type="button" style="margin-top:8px;">Start Timed Quiz →</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    document.getElementById('start-quiz-btn').addEventListener('click', function () {
      var g = Number(document.getElementById('quiz-grade').value);
      var s = document.getElementById('quiz-subject').value;
      var count = Number(document.getElementById('quiz-count').value);
      var b = bank(g, s);
      if (!b) return;

      var questions = [];
      b.chapters.forEach(function (ch, ci) {
        (ch.mcq || []).forEach(function (q, qi) {
          questions.push({ q: q[0], opts: q[1], correct: q[2], exp: q[3], id: g + '-' + s + '-c' + ci + '-m' + qi, chTitle: ch.t });
        });
      });

      // Shuffle
      for (var i = questions.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = questions[i]; questions[i] = questions[j]; questions[j] = temp;
      }

      var chosen = questions.slice(0, count);
      var seconds = count === 10 ? 300 : (count === 15 ? 480 : 600);

      quizState = {
        grade: g,
        subject: s,
        questions: chosen,
        at: 0,
        answers: {},
        seconds: seconds,
        totalSeconds: seconds,
        paused: false,
        finished: false
      };

      runQuiz();
    });
  }

  function formatTime(s) {
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function runQuiz() {
    stopQuizTimer();
    if (!quizState || !quizState.questions.length) { renderQuizSetup(); return; }
    var q = quizState.questions[quizState.at];
    var selected = quizState.answers[quizState.at];

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Timed Quiz', href: '#quiz' }, { label: 'In Progress' }]) +
        '<div class="paper-sheet" style="max-width:760px; margin:0 auto;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:14px; margin-bottom:18px;">' +
            '<div>' +
              '<strong>Class ' + quizState.grade + ' ' + esc(SUBJECT_NAMES[quizState.subject]) + '</strong>' +
              '<div style="font-size:12px; color:var(--muted);">Question ' + (quizState.at + 1) + ' of ' + quizState.questions.length + '</div>' +
            '</div>' +
            '<div style="font-size:24px; font-weight:800; color:' + (quizState.seconds < 60 ? 'var(--danger)' : 'var(--fg)') + ';" id="quiz-timer" aria-live="polite">' + formatTime(quizState.seconds) + '</div>' +
          '</div>' +
          '<div class="question" style="background:none; border:none; padding:0;">' +
            '<div class="q-top">' +
              '<span class="q-num">' + (quizState.at + 1) + '.</span>' +
              '<span class="q-text" style="font-size:16px;">' + esc(q.q) + '</span>' +
            '</div>' +
            '<div class="q-opts" role="radiogroup" aria-label="Options">' +
              q.opts.map(function (opt, oi) {
                return '<label class="q-opt' + (selected === oi ? ' picked' : '') + '" data-oi="' + oi + '"><input type="radio" name="quiz-radio" value="' + oi + '" ' + (selected === oi ? 'checked' : '') + '><span class="opt-letter">' + 'ABCD'[oi] + '.</span><span>' + esc(opt) + '</span></label>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; padding-top:16px; border-top:1px solid var(--line);">' +
            '<button class="btn btn-soft btn-sm" id="quiz-pause-btn" type="button">' + (quizState.paused ? 'Resume' : 'Pause') + '</button>' +
            '<button class="btn btn-solid" id="quiz-next-btn" type="button">' + (quizState.at === quizState.questions.length - 1 ? 'Finish & Score →' : 'Next Question →') + '</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    if (!quizState.paused && !quizState.finished) {
      quizTimer = setInterval(function () {
        quizState.seconds--;
        var el = document.getElementById('quiz-timer');
        if (el) {
          el.textContent = formatTime(quizState.seconds);
          if (quizState.seconds < 60) el.style.color = 'var(--danger)';
        }
        if (quizState.seconds <= 0) {
          stopQuizTimer();
          finishQuiz();
        }
      }, 1000);
    }

    var nextBtn = document.getElementById('quiz-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        var picked = app.querySelector('input[name="quiz-radio"]:checked');
        if (picked) quizState.answers[quizState.at] = Number(picked.value);
        if (quizState.at === quizState.questions.length - 1) {
          finishQuiz();
        } else {
          quizState.at++;
          runQuiz();
        }
      });
    }

    var pauseBtn = document.getElementById('quiz-pause-btn');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        quizState.paused = !quizState.paused;
        runQuiz();
      });
    }
  }

  function finishQuiz() {
    stopQuizTimer();
    quizState.finished = true;
    var score = 0;
    var mistakes = loadJSON(STORAGE.mistakes, {}) || {};

    quizState.questions.forEach(function (q, i) {
      if (quizState.answers[i] === q.correct) {
        score++;
      } else {
        mistakes[q.id] = { grade: quizState.grade, subject: quizState.subject, chapter: 0, q: q.q, correct: q.correct, exp: q.exp };
      }
    });

    saveJSON(STORAGE.mistakes, mistakes);

    var scores = loadJSON(STORAGE.quizScores, []) || [];
    scores.unshift({
      date: new Date().toLocaleDateString(),
      subject: SUBJECT_NAMES[quizState.subject],
      grade: quizState.grade,
      score: score,
      total: quizState.questions.length
    });
    saveJSON(STORAGE.quizScores, scores.slice(0, 10));

    var pct = Math.round((score / quizState.questions.length) * 100);

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Timed Quiz', href: '#quiz' }, { label: 'Result' }]) +
        '<div class="paper-sheet" style="max-width:760px; margin:0 auto; text-align:center;">' +
          '<div class="eyebrow" style="margin-bottom:8px;">Quiz Complete</div>' +
          '<h1>Your Score: ' + score + ' / ' + quizState.questions.length + ' (' + pct + '%)</h1>' +
          '<p style="color:var(--muted); margin:12px 0 24px;">Time spent: ' + formatTime(quizState.totalSeconds - quizState.seconds) + ' · Class ' + quizState.grade + ' ' + esc(SUBJECT_NAMES[quizState.subject]) + '</p>' +
          '<div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">' +
            '<a class="btn btn-solid" href="#quiz">Take Another Quiz</a>' +
            '<a class="btn btn-soft" href="#study">Review My Mistakes</a>' +
            '<a class="btn btn-soft" href="#class-' + quizState.grade + '/' + quizState.subject + '">Back to Subject</a>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  /* ---------------- My Study & Bookmarks Dashboard ---------------- */

  function renderStudy() {
    setNavActive('study');
    document.title = 'My Study & Saved Bookmarks · Commerce-Students';

    var bookmarks = loadJSON(STORAGE.bookmark, {}) || {};
    var mistakes = loadJSON(STORAGE.mistakes, {}) || {};
    var scores = loadJSON(STORAGE.quizScores, []) || [];

    var bmIds = Object.keys(bookmarks).filter(function (k) { return bookmarks[k]; });
    var mistakeIds = Object.keys(mistakes);

    // Calculate overall chapter completion
    var totalChapters = 0, doneChapters = 0;
    [11, 12].forEach(function (g) {
      SUBJECTS.forEach(function (s) {
        var b = bank(g, s);
        if (b) {
          totalChapters += b.chapters.length;
          var chk = loadJSON(STORAGE.check + ':' + g + ':' + s, []) || [];
          doneChapters += chk.filter(Boolean).length;
        }
      });
    });
    var overallPct = totalChapters ? Math.round((doneChapters / totalChapters) * 100) : 0;

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'My Study' }]) +
        '<div class="eyebrow">Personal Dashboard</div>' +
        '<h1 class="page-title">My Study Workspace</h1>' +
        '<p class="page-intro">Track your chapter progress, review saved exam questions, and practice items saved in your automatic mistake notebook.</p>' +
        '<div class="study-stats-grid">' +
          '<div class="stat-card"><strong>' + doneChapters + ' / ' + totalChapters + '</strong><span>Chapters Completed (' + overallPct + '%)</span></div>' +
          '<div class="stat-card"><strong>' + bmIds.length + '</strong><span>Starred Bookmarks</span></div>' +
          '<div class="stat-card"><strong>' + mistakeIds.length + '</strong><span>Mistakes to Review</span></div>' +
        '</div>' +
        '<div class="detail-grid">' +
          '<section class="panel">' +
            '<div class="panel-title"><h2>Saved Exam Questions (' + bmIds.length + ')</h2><button class="btn btn-ghost btn-sm" id="clear-bm-btn" type="button">Clear All</button></div>' +
            '<div id="bm-list" style="display:grid; gap:10px;">' +
              (bmIds.length ? bmIds.map(function (id) {
                return '<div class="question" style="margin:0; padding:12px;">' +
                  '<div style="display:flex; justify-content:space-between; align-items:center;">' +
                    '<span style="font-weight:700; font-size:13.5px;">Question ID: ' + esc(id) + '</span>' +
                    '<button class="bm-btn on" data-qid="' + esc(id) + '" aria-label="Remove bookmark">★</button>' +
                  '</div>' +
                '</div>';
              }).join('') : '<p style="color:var(--muted); font-size:13.5px;">No bookmarked questions yet. Star questions in any practice paper to save them here.</p>') +
            '</div>' +
          '</section>' +
          '<aside>' +
            '<div class="panel">' +
              '<div class="panel-title"><h2>Mistake Bank (' + mistakeIds.length + ')</h2><button class="btn btn-ghost btn-sm" id="clear-mistakes-btn" type="button">Reset</button></div>' +
              (mistakeIds.length ?
                '<div style="display:grid; gap:8px;">' +
                  mistakeIds.slice(0, 10).map(function (mid) {
                    var m = mistakes[mid];
                    return '<div style="padding:10px; border:1px solid var(--line); border-radius:8px; font-size:12.5px; background:var(--card);">' +
                      '<strong>' + esc(m.q ? m.q.slice(0, 70) + '…' : mid) + '</strong>' +
                      '<div style="color:var(--muted); font-size:11px; margin-top:4px;">' + esc(SUBJECT_NAMES[m.subject] || '') + ' · Class ' + m.grade + '</div>' +
                    '</div>';
                  }).join('') +
                  (mistakeIds.length > 10 ? '<div style="font-size:11px; color:var(--muted);">+ ' + (mistakeIds.length - 10) + ' more mistakes saved.</div>' : '') +
                  '<a class="btn btn-solid btn-sm" href="#revision" style="margin-top:10px;">Practice Custom Paper →</a>' +
                '</div>' :
                '<p style="color:var(--muted); font-size:13.5px;">Your mistake bank is empty! Any MCQs you miss in practice papers or timed quizzes will be automatically collected here.</p>') +
            '</div>' +
            '<div class="panel" style="margin-top:20px;">' +
              '<div class="panel-title"><h2>Recent Timed Quizzes</h2></div>' +
              (scores.length ?
                scores.map(function (sc) {
                  return '<div style="display:flex; justify-content:space-between; font-size:12.5px; border-bottom:1px solid var(--line); padding:6px 0;">' +
                    '<span>' + esc(sc.subject) + ' (Class ' + sc.grade + ')</span>' +
                    '<b>' + sc.score + ' / ' + sc.total + '</b>' +
                  '</div>';
                }).join('') : '<p style="color:var(--muted); font-size:12.5px;">No timed quizzes taken yet.</p>') +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</section>';

    var clearBm = document.getElementById('clear-bm-btn');
    if (clearBm) {
      clearBm.addEventListener('click', function () {
        saveJSON(STORAGE.bookmark, {});
        renderStudy();
      });
    }

    var clearM = document.getElementById('clear-mistakes-btn');
    if (clearM) {
      clearM.addEventListener('click', function () {
        saveJSON(STORAGE.mistakes, {});
        renderStudy();
      });
    }
  }

  /* ---------------- AI Assistant Page & Prompt Builder ---------------- */

  function renderAI() {
    setNavActive('ai');
    document.title = 'AI Study Assistant · Commerce-Students';

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'AI Assistant' }]) +
        '<div class="eyebrow">Commerce AI Study Assistant</div>' +
        '<h1 class="page-title">Contextual AI Study Workflows</h1>' +
        '<p class="page-intro">Generate structured, syllabus-grounded academic prompts designed for learning. Copy prompt templates directly into Google Gemini, ChatGPT, or NotebookLM with zero logins or API keys.</p>' +
        '<div class="rev-step" style="margin-bottom:24px;">' +
          '<h3>Generate a Custom Commerce Study Prompt</h3>' +
          '<p class="step-hint">Select a learning task to craft an academic prompt with CBSE answering criteria.</p>' +
          '<div class="choice-grid cols-3" id="ai-task-grid">' +
            '<button type="button" class="choice" data-task="concept">' +
              '<strong>📖 Explain a Concept</strong>' +
              '<small>Step-by-step conceptual clarity with practical numerical examples.</small>' +
            '</button>' +
            '<button type="button" class="choice" data-task="journal">' +
              '<strong>₹ Journal & Balance Sheet Help</strong>' +
              '<small>Debit/Credit reasoning and modern accounting adjustments.</small>' +
            '</button>' +
            '<button type="button" class="choice" data-task="casestudy">' +
              '<strong>🏛️ Case Study Answering</strong>' +
              '<small>Guidance using CBSE 3-step fact identification & quote method.</small>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="panel" style="margin-bottom:28px;">' +
          '<div class="panel-title"><h2>Generated Academic Prompt</h2><button class="btn btn-soft btn-sm" id="copy-ai-prompt" type="button">Copy Prompt 📋</button></div>' +
          '<textarea class="ai-prompt-box" id="ai-prompt-output" readonly rows="6"></textarea>' +
          '<div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">' +
            '<a class="btn btn-solid btn-sm" href="https://gemini.google.com/" target="_blank" rel="noreferrer">Open in Google Gemini ↗</a>' +
            '<a class="btn btn-soft btn-sm" href="https://notebooklm.google.com/" target="_blank" rel="noreferrer">Open in NotebookLM ↗</a>' +
            '<a class="btn btn-soft btn-sm" href="https://chatgpt.com/" target="_blank" rel="noreferrer">Open in ChatGPT ↗</a>' +
          '</div>' +
        '</div>' +
        '<div class="section-head">' +
          '<div><span class="eyebrow">Companion Tools</span><h2>Recommended External AI Tools</h2></div>' +
        '</div>' +
        '<div class="ai-grid">' +
          '<a class="ai-card" href="https://gemini.google.com/" target="_blank" rel="noreferrer">' +
            '<span class="ai-logo" aria-hidden="true">' + ICONS.gemini + '</span>' +
            '<span class="ai-for">For concept doubts & problem solving</span>' +
            '<h3>Google Gemini</h3>' +
            '<p class="ai-desc">Ideal for asking specific doubt breakdowns and verifying balance sheet calculations. Free to use with your Google account.</p>' +
            '<span class="btn btn-soft btn-sm">Launch Gemini ↗</span>' +
          '</a>' +
          '<a class="ai-card" href="https://notebooklm.google.com/" target="_blank" rel="noreferrer">' +
            '<span class="ai-logo" aria-hidden="true">' + ICONS.notebooklm + '</span>' +
            '<span class="ai-for">For lecture notes & audio revision</span>' +
            '<h3>Google NotebookLM</h3>' +
            '<p class="ai-desc">Paste your chapter summaries or notes into NotebookLM to generate instant flashcards, study guides, and audio discussions.</p>' +
            '<span class="btn btn-soft btn-sm">Launch NotebookLM ↗</span>' +
          '</a>' +
        '</div>' +
      '</section>';

    var promptBox = document.getElementById('ai-prompt-output');

    function setPrompt(task) {
      var txt = '';
      if (task === 'journal') {
        txt = "I am a CBSE Class 12 Accountancy student. Please guide me step-by-step through this transaction:\n[Paste transaction here]\n\nDo not just give the final answer. Follow this pedagogy:\n1. Identify the accounts involved (Asset, Liability, Capital, Revenue, Expense)\n2. Apply the Modern Rules of Debit and Credit\n3. Provide the journal entry with full narration\n4. Show the ledger posting and balance sheet impact.";
      } else if (task === 'casestudy') {
        txt = "I am preparing for CBSE Class 12 Business Studies. Here is a case study:\n[Paste case text here]\n\nPlease help me answer according to the official CBSE 3-step evaluation criteria:\n1. Identify the concept/principle mentioned\n2. Quote the exact lines from the passage that support this identification\n3. Explain the concept and state 2 related merits or features.";
      } else {
        txt = "I am a CBSE Commerce student revising [Subject / Topic]. Please explain this concept:\n1. Provide the formal definition/formula\n2. Give a real-world business example from the Indian economy\n3. Detail common mistakes students make in CBSE board exams on this topic\n4. Give me one practice question to test my understanding.";
      }
      promptBox.value = txt;
    }

    setPrompt('concept');

    var grid = document.getElementById('ai-task-grid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        var t = btn.getAttribute('data-task');
        grid.querySelectorAll('.choice').forEach(function (c) { c.classList.remove('selected'); });
        btn.classList.add('selected');
        setPrompt(t);
      });
    }

    var copyBtn = document.getElementById('copy-ai-prompt');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        promptBox.select();
        try {
          navigator.clipboard.writeText(promptBox.value);
          copyBtn.textContent = 'Copied! ✓';
          setTimeout(function () { copyBtn.textContent = 'Copy Prompt 📋'; }, 2000);
        } catch (err) {
          copyBtn.textContent = 'Selected (Ctrl+C)';
        }
      });
    }
  }

  /* ---------------- Global AI Prompt Modal ("Explain with AI") ---------------- */

  var aiModal = document.getElementById('ai-modal');
  var aiModalBody = document.getElementById('ai-modal-body');
  var aiModalClose = document.getElementById('ai-modal-close');

  function openAIPromptModal(type, meta) {
    if (!aiModal || !aiModalBody) return;
    var promptText = '';

    if (type === 'question') {
      var item = null;
      if (paperCtx && paperCtx.paper) {
        paperCtx.paper.sections.forEach(function (sec) {
          sec.items.forEach(function (it) {
            if (it.id === meta.qid) item = it;
          });
        });
      }
      if (item) {
        promptText = "I am a CBSE Class " + (paperCtx.spec.grade || 12) + " Commerce student studying " + SUBJECT_NAMES[paperCtx.spec.subject] + ".\n\n" +
          "Here is an exam question I am practicing:\n\"" + item.q + "\"\n\n";
        if (item.kind === 'mcq') {
          promptText += "Options:\n" + item.opts.map(function (o, i) { return 'ABCD'[i] + '. ' + o; }).join('\n') + "\n\n";
          promptText += "The answer key states: Option " + 'ABCD'[item.correct] + " (" + item.opts[item.correct] + ").\n\n";
          promptText += "Please teach me:\n1. Why is Option " + 'ABCD'[item.correct] + " correct?\n2. Why are the other options incorrect?\n3. What is the underlying syllabus concept and what rule must I remember for my board exam?";
        } else {
          promptText += "Model Answer Points:\n" + item.model.join('\n') + "\n\n";
          promptText += "Please explain these model points simply and give me a memorable mnemonic or structure to score full marks on this question.";
        }
      } else {
        promptText = "I need help with this question ID: " + meta.qid;
      }
    } else if (type === 'chapter') {
      var b = bank(meta.grade, meta.subject);
      var ch = b && b.chapters[meta.chapterIndex];
      promptText = "I am studying CBSE Class " + meta.grade + " " + SUBJECT_NAMES[meta.subject] + ".\n" +
        "Chapter: " + (ch ? ch.t : 'Selected Chapter') + "\n\n" +
        "Please provide a 15-minute quick revision guide:\n" +
        "1. Top 5 most frequently tested concepts in CBSE exams\n" +
        "2. Essential formulas or definitions\n" +
        "3. Three high-yield practice questions with answer outlines.";
    }

    aiModalBody.innerHTML =
      '<textarea class="ai-prompt-box" id="ai-modal-textarea" rows="7" readonly>' + esc(promptText) + '</textarea>' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap; gap:10px;">' +
        '<button class="btn btn-solid btn-sm" id="ai-modal-copy-btn" type="button">Copy Prompt 📋</button>' +
        '<div style="display:flex; gap:8px;">' +
          '<a class="btn btn-soft btn-sm" href="https://gemini.google.com/" target="_blank" rel="noreferrer">Open Gemini ↗</a>' +
          '<a class="btn btn-soft btn-sm" href="https://chatgpt.com/" target="_blank" rel="noreferrer">Open ChatGPT ↗</a>' +
        '</div>' +
      '</div>';

    aiModal.classList.add('open');

    var copyBtn = document.getElementById('ai-modal-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var box = document.getElementById('ai-modal-textarea');
        box.select();
        try {
          navigator.clipboard.writeText(box.value);
          copyBtn.textContent = 'Copied! ✓';
          setTimeout(function () { copyBtn.textContent = 'Copy Prompt 📋'; }, 2000);
        } catch (e) {
          copyBtn.textContent = 'Selected (Ctrl+C)';
        }
      });
    }
  }

  if (aiModalClose) {
    aiModalClose.addEventListener('click', function () {
      aiModal.classList.remove('open');
    });
  }

  /* ---------------- Global Search Engine & Modal ---------------- */

  var searchModal = document.getElementById('search-modal');
  var searchInput = document.getElementById('global-search-input');
  var searchResults = document.getElementById('global-search-results');
  var searchClose = document.getElementById('search-close');
  var searchTrigger = document.getElementById('search-trigger');

  function allIndexItems() {
    var items = [];
    [11, 12].forEach(function (g) {
      SUBJECTS.forEach(function (s) {
        var b = bank(g, s);
        if (!b) return;
        b.chapters.forEach(function (ch, ci) {
          items.push({
            type: 'chapter',
            title: ch.t,
            grade: g,
            subject: s,
            ci: ci,
            href: '#class-' + g + '/' + s
          });
          (ch.mcq || []).forEach(function (q) {
            items.push({
              type: 'question',
              title: q[0],
              grade: g,
              subject: s,
              ci: ci,
              href: '#class-' + g + '/' + s
            });
          });
        });
      });
    });
    return items;
  }

  var searchIndex = null;

  function openSearch() {
    if (!searchModal) return;
    if (!searchIndex) searchIndex = allIndexItems();
    searchModal.classList.add('open');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
      paintSearchResults('');
    }
  }

  function closeSearch() {
    if (searchModal) searchModal.classList.remove('open');
  }

  function paintSearchResults(query) {
    if (!searchResults) return;
    var q = query.toLowerCase().trim();
    var filtered = (searchIndex || []).filter(function (it) {
      if (!q) return it.type === 'chapter';
      return it.title.toLowerCase().indexOf(q) !== -1 ||
        SUBJECT_NAMES[it.subject].toLowerCase().indexOf(q) !== -1 ||
        ('class ' + it.grade).indexOf(q) !== -1;
    }).slice(0, 40);

    if (!filtered.length) {
      searchResults.innerHTML = '<p style="color:var(--muted); font-size:13px; padding:12px;">No matching chapters or questions found.</p>';
      return;
    }

    searchResults.innerHTML = filtered.map(function (it) {
      return '<a class="search-item" href="' + it.href + '">' +
        '<div>' +
          '<strong style="font-size:13.5px;">' + esc(it.title.slice(0, 80)) + (it.title.length > 80 ? '…' : '') + '</strong>' +
          '<div><small>Class ' + it.grade + ' · ' + esc(SUBJECT_NAMES[it.subject]) + (it.type === 'chapter' ? ' (Chapter)' : ' (Question)') + '</small></div>' +
        '</div>' +
        '<span>→</span>' +
      '</a>';
    }).join('');
  }

  if (searchTrigger) searchTrigger.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);

  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      paintSearchResults(e.target.value);
    });
  }

  if (searchResults) {
    searchResults.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeSearch();
    });
  }

  // Keyboard shortcut Ctrl+K
  window.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      if (aiModal) aiModal.classList.remove('open');
    }
  });

  /* ---------------- router ---------------- */

  function getRoute() {
    var raw = (location.hash || '#home').slice(1).replace(/^\//, '');
    if (raw === '' || raw === 'home') return { type: 'home' };
    if (raw === 'classes') return { type: 'classes' };
    if (raw === 'revision') return { type: 'revision' };
    if (raw === 'quiz') return { type: 'quiz' };
    if (raw === 'study' || raw === 'bookmarks') return { type: 'study' };
    if (raw === 'ai') return { type: 'ai' };
    if (raw === 'paper') return { type: 'paper' };
    var m = raw.match(/^class-(11|12)(?:\/([a-z]+))?$/);
    if (m) return { type: m[2] ? 'subject' : 'class', grade: Number(m[1]), key: m[2] || null };
    return { type: 'home' };
  }

  function onHash() {
    var m = (location.hash || '').match(/^#revision\/preset\/(11|12)\/([a-z]+)/);
    var preset = m ? m[1] + ':' + m[2] : null;
    if (preset && location.hash !== '#revision') {
      try { history.replaceState(null, '', '#revision'); } catch (err) {}
    }
    menuOpen = false;
    paintMenu();
    stopQuizTimer();

    var route = getRoute();
    if (route.type === 'class') renderClass(route.grade);
    else if (route.type === 'subject') renderSubject(route.grade, route.key);
    else if (route.type === 'classes') renderClasses();
    else if (route.type === 'revision') renderRevision(preset);
    else if (route.type === 'quiz') renderQuizSetup();
    else if (route.type === 'study') renderStudy();
    else if (route.type === 'ai') renderAI();
    else if (route.type === 'paper') renderPaper();
    else renderHome();

    window.scrollTo(0, 0);
  }

  loadRevState();
  window.addEventListener('hashchange', onHash);
  onHash();
})();
