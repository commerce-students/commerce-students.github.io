/* ============================================================
   Commerce-Students · app.js
   Pure helpers are exposed on window.CS (used by node tests);
   DOM code runs only in a browser.
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
  var BANK_KEY = { accountancy: 'acc', business: 'bus', economics: 'eco', english: 'eng', information: 'it' };
  var TYPE_ORDER = ['mcq', 'short', 'long', 'mixed', 'full'];
  var TYPE_META = {
    mcq: { label: 'MCQ Paper', desc: '20 multiple-choice questions · auto-graded with explanations', duration: '45 min', marksNote: '1 mark each' },
    short: { label: 'Short Answer Paper', desc: '20 short-answer questions with model answer points', duration: '60 min', marksNote: '2 marks each' },
    long: { label: 'Long Answer Paper', desc: '20 long-answer questions with model answer points', duration: '90 min', marksNote: '4 marks each' },
    mixed: { label: 'Mixed Paper', desc: '10 MCQ + 5 short + 3 long in one sitting', duration: '60 min', marksNote: '1 / 2 / 4 marks' },
    full: { label: 'All-in-One Paper', desc: 'Full subject paper in the current CBSE layout with correct marks', duration: '3 hours', marksNote: '80 theory · 60 theory for IT' }
  };

  var STORAGE = {
    theme: 'cs-theme',
    rev: 'cs-rev',
    check: 'cs-check',
    bookmark: 'cs-bookmark',
    paper: 'cs-paper'
  };

  /* ---------------- storage ---------------- */

  function loadJSON(key, fallback) {
    try {
      var raw = W.localStorage ? W.localStorage.getItem(key) : null;
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, value) {
    try { if (W.localStorage) W.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  /* ---------------- pure helpers ---------------- */

  function esc(value) {
    return String(value).replace(/[&<>'"]/g, function (ch) {
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

  /* Pick across selected chapters, most-remaining chapter first
     (ties broken by chapter order — deterministic).
     cursor[ci+':'+kind] = items already consumed from this chapter+kind,
     shared between sections, so every unique question in the selected
     chapters is used before any question repeats. Wraps (reusing) only
     when the whole pool is exhausted before `count`. */
  function pickKind(pools, kind, count, cursor) {
    var result = [];
    var wrapped = false;
    var totalAvailable = pools.reduce(function (s, p) { return s + p[kind].length; }, 0);
    var active = pools.filter(function (p) { return p[kind].length; });
    var guard = 0;
    while (result.length < count && active.length && guard < 5000) {
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
      result.push({ ci: p.ci, qi: pos, item: p[kind][pos] });
      cursor[key] = used + 1;
    }
    return { items: result, wrapped: wrapped, totalAvailable: totalAvailable };
  }

  var KIND_CODE = { mcq: 'm', sh: 's', lg: 'l', cs: 'c' };

  function normItem(kind, ci, qi, raw, num, marks, grade, subject) {
    var base = {
      kind: kind,
      id: grade + '-' + subject + '-c' + ci + '-' + KIND_CODE[kind] + qi,
      num: num,
      marks: marks,
      chapter: ci
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
  function buildPaper(spec) {
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
      var pick = pickKind(pools, kind, count, cursor);
      reused = reused || pick.wrapped;
      var items = pick.items.map(function (it, i) {
        numCounter++;
        return normItem(kind, it.ci, it.qi, it.item, numCounter, marksEach, spec.grade, spec.subject);
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
      extraNote += ' Note: some questions repeat because the selected chapters hold fewer items than this paper needs — widen your chapter selection to fill every slot uniquely.';
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
    CURRICULUM_LINKS: CURRICULUM_LINKS,
    STORAGE: STORAGE
  };

  /* ============================================================
     Browser only from here
     ============================================================ */
  var HAS_DOM = typeof document !== 'undefined' && !!document.getElementById;
  if (!HAS_DOM) return;

  var app = document.getElementById('app');
  var brandMark = document.getElementById('brand-mark');

  /* ---------------- icons ---------------- */

  var LOGO_MARKUP = '<img src="assets/logo.svg" alt="" loading="eager" decoding="async">';

  var ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 14.2A8.6 8.6 0 0 1 9.8 3.8a8.6 8.6 0 1 0 10.4 10.4z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    gemini: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.8l2.6 7.6 7.6 2.6-7.6 2.6L12 22.2l-2.6-7.6-7.6-2.6 7.6-2.6z"/></svg>',
    notebooklm: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="2.8" width="16" height="18.4" rx="2.6" stroke="currentColor" stroke-width="1.8"/><path d="M8.4 2.8v18.4" stroke="currentColor" stroke-width="1.8"/><path fill="currentColor" d="M15.2 8.9l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z"/></svg>'
  };
  brandMark.innerHTML = LOGO_MARKUP;

  /* ---------------- theme ---------------- */

  var themeBtn = document.getElementById('theme-toggle');
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function paintThemeButton() {
    var dark = currentTheme() === 'dark';
    themeBtn.innerHTML = (dark ? ICONS.sun : ICONS.moon) + '<span>' + (dark ? 'Light mode' : 'Dark mode') + '</span>';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  var savedTheme = loadJSON(STORAGE.theme, null);
  if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.setAttribute('data-theme', savedTheme);
  paintThemeButton();
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    saveJSON(STORAGE.theme, next);
    paintThemeButton();
  });

  /* ---------------- mobile nav ---------------- */

  var menuBtn = document.getElementById('menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  var NAV_LINKS = [
    { key: 'home', label: 'Home', href: '#home' },
    { key: 'classes', label: 'Classes', href: '#classes' },
    { key: 'revision', label: 'Revision', href: '#revision' },
    { key: 'ai', label: 'AI', href: '#ai' }
  ];
  mobileNav.innerHTML = NAV_LINKS.map(function (l) {
    return '<a href="' + l.href + '" data-mnav="' + l.key + '">' + l.label + '</a>';
  }).join('');
  var menuOpen = false;
  function paintMenu() {
    mobileNav.classList.toggle('open', menuOpen);
    menuBtn.setAttribute('aria-expanded', String(menuOpen));
    menuBtn.innerHTML = menuOpen ? ICONS.close : ICONS.menu;
  }
  menuBtn.addEventListener('click', function () { menuOpen = !menuOpen; paintMenu(); });
  mobileNav.addEventListener('click', function () { menuOpen = false; paintMenu(); });
  function setNavActive(key) {
    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === key);
    });
    document.querySelectorAll('[data-mnav]').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-mnav') === key);
    });
  }

  /* ---------------- shared page bits ---------------- */

  function crumbs(parts) {
    return '<nav class="breadcrumbs" aria-label="Breadcrumb">' +
      parts.map(function (p, i) {
        var last = i === parts.length - 1;
        var inner = last ? '<span class="current">' + esc(p.label) + '</span>' : '<a href="' + p.href + '">' + esc(p.label) + '</a>';
        return (i ? '<span aria-hidden="true">/</span>' : '') + inner;
      }).join('') + '</nav>';
  }

  function subjectBlurb(key) {
    return {
      accountancy: 'Journals, ledgers, statements — and the partnership and company accounts of Class 12.',
      business: 'From the purpose of business to management principles, finance, markets and consumer protection.',
      economics: 'Micro and macro with statistics: demand and supply, national income, money and the Indian economy.',
      english: 'Reading, note-making and writing skills plus the Hornbill, Flamingo, Snapshots and Vistas texts.',
      information: 'The 802 course: employability skills, computer organization, networks, office tools, SQL and Java.'
    }[key];
  }

  function subjectCardHTML(grade, key) {
    var totals = bankTotals(grade, key) || { chapters: 0, mcq: 0, sh: 0, lg: 0, cs: 0 };
    return '<a class="subject-card" href="#class-' + grade + '/' + key + '">' +
      '<span class="subj-icon" aria-hidden="true">' + SUBJECT_ICONS[key] + '</span>' +
      '<h3>' + esc(SUBJECT_NAMES[key]) + '</h3>' +
      '<p>' + esc(subjectBlurb(key)) + '</p>' +
      '<span class="subj-meta"><span>' + totals.chapters + ' chapters</span><i></i><span>' + (totals.mcq + totals.sh + totals.lg + totals.cs) + ' original questions</span></span>' +
    '</a>';
  }

  /* ---------------- home ---------------- */

  function classCardHTML(grade) {
    return '<a class="class-card" data-grade="' + (grade === 11 ? 'XI' : 'XII') + '" href="#class-' + grade + '">' +
      '<span class="class-kicker">Year ' + (grade - 10) + (grade === 12 ? ' · Board year' : ' · Foundation year') + '</span>' +
      '<h3>Class ' + grade + '</h3>' +
      '<span class="class-count">5 subjects · chapter roadmaps · revision papers</span>' +
      '<span class="btn">Open Class ' + grade + ' →</span>' +
    '</a>';
  }

  function renderHome() {
    setNavActive('home');
    document.title = 'Commerce-Students · CBSE Commerce Revision';
    app.innerHTML =
      '<section class="shell home-hero"><div class="hero-copy">' +
        '<div class="hero-logo" aria-hidden="true">' + LOGO_MARKUP + '</div>' +
        '<span class="eyebrow">Commerce · XI – XII</span>' +
        '<h1>Commerce-<em>Students</em></h1>' +
        '<p class="hero-sub">One quiet place to revise the whole commerce syllabus — chapter checklists, original questions and practice papers set in the current CBSE format.</p>' +
        '<div class="hero-actions">' +
          '<a class="btn btn-solid" href="#class-11">Start with Class 11</a>' +
          '<a class="btn" href="#class-12">Start with Class 12</a>' +
          '<a class="btn btn-soft" href="#revision">Build a revision paper</a>' +
        '</div>' +
        '<div class="hero-meta">' +
          '<span><i></i>5 subjects</span>' +
          '<span><i></i>Original questions</span>' +
          '<span><i></i>CBSE-format papers</span>' +
          '<span><i></i>Progress saved on this device</span>' +
        '</div>' +
      '</div></section>' +
      '<section class="shell section"><div class="section-head">' +
        '<div><span class="eyebrow">Choose your class</span><h2>Two years, one system.</h2></div>' +
        '<div><p>Open a class to see every subject, tick off chapters as you revise and generate papers at any step.</p></div>' +
      '</div><div class="class-grid">' +
        classCardHTML(11) + classCardHTML(12) +
      '</div></section>' +
      '<section class="shell section"><div class="section-head">' +
        '<div><span class="eyebrow">The subjects</span><h2>What you can revise today.</h2></div>' +
      '</div><div class="subjects-strip">' +
        SUBJECTS.map(function (key) {
          var totals11 = bankTotals(11, key) || {};
          return '<a class="strip-card" href="#class-11/' + key + '">' +
            '<span class="strip-icon" aria-hidden="true">' + SUBJECT_ICONS[key] + '</span>' +
            '<strong>' + esc(SUBJECT_NAMES[key]) + '</strong>' +
            '<small>' + (totals11.chapters || 0) + ' chapters · Class 11 & 12</small>' +
          '</a>';
        }).join('') +
      '</div></section>';
  }

  /* ---------------- classes & class pages ---------------- */

  function renderClasses() {
    setNavActive('classes');
    document.title = 'Classes · Commerce-Students';
    var block = function (grade) {
      return '<section class="class-block">' +
        '<div class="class-block-head"><span class="class-badge">Class ' + grade + '</span><h2>Class ' + grade + ' subjects</h2>' +
        '<a class="btn btn-soft btn-sm" href="#revision">Revise this class →</a></div>' +
        '<div class="subjects-grid">' + SUBJECTS.map(function (key) { return subjectCardHTML(grade, key); }).join('') + '</div>' +
      '</section>';
    };
    app.innerHTML = '<section class="shell page-view">' +
      '<div class="eyebrow">Both years</div>' +
      '<h1 class="page-title">Classes</h1>' +
      '<p class="page-intro">Pick your class, then open a subject to see its chapter checklist, key points and revision tools.</p>' +
      block(11) + block(12) +
    '</section>';
  }

  function renderClass(grade) {
    setNavActive('classes');
    document.title = 'Class ' + grade + ' · Commerce-Students';
    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Class ' + grade }]) +
        '<div class="eyebrow">Year ' + (grade - 10) + '</div>' +
        '<h1 class="page-title">Class ' + grade + '</h1>' +
        '<p class="page-intro">Open a subject for its chapter checklist and key points — or jump straight to the revision builder for this class.</p>' +
        '<div class="subjects-grid" style="margin-top:24px">' +
          SUBJECTS.map(function (key) { return subjectCardHTML(grade, key); }).join('') +
        '</div>' +
        '<div class="rev-actions"><a class="btn btn-solid" href="#revision">Build a Class ' + grade + ' paper →</a></div>' +
      '</section>';
  }

  /* ---------------- subject detail ---------------- */

  function checklistKey(grade, subject) { return grade + '-' + subject; }
  function loadChecklist(grade, subject, length) {
    var raw = (loadJSON(STORAGE.check, {}) || {})[checklistKey(grade, subject)] || [];
    var out = [];
    for (var i = 0; i < length; i++) out.push(!!raw[i]);
    return out;
  }
  function saveChecklist(grade, subject, arr) {
    var all = loadJSON(STORAGE.check, {}) || {};
    all[checklistKey(grade, subject)] = arr;
    saveJSON(STORAGE.check, all);
  }

  var qrState = { cards: [], i: 0 };

  function renderSubject(grade, key) {
    if (SUBJECTS.indexOf(key) === -1) { location.hash = '#class-' + grade; return; }
    setNavActive('classes');
    var b = bank(grade, key);
    if (!b) { location.hash = '#class-' + grade; return; }
    document.title = SUBJECT_NAMES[key] + ' · Class ' + grade + ' · Commerce-Students';
    var checked = loadChecklist(grade, key, b.chapters.length);
    var done = checked.filter(Boolean).length;
    var totals = bankTotals(grade, key) || {};
    var pct = Math.round((done / b.chapters.length) * 100);

    // flashcards prepared before markup so the first paint is correct
    qrState.cards = [];
    b.chapters.forEach(function (ch) {
      (ch.k || []).forEach(function (kp) { qrState.cards.push({ chapter: ch.t, text: kp }); });
    });
    qrState.i = 0;

    var chaptersHTML = b.chapters.map(function (ch, ci) {
      var keyPoints = (ch.k || []).map(function (kp, ki) {
        return '<div class="keypoint"><b>' + (ki + 1) + '.</b> ' + esc(kp) + '</div>';
      }).join('');
      return '<div class="chapter' + (checked[ci] ? ' checked' : '') + '" data-ci="' + ci + '">' +
        '<button class="chapter-row" type="button" aria-expanded="false">' +
          '<span class="chapter-check" aria-hidden="true">' + (checked[ci] ? '✓' : '') + '</span>' +
          '<span class="chapter-num">' + String(ci + 1).padStart(2, '0') + '</span>' +
          '<span class="chapter-title">' + esc(ch.t) + '</span>' +
          '<span class="chapter-toggle-ic" aria-hidden="true">＋</span>' +
        '</button>' +
        '<div class="chapter-body">' + keyPoints + '</div>' +
      '</div>';
    }).join('');

    var c0 = qrState.cards[0];
    var qrHTML = '<div class="qr-card" id="qr-card">' +
      '<div class="qr-top"><span>Key point</span><span class="qr-count" id="qr-count">' + (qrState.i + 1) + ' / ' + qrState.cards.length + '</span></div>' +
      '<div class="qr-chapter" id="qr-chapter">' + esc(c0.chapter) + '</div>' +
      '<div class="qr-text" id="qr-text">' + esc(c0.text) + '</div>' +
      '<div class="qr-nav">' +
        '<button class="btn btn-soft btn-sm" id="qr-prev" type="button">← Previous</button>' +
        '<button class="btn btn-soft btn-sm" id="qr-shuffle" type="button">Shuffle</button>' +
        '<button class="btn btn-solid btn-sm" id="qr-next" type="button">Next →</button>' +
      '</div></div>';

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Class ' + grade, href: '#class-' + grade }, { label: SUBJECT_NAMES[key] }]) +
        '<div class="subject-hero"><div>' +
          '<span class="eyebrow">Class ' + grade + ' · ' + (key === 'information' ? 'Subject 802' : 'Core subject') + '</span>' +
          '<h1>' + esc(SUBJECT_NAMES[key]) + '</h1>' +
          '<p>' + esc(subjectBlurb(key)) + '</p>' +
        '</div><div class="subject-hero-meta"><strong>' + b.chapters.length + '</strong><span>chapters</span>' +
        '<div style="margin-top:8px"><strong style="font-size:15px">' + (totals.mcq + totals.sh + totals.lg + totals.cs) + '</strong><span>questions in the bank</span></div></div>' +
        '</div>' +
        '<div class="detail-grid">' +
          '<section class="panel">' +
            '<div class="panel-title"><h2>Chapter checklist</h2><span>Tick chapters as you revise</span></div>' +
            '<div class="chapter-list" id="chapter-list">' + chaptersHTML + '</div>' +
            '<div class="progress-wrap">' +
              '<div class="progress-line"><i id="check-progress" style="width:' + pct + '%"></i></div>' +
              '<div class="progress-meta"><span id="check-label">' + done + ' of ' + b.chapters.length + ' chapters revised</span><span id="check-pct">' + pct + '%</span></div>' +
            '</div>' +
            '<button class="btn btn-soft btn-sm checklist-reset" id="check-reset" type="button">Reset checklist</button>' +
          '</section>' +
          '<aside>' +
            '<div class="panel">' +
              '<div class="panel-title"><h2>Quick revision</h2><span>Flashcards from key points</span></div>' +
              qrHTML +
            '</div>' +
            '<div class="side-actions">' +
              '<a class="btn btn-solid" href="#revision/preset/' + grade + '/' + key + '">Revise this subject →</a>' +
              '<a class="btn btn-soft" href="#class-' + grade + '">← All Class ' + grade + ' subjects</a>' +
              (key === 'information' && grade === 11 ? '<a class="btn btn-soft" href="class11-it-notes.html">Open detailed IT notes ↗</a>' : '') +
              '<a class="btn btn-soft" href="' + CURRICULUM_LINKS[key] + '" target="_blank" rel="noreferrer">CBSE curriculum PDF ↗</a>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</section>';

    function paintQr() {
      var c = qrState.cards[qrState.i];
      document.getElementById('qr-count').textContent = (qrState.i + 1) + ' / ' + qrState.cards.length;
      document.getElementById('qr-chapter').textContent = c.chapter;
      document.getElementById('qr-text').textContent = c.text;
    }
    function paintChecklistState(arr) {
      var n = arr.filter(Boolean).length;
      var p = Math.round((n / b.chapters.length) * 100);
      app.querySelectorAll('#chapter-list .chapter').forEach(function (el) {
        var i = Number(el.getAttribute('data-ci'));
        el.classList.toggle('checked', !!arr[i]);
        el.querySelector('.chapter-check').textContent = arr[i] ? '✓' : '';
      });
      document.getElementById('check-progress').style.width = p + '%';
      document.getElementById('check-label').textContent = n + ' of ' + b.chapters.length + ' chapters revised';
      document.getElementById('check-pct').textContent = p + '%';
    }

    document.getElementById('qr-next').addEventListener('click', function () { qrState.i = (qrState.i + 1) % qrState.cards.length; paintQr(); });
    document.getElementById('qr-prev').addEventListener('click', function () { qrState.i = (qrState.i - 1 + qrState.cards.length) % qrState.cards.length; paintQr(); });
    document.getElementById('qr-shuffle').addEventListener('click', function () {
      for (var i = qrState.cards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = qrState.cards[i]; qrState.cards[i] = qrState.cards[j]; qrState.cards[j] = t;
      }
      qrState.i = 0; paintQr();
    });

    var list = document.getElementById('chapter-list');
    list.addEventListener('click', function (e) {
      var row = e.target.closest('.chapter-row');
      if (!row) return;
      var chapterEl = row.closest('.chapter');
      var ci = Number(chapterEl.getAttribute('data-ci'));
      if (e.target.closest('.chapter-check')) {
        checked[ci] = !checked[ci];
        saveChecklist(grade, key, checked);
        paintChecklistState(checked);
        return;
      }
      chapterEl.classList.toggle('open');
      row.setAttribute('aria-expanded', String(chapterEl.classList.contains('open')));
    });
    document.getElementById('check-reset').addEventListener('click', function () {
      for (var i = 0; i < checked.length; i++) checked[i] = false;
      saveChecklist(grade, key, checked);
      paintChecklistState(checked);
    });
  }

  /* ---------------- revision builder ---------------- */

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
    document.title = 'Revision · Commerce-Students';
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

    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'Revision' }]) +
        '<div class="eyebrow">Five steps</div>' +
        '<h1 class="page-title">Revision paper builder</h1>' +
        '<p class="page-intro">Choose a class, a paper type, a subject and chapters — then generate a paper with original questions. Your choices are saved on this device.</p>' +
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
          revStepHTML(1, 'Paper type', 'What should the generated paper contain?',
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
          revStepHTML(3, 'Chapters', 'Select all, one or multiple chapters for ' + esc(SUBJECT_NAMES[revState.subject]) + '.',
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
          revStepHTML(4, 'Generate', 'Check the plan, then build the paper.',
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
      var t = bankTotals(revState.grade, revState.subject) || {};
      return '<div class="summary-row"><span>Class</span><span>Class ' + revState.grade + '</span></div>' +
        '<div class="summary-row"><span>Paper</span><span>' + TYPE_META[revState.type].label + ' · ' + TYPE_META[revState.type].duration + '</span></div>' +
        '<div class="summary-row"><span>Subject</span><span>' + esc(SUBJECT_NAMES[revState.subject]) + '</span></div>' +
        '<div class="summary-row"><span>Chapters</span><span>' + selCount() + ' of ' + b.chapters.length + ' selected</span></div>' +
        '<div class="summary-row"><span>Questions available</span><span>' + (t.mcq + t.sh + t.lg + t.cs) + ' in bank · ' + (t.mcq || 0) + ' MCQ / ' + (t.sh || 0) + ' short / ' + (t.lg || 0) + ' long / ' + (t.cs || 0) + ' case</span></div>';
    }

    function paintSteps() {
      var valid = [
        [11, 12].indexOf(revState.grade) !== -1,
        TYPE_ORDER.indexOf(revState.type) !== -1,
        SUBJECTS.indexOf(revState.subject) !== -1,
        selCount() > 0,
        true
      ];
      for (var i = 0; i < 5; i++) {
        var pill = document.getElementById('step-pill-' + i);
        if (!pill) return;
        pill.classList.toggle('done', valid[i] && i < 4);
        pill.classList.toggle('current', i === 4 && valid[3]);
        document.getElementById('rev-step-' + i).style.opacity = valid[i] ? '1' : '.55';
      }
      var sum = document.getElementById('rev-summary');
      if (sum) sum.innerHTML = summaryRows();
      var note = document.getElementById('rev-note');
      if (note) {
        var n = selCount();
        note.textContent = n ? 'Ready — questions will be drawn only from your ' + n + ' selected chapter' + (n > 1 ? 's' : '') + '.' : 'Select at least one chapter above.';
      }
    }

    function paintChipStates() {
      app.querySelectorAll('[data-role="chapter"]').forEach(function (el) {
        var ci = Number(el.getAttribute('data-value'));
        el.classList.toggle('selected', !!revState.chapters[ci]);
        el.querySelector('.chip-box').textContent = revState.chapters[ci] ? '✓' : '';
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
        renderRevision(); // re-render with the new class
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
      lastPaper = buildPaper(spec);
      saveRevState();
      saveJSON(STORAGE.paper, spec);
      location.hash = '#paper';
    });

    for (var si = 0; si < 5; si++) {
      (function (idx) {
        var pill = document.getElementById('step-pill-' + idx);
        pill.style.cursor = 'pointer';
        pill.addEventListener('click', function () {
          var el = document.getElementById('rev-step-' + idx);
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      })(si);
    }

    paintSteps();
  }

  /* ---------------- paper ---------------- */

  var paperCtx = { spec: null, paper: null };

  function renderPaper() {
    setNavActive('revision');
    var spec = lastPaper && lastPaper.spec ? lastPaper.spec : loadJSON(STORAGE.paper, null);
    if (!spec) { location.hash = '#revision'; return; }
    paperCtx = { spec: spec, paper: buildPaper(spec) };
    var paper = paperCtx.paper;
    if (!paper) { location.hash = '#revision'; return; }
    document.title = paper.typeLabel + ' · Class ' + spec.grade + ' · Commerce-Students';
    var bookmarked = loadJSON(STORAGE.bookmark, {}) || {};
    var bmCount = Object.keys(bookmarked).filter(function (id) { return bookmarked[id]; }).length;
    var hasMcq = paper.sections.some(function (s) { return s.items.some(function (it) { return it.kind === 'mcq'; }); });
    var b = bank(spec.grade, spec.subject);

    function shortTitle(t, max) {
      return t.length > max ? t.slice(0, max - 1) + '…' : t;
    }

    function questionHTML(it, si) {
      var chTitle = b.chapters[it.chapter] ? b.chapters[it.chapter].t : '';
      var body = '<div class="q-top">' +
        '<span class="q-num">' + it.num + '</span>' +
        '<span class="q-text">' + esc(it.q) + '</span>' +
        '<button class="bm-btn" type="button" data-qid="' + esc(it.id) + '" aria-label="Bookmark question" title="Bookmark">' + (bookmarked[it.id] ? '★' : '☆') + '</button>' +
        '<span class="q-marks">' + it.marks + ' mark' + (it.marks > 1 ? 's' : '') + '</span>' +
      '</div>';
      if (it.kind === 'mcq') {
        body += '<div class="q-opts" role="radiogroup">' +
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
      body += '<span class="q-chapter-tag">Chapter ' + (it.chapter + 1) + ' · ' + esc(shortTitle(chTitle, 42)) + '</span>';
      return '<div class="question" data-qid="' + esc(it.id) + '">' + body + '</div>';
    }

    app.innerHTML =
      '<section class="shell page-view">' +
        '<div class="paper-wrap">' +
          crumbs([{ label: 'Home', href: '#home' }, { label: 'Revision', href: '#revision' }, { label: paper.typeLabel }]) +
          '<div class="paper-toolbar">' +
            '<a class="btn btn-soft btn-sm" href="#revision">← Change revision plan</a>' +
            (hasMcq ? '<button class="btn btn-solid btn-sm" id="paper-check" type="button">Check answers</button>' : '') +
            '<button class="btn btn-soft btn-sm" id="paper-restart" type="button">Reset attempts</button>' +
            '<button class="btn btn-soft btn-sm" id="paper-print" type="button">Print paper</button>' +
          '</div>' +
          '<div class="score-banner" id="score-banner"></div>' +
          '<div class="paper-sheet">' +
            '<div class="paper-head">' +
              '<span class="paper-brand">Commerce-Students · Original practice paper</span>' +
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
              '<span>Questions are original, written from the official CBSE 2026–27 curriculum.</span>' +
              '<span>Bookmark stars are saved on this device.</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  /* Delegated handlers — attached ONCE to #app so re-renders never
     stack duplicate listeners (which would double-toggle bookmarks). */
  function qElFor(id) { return app.querySelector('.question[data-qid="' + id + '"]'); }

  app.addEventListener('click', function (e) {
    var t = e.target;
    var bm = t.closest('.bm-btn');
    if (bm) {
      var id = bm.getAttribute('data-qid');
      var marks = loadJSON(STORAGE.bookmark, {}) || {};
      marks[id] = !marks[id];
      saveJSON(STORAGE.bookmark, marks);
      bm.classList.toggle('on', !!marks[id]);
      bm.textContent = marks[id] ? '★' : '☆';
      var meta = document.getElementById('bm-meta');
      if (meta) meta.textContent = Object.keys(marks).filter(function (k) { return marks[k]; }).length + ' bookmarked';
      return;
    }
    if (t.closest('#paper-print')) { window.print(); return; }
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
    paper.sections.forEach(function (sec, si) {
      sec.items.forEach(function (it) {
        if (it.kind !== 'mcq') return;
        totalMcq++;
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
          qEl.classList.add('correct');
          var okOpt = qEl.querySelector('.q-opt[data-oi="' + choice + '"]');
          if (okOpt) okOpt.classList.add('opt-correct');
          if (fb) { fb.innerHTML = '<b>Correct</b>' + esc(it.exp || 'Well done.'); fb.classList.add('show'); }
        } else {
          qEl.classList.add('wrong');
          var badOpt = qEl.querySelector('.q-opt[data-oi="' + choice + '"]');
          var goodOpt = qEl.querySelector('.q-opt[data-oi="' + it.correct + '"]');
          if (badOpt) badOpt.classList.add('opt-wrong');
          if (goodOpt) goodOpt.classList.add('opt-correct');
          if (fb) { fb.innerHTML = '<b>Not quite — correct option: ' + 'ABCD'[it.correct] + '</b>' + esc(it.exp || ''); fb.classList.add('show'); }
        }
      });
    });
    var banner = document.getElementById('score-banner');
    if (!banner) return;
    var pct = totalMcq ? Math.round((score / totalMcq) * 100) : 0;
    banner.innerHTML = '<div><strong>' + score + ' / ' + totalMcq + ' correct</strong><span class="score-detail"> · ' + pct + '%</span></div>' +
      '<div class="score-detail">' + (totalMcq - answered) + ' unanswered · answers are marked on the questions</div>';
    banner.classList.add('show');
    if (banner.scrollIntoView) banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------------- AI ---------------- */

  function renderAI() {
    setNavActive('ai');
    document.title = 'AI tools · Commerce-Students';
    app.innerHTML =
      '<section class="shell page-view">' +
        crumbs([{ label: 'Home', href: '#home' }, { label: 'AI' }]) +
        '<div class="eyebrow">Study with AI</div>' +
        '<h1 class="page-title">Two AI tools, two jobs.</h1>' +
        '<p class="page-intro">Both are free to start and open in a new tab. Use them together: clarify first, then turn your clarified notes into study material.</p>' +
        '<div class="ai-grid">' +
          '<a class="ai-card" href="https://gemini.google.com/" target="_blank" rel="noreferrer">' +
            '<span class="ai-logo" aria-hidden="true">' + ICONS.gemini + '</span>' +
            '<span class="ai-for">For doubts</span>' +
            '<h3>Google Gemini</h3>' +
            '<p class="ai-desc">Stuck on a concept, a format or a tricky question? Ask Gemini a specific question from your chapter and get a step-by-step explanation you can check against your textbook and notes.</p>' +
            '<span class="ai-use">Best for: concept doubts · worked examples · checking your own answers</span>' +
            '<span class="btn btn-solid">Open Gemini ↗</span>' +
          '</a>' +
          '<a class="ai-card" href="https://notebooklm.google.com/" target="_blank" rel="noreferrer">' +
            '<span class="ai-logo" aria-hidden="true">' + ICONS.notebooklm + '</span>' +
            '<span class="ai-for">For making notes</span>' +
            '<h3>Google NotebookLM</h3>' +
            '<p class="ai-desc">Paste in your chapter notes, summaries or syllabus points and let NotebookLM turn them into study material — organised notes, flashcards, question-and-answer sets and audio overviews you can listen to.</p>' +
            '<span class="ai-use">Best for: making notes · flashcards · audio revision packs</span>' +
            '<span class="btn btn-solid">Open NotebookLM ↗</span>' +
          '</a>' +
        '</div>' +
        '<div class="ai-tip"><b>How students use both:</b> resolve your doubts with Gemini first, then feed the clarified notes into NotebookLM to build a revision pack for the night before the exam. Both tools work best with specific inputs — “Explain the BRS with a numerical” beats “teach me accountancy”.</div>' +
      '</section>';
  }

  /* ---------------- router ---------------- */

  function getRoute() {
    var raw = (location.hash || '#home').slice(1).replace(/^\//, '');
    if (raw === '' || raw === 'home') return { type: 'home' };
    if (raw === 'classes') return { type: 'classes' };
    if (raw === 'revision') return { type: 'revision' };
    if (raw === 'ai') return { type: 'ai' };
    if (raw === 'paper') return { type: 'paper' };
    var m = raw.match(/^class-(11|12)(?:\/([a-z]+))?$/);
    if (m) return { type: m[2] ? 'subject' : 'class', grade: Number(m[1]), key: m[2] || null };
    return { type: 'home' };
  }

  function onHash() {
    // #revision/preset/<grade>/<subject> → apply preset, normalise the hash
    var m = (location.hash || '').match(/^#revision\/preset\/(11|12)\/([a-z]+)/);
    var preset = m ? m[1] + ':' + m[2] : null;
    if (preset && location.hash !== '#revision') {
      try { history.replaceState(null, '', '#revision'); } catch (err) { /* very old browsers */ }
    }
    menuOpen = false;
    paintMenu();
    var route = getRoute();
    if (route.type === 'class') renderClass(route.grade);
    else if (route.type === 'subject') renderSubject(route.grade, route.key);
    else if (route.type === 'classes') renderClasses();
    else if (route.type === 'revision') renderRevision(preset);
    else if (route.type === 'ai') renderAI();
    else if (route.type === 'paper') renderPaper();
    else renderHome();
    window.scrollTo(0, 0);
  }

  loadRevState();
  window.addEventListener('hashchange', onHash);
  onHash();
})();
