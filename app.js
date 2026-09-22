(function () {
  "use strict";

  var app = document.getElementById("app");
  var searchInput = document.getElementById("global-search-input");
  var themeToggle = document.getElementById("theme-toggle");
  var content = window.CS_CONTENT || { classes: {}, formulas: [], definitions: [], questions: [] };
  var LS = {
    theme: "cs-theme-v2",
    profile: "cs-profile-v2",
    attempts: "cs-attempts-v2",
    mistakes: "cs-mistakes-v2",
    completed: "cs-completed-v2",
    daily: "cs-daily-v2"
  };
  var STATE = {
    route: { page: "home" },
    profile: loadJSON(LS.profile, { name: "Student", class: 12, subjects: ["Accountancy", "Business Studies", "Economics"], examDate: "", dailyTarget: 30 }),
    attempts: loadJSON(LS.attempts, []),
    mistakes: loadJSON(LS.mistakes, {}),
    completedTopics: loadJSON(LS.completed, {}),
    currentPractice: null,
    currentTest: null,
    testTimerId: null
  };

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]; });
  }
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    saveJSON(LS.theme, theme);
  }

  function applyTheme() {
    var saved = loadJSON(LS.theme, "light");
    setTheme(saved === "dark" ? "dark" : "light");
  }

  function getBaseRoute(hash) {
    var raw = (hash || "#home").replace(/^#/, "");
    var parts = raw.split("/").filter(Boolean);
    if (!parts.length) return { page: "home" };
    if (["home", "study", "practice", "tests", "revision", "ai", "progress", "profile", "mistakes"].indexOf(parts[0]) !== -1) {
      return { page: parts[0], args: parts.slice(1) };
    }
    return { page: "home" };
  }

  function allQuestions(filters) {
    return content.questions.filter(function (q) {
      if (!filters) return true;
      return (!filters.class || q.class === Number(filters.class)) &&
        (!filters.subject || q.subject === filters.subject) &&
        (!filters.chapter || q.chapter === filters.chapter) &&
        (!filters.topic || q.topic === filters.topic) &&
        (!filters.type || q.type === filters.type) &&
        (!filters.difficulty || q.difficulty === filters.difficulty);
    });
  }

  function topicKey(q) {
    return [q.class, q.subject, q.chapter, q.topic].join("|");
  }

  function computeTopicStats() {
    var map = {};
    STATE.attempts.forEach(function (a) {
      if (!map[a.topicKey]) map[a.topicKey] = { correct: 0, total: 0, subject: a.subject, chapter: a.chapter, topic: a.topic };
      map[a.topicKey].total++;
      if (a.correct) map[a.topicKey].correct++;
    });
    return map;
  }

  function getTopicStatus(topicKeyStr) {
    var stats = computeTopicStats()[topicKeyStr];
    if (!stats || stats.total === 0) return { label: "Not started", className: "muted" };
    var acc = Math.round((stats.correct / stats.total) * 100);
    if (stats.total >= 5 && acc > 75) return { label: "Strong", className: "status-strong" };
    if (acc < 50) return { label: "Needs revision", className: "status-needs" };
    return { label: "In progress", className: "status-improving" };
  }

  function markAttempt(q, isCorrect, userAnswer, sessionType) {
    STATE.attempts.push({
      id: q.id,
      class: q.class,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      topicKey: topicKey(q),
      correct: !!isCorrect,
      userAnswer: userAnswer,
      sessionType: sessionType,
      timestamp: new Date().toISOString()
    });
    if (!isCorrect) {
      var m = STATE.mistakes[q.id] || { count: 0, lastUserAnswer: "", firstSeen: new Date().toISOString() };
      m.count += 1;
      m.lastUserAnswer = userAnswer == null ? "" : String(userAnswer);
      m.lastSeen = new Date().toISOString();
      m.questionId = q.id;
      STATE.mistakes[q.id] = m;
    }
    saveJSON(LS.attempts, STATE.attempts);
    saveJSON(LS.mistakes, STATE.mistakes);
  }

  function calcOverview() {
    var total = STATE.attempts.length;
    var correct = STATE.attempts.filter(function (a) { return a.correct; }).length;
    var tests = STATE.attempts.filter(function (a) { return a.sessionType === "test"; }).length;
    return {
      total: total,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      tests: tests,
      mistakes: Object.keys(STATE.mistakes).length
    };
  }

  function subjectStats() {
    var by = {};
    STATE.attempts.forEach(function (a) {
      if (!by[a.subject]) by[a.subject] = { total: 0, correct: 0 };
      by[a.subject].total++;
      if (a.correct) by[a.subject].correct++;
    });
    return by;
  }

  function todaysDaily10() {
    var key = new Date().toISOString().slice(0, 10);
    var cache = loadJSON(LS.daily, {});
    if (cache.date === key && Array.isArray(cache.ids)) return cache.ids.map(getQuestionById).filter(Boolean);
    var weakTopicKeys = Object.keys(computeTopicStats()).filter(function (k) {
      var s = computeTopicStats()[k];
      var acc = s.total ? (s.correct / s.total) * 100 : 0;
      return s.total >= 3 && acc < 60;
    });
    var source = allQuestions({ class: STATE.profile.class });
    source = source.filter(function (q) { return weakTopicKeys.length ? weakTopicKeys.indexOf(topicKey(q)) !== -1 : true; });
    var recentMistakeIds = Object.keys(STATE.mistakes).slice(0, 10);
    var mixed = source.concat(recentMistakeIds.map(getQuestionById).filter(Boolean)).filter(Boolean);
    var uniq = {};
    var out = [];
    mixed.forEach(function (q) {
      if (!uniq[q.id] && out.length < 10) { uniq[q.id] = true; out.push(q); }
    });
    if (out.length < 10) {
      allQuestions({ class: STATE.profile.class }).forEach(function (q) {
        if (!uniq[q.id] && out.length < 10) { uniq[q.id] = true; out.push(q); }
      });
    }
    saveJSON(LS.daily, { date: key, ids: out.map(function (q) { return q.id; }) });
    return out;
  }

  function getQuestionById(id) {
    return content.questions.find(function (q) { return q.id === id; });
  }

  function navActive(page) {
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-nav") === page);
    });
  }

  function renderHome() {
    navActive("home");
    document.title = "Commerce Students — CBSE Commerce Study Companion";
    var today = calcOverview();
    var daily10 = todaysDaily10();
    app.innerHTML =
      '<section class="hero">' +
        '<span class="badge">Commerce Students</span>' +
        '<h1>Study Commerce smarter.</h1>' +
        '<p>Learn concepts, practice exam-style questions, fix mistakes, revise fast, and track your preparation in one focused workspace.</p>' +
        '<div class="actions">' +
          '<a class="btn btn-solid" href="#study">Start Studying</a>' +
          '<a class="btn btn-soft" href="#study">Explore Subjects</a>' +
        '</div>' +
      '</section>' +
      '<section class="grid cols-2" style="margin-top:14px">' +
        '<article class="card"><h3>Choose your class</h3><p class="muted">Current class: <strong>Class ' + esc(STATE.profile.class) + '</strong></p>' +
          '<div class="actions"><button class="btn btn-soft" data-action="set-class" data-value="11">Class 11</button><button class="btn btn-soft" data-action="set-class" data-value="12">Class 12</button></div>' +
        '</article>' +
        '<article class="card"><h3>Today\'s 10</h3><p class="muted">' + daily10.length + ' questions · ~10 minutes</p><p class="small">Based on your recent practice.</p>' +
          '<div class="actions"><a class="btn btn-solid" href="#practice/daily10">Start</a></div></article>' +
      '</section>' +
      '<section class="kpis" style="margin-top:14px">' +
        '<article class="card"><div class="kpi">' + today.total + '</div><div class="small muted">Questions solved</div></article>' +
        '<article class="card"><div class="kpi">' + today.accuracy + '%</div><div class="small muted">Accuracy</div></article>' +
        '<article class="card"><div class="kpi">' + today.tests + '</div><div class="small muted">Test attempts</div></article>' +
        '<article class="card"><div class="kpi">' + today.mistakes + '</div><div class="small muted">Mistake topics</div></article>' +
      '</section>' +
      '<section class="grid cols-3" style="margin-top:14px">' +
        '<a class="card" href="#study"><h3>📚 Study</h3><p>Chapter-wise lessons and topic status.</p></a>' +
        '<a class="card" href="#practice"><h3>📝 Practice</h3><p>Chapter and topic filters, instant feedback.</p></a>' +
        '<a class="card" href="#tests"><h3>⏱ Take a Test</h3><p>Timed quick and chapter tests.</p></a>' +
        '<a class="card" href="#revision"><h3>🔄 Revise</h3><p>5-minute revision, formulas, definitions.</p></a>' +
        '<a class="card" href="#ai"><h3>🤖 Ask AI</h3><p>Context-aware prompt builder with study actions.</p></a>' +
        '<a class="card" href="#progress"><h3>📊 Track Progress</h3><p>Overall and weak-topic analytics.</p></a>' +
      '</section>';
  }

  function classSubjects(grade) {
    return content.classes[String(grade)] || {};
  }

  function renderStudy(args) {
    navActive("study");
    if (!args || !args.length) {
      var subjects = classSubjects(STATE.profile.class);
      var cards = Object.keys(subjects).map(function (key) {
        var s = subjects[key];
        return '<a class="card" href="#study/' + key + '"><h3>' + esc(s.name) + '</h3><p>' + esc(s.description) + '</p><p class="small muted">' + s.chapters.length + ' chapters</p></a>';
      }).join("");
      app.innerHTML = '<h1 class="section-title">Study · Class ' + esc(STATE.profile.class) + '</h1><div class="grid cols-3">' + cards + '</div>';
      return;
    }
    var subjectKey = args[0];
    var subject = classSubjects(STATE.profile.class)[subjectKey];
    if (!subject) { app.innerHTML = '<div class="card">Subject not found for current class.</div>'; return; }
    if (args.length === 1) {
      var chaptersHTML = subject.chapters.map(function (c, index) {
        var topicNodes = c.topics.map(function (t) {
          var st = getTopicStatus([STATE.profile.class, subject.name, c.title, t.title].join("|"));
          return '<li class="list-item"><strong>' + esc(t.title) + '</strong> · <span class="' + st.className + '">' + esc(st.label) + '</span></li>';
        }).join("");
        return '<article class="card"><h3>' + (index + 1) + '. ' + esc(c.title) + '</h3><ul class="list">' + topicNodes + '</ul><div class="actions"><a class="btn btn-soft" href="#study/' + subjectKey + '/' + c.id + '">Open chapter</a><a class="btn btn-solid" href="#practice/start?subject=' + encodeURIComponent(subject.name) + '&chapter=' + encodeURIComponent(c.title) + '">Practice</a></div></article>';
      }).join("");
      app.innerHTML = '<h1 class="section-title">' + esc(subject.name) + '</h1><p class="muted">' + esc(subject.description) + '</p><div class="grid cols-2" style="margin-top:10px">' + chaptersHTML + '</div>';
      return;
    }
    var chapter = subject.chapters.find(function (c) { return c.id === args[1]; });
    if (!chapter) { app.innerHTML = '<div class="card">Chapter not found.</div>'; return; }
    var topicCards = chapter.topics.map(function (t) {
      var key = [STATE.profile.class, subject.name, chapter.title, t.title].join("|");
      var st = getTopicStatus(key);
      return '<article class="card"><h3>' + esc(t.title) + '</h3><p class="muted">' + esc(t.lesson) + '</p><p class="small ' + st.className + '">' + esc(st.label) + '</p><div class="actions"><a class="btn btn-soft" href="#study/' + subjectKey + '/' + chapter.id + '/' + t.id + '">Learn</a><a class="btn btn-solid" href="#practice/start?subject=' + encodeURIComponent(subject.name) + '&chapter=' + encodeURIComponent(chapter.title) + '&topic=' + encodeURIComponent(t.title) + '">Practice this topic</a></div></article>';
    }).join("");
    if (args.length === 2) {
      app.innerHTML = '<h1 class="section-title">' + esc(chapter.title) + '</h1><p class="muted">' + esc(subject.name) + ' · Progress based on your recent practice.</p><div class="grid cols-2">' + topicCards + '</div>';
      return;
    }
    var topic = chapter.topics.find(function (t) { return t.id === args[2]; });
    if (!topic) { app.innerHTML = '<div class="card">Topic not found.</div>'; return; }
    var topicId = [STATE.profile.class, subject.name, chapter.title, topic.title].join("|");
    app.innerHTML =
      '<article class="panel">' +
      '<h1 class="section-title">' + esc(topic.title) + '</h1><p class="muted">' + esc(subject.name) + ' · ' + esc(chapter.title) + '</p>' +
      '<p style="margin-top:8px">' + esc(topic.lesson) + '</p>' +
      '<h2 style="margin:14px 0 6px">Key points</h2><ul>' + topic.keyPoints.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul>' +
      '<h2 style="margin:14px 0 6px">Exam tips</h2><ul>' + topic.revision.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul>' +
      '<div class="actions"><button class="btn btn-soft" data-action="complete-topic" data-id="' + esc(topicId) + '">Mark as completed</button><a class="btn btn-solid" href="#practice/start?subject=' + encodeURIComponent(subject.name) + '&chapter=' + encodeURIComponent(chapter.title) + '&topic=' + encodeURIComponent(topic.title) + '">Continue to practice</a><a class="btn btn-soft" href="#ai?subject=' + encodeURIComponent(subject.name) + '&chapter=' + encodeURIComponent(chapter.title) + '&topic=' + encodeURIComponent(topic.title) + '">Ask AI</a></div></article>';
  }

  function parseQuery(query) {
    var out = {};
    if (!query) return out;
    query.split("&").forEach(function (kv) {
      var p = kv.split("=");
      out[decodeURIComponent(p[0] || "")] = decodeURIComponent(p[1] || "");
    });
    return out;
  }

  function buildPracticeSession(filters, testMode) {
    var set = allQuestions(filters).filter(function (q) { return ["mcq", "assertion", "truefalse", "numerical", "short", "case"].indexOf(q.type) !== -1; });
    if (!set.length) return null;
    var max = testMode ? Math.min(20, set.length) : Math.min(10, set.length);
    return {
      mode: testMode ? "test" : "practice",
      filters: filters,
      questions: set.slice(0, max),
      at: 0,
      answers: {},
      submitted: {},
      startedAt: Date.now(),
      timeLimitSec: testMode ? (max * 90) : null,
      secLeft: testMode ? (max * 90) : null
    };
  }

  function renderPractice(args) {
    navActive("practice");
    var raw = location.hash.split("?")[1] || "";
    var query = parseQuery(raw);
    if (!args || !args.length) {
      app.innerHTML =
        '<h1 class="section-title">Practice</h1><p class="muted">Filter by class, subject, chapter, topic, difficulty, and type.</p>' +
        '<article class="card"><form id="practice-form" class="grid cols-3">' +
        '<label>Class<select name="class"><option value="' + STATE.profile.class + '">Class ' + STATE.profile.class + '</option><option value="11">Class 11</option><option value="12">Class 12</option></select></label>' +
        '<label>Subject<input name="subject" placeholder="Accountancy"></label>' +
        '<label>Chapter<input name="chapter" placeholder="Partnership"></label>' +
        '<label>Topic<input name="topic" placeholder="Goodwill"></label>' +
        '<label>Difficulty<select name="difficulty"><option value="">Any</option><option>easy</option><option>medium</option><option>hard</option></select></label>' +
        '<label>Type<select name="type"><option value="">Any</option><option>mcq</option><option>assertion</option><option>truefalse</option><option>numerical</option><option>short</option><option>case</option></select></label>' +
        '<button class="btn btn-solid" type="submit">Start Practice</button>' +
        '<a class="btn btn-soft" href="#mistakes">My Mistake Book</a>' +
        '<a class="btn btn-soft" href="#practice/daily10">Today\'s 10</a>' +
        '</form></article>';
      return;
    }
    if (args[0] === "daily10") {
      STATE.currentPractice = {
        mode: "practice",
        filters: { class: STATE.profile.class },
        questions: todaysDaily10(),
        at: 0,
        answers: {},
        submitted: {},
        startedAt: Date.now()
      };
      return renderPracticeSession();
    }
    if (args[0] === "start") {
      var filters = {
        class: query.class || STATE.profile.class,
        subject: query.subject || "",
        chapter: query.chapter || "",
        topic: query.topic || "",
        difficulty: query.difficulty || "",
        type: query.type || ""
      };
      STATE.currentPractice = buildPracticeSession(filters, false);
      if (!STATE.currentPractice) {
        app.innerHTML = '<div class="card"><h2>We couldn\'t load this question set.</h2><p class="muted">Try broader filters.</p><a class="btn btn-soft" href="#practice">Try Again</a></div>';
        return;
      }
      return renderPracticeSession();
    }
  }

  function renderPracticeSession() {
    var s = STATE.currentPractice;
    if (!s || !s.questions.length) return;
    var q = s.questions[s.at];
    var picked = s.answers[s.at];
    var submitted = s.submitted[s.at];
    var isObjective = Array.isArray(q.options) && q.options.length;
    var answerUI = "";
    if (isObjective) {
      answerUI = '<div class="options">' + q.options.map(function (opt, i) {
        var cls = "option";
        if (submitted) {
          if (i === q.correctAnswer) cls += " correct";
          if (picked === i && i !== q.correctAnswer) cls += " wrong";
        }
        return '<label class="' + cls + '"><input type="radio" name="practice-option" value="' + i + '" ' + (picked === i ? "checked" : "") + " " + (submitted ? "disabled" : "") + '><span><strong>' + "ABCD"[i] + '.</strong> ' + esc(opt) + '</span></label>';
      }).join("") + "</div>";
    } else if (q.type === "numerical") {
      answerUI = '<label>Your answer<input id="numerical-answer" ' + (submitted ? "disabled" : "") + ' value="' + esc(picked || "") + '" placeholder="Type numeric answer"></label>';
    } else {
      answerUI = '<label>Your answer<textarea id="text-answer" rows="4" ' + (submitted ? "disabled" : "") + ' placeholder="Write your answer...">' + esc(picked || "") + '</textarea></label>';
    }
    app.innerHTML =
      '<h1 class="section-title">Practice Session</h1>' +
      '<article class="question-card">' +
      '<p class="small muted">' + esc(q.subject) + " · " + esc(q.chapter) + " · " + esc(q.topic) + "</p>" +
      '<h2>Question ' + (s.at + 1) + " of " + s.questions.length + "</h2>" +
      '<p>' + esc(q.question) + "</p>" + answerUI +
      '<div class="actions">' +
      (!submitted ? '<button class="btn btn-solid" data-action="submit-practice">Submit Answer</button>' : "") +
      (submitted ? '<button class="btn btn-soft" data-action="next-practice">' + (s.at === s.questions.length - 1 ? "Finish Session" : "Next Question") + '</button>' : "") +
      '<button class="btn btn-soft" data-action="exit-practice">Exit</button>' +
      "</div>" +
      (submitted ? '<div class="feedback"><strong>' + (s.submitted[s.at].correct ? "Correct ✓" : "Incorrect ✗") + '</strong><p>' + esc(q.explanation || "") + '</p>' + (q.solutionSteps ? "<ol>" + q.solutionSteps.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>" : "") + (q.finalAnswer ? "<p><strong>Final answer:</strong> " + esc(q.finalAnswer) + "</p>" : "") + "</div>" : "") +
      "</article>";
  }

  function finishPractice() {
    var s = STATE.currentPractice;
    var correct = Object.keys(s.submitted).filter(function (k) { return s.submitted[k].correct; }).length;
    var total = s.questions.length;
    var sec = Math.max(1, Math.round((Date.now() - s.startedAt) / 1000));
    var topicScores = {};
    s.questions.forEach(function (q, idx) {
      var k = q.topic;
      topicScores[k] = topicScores[k] || { total: 0, correct: 0 };
      topicScores[k].total++;
      if (s.submitted[idx] && s.submitted[idx].correct) topicScores[k].correct++;
    });
    var strong = [], weak = [];
    Object.keys(topicScores).forEach(function (t) {
      var acc = Math.round((topicScores[t].correct / topicScores[t].total) * 100);
      if (acc >= 75) strong.push(t); else weak.push(t);
    });
    STATE.currentPractice = null;
    app.innerHTML =
      '<article class="panel"><h1 class="section-title">Practice Complete 🎉</h1>' +
      '<p><strong>' + correct + " / " + total + '</strong> correct · Accuracy: ' + Math.round((correct / total) * 100) + "% · Time: " + Math.round(sec / 60) + " min</p>" +
      '<h2 style="margin-top:14px">Strong</h2><p>' + (strong.length ? strong.map(esc).join(", ") : "—") + '</p>' +
      '<h2 style="margin-top:10px">Needs work</h2><p>' + (weak.length ? weak.map(esc).join(", ") : "—") + '</p>' +
      '<div class="actions"><a class="btn btn-soft" href="#mistakes">Review Mistakes</a><a class="btn btn-soft" href="#practice">Practice Weak Topics</a><a class="btn btn-solid" href="#home">Back to Dashboard</a></div></article>';
  }

  function renderMistakes() {
    navActive("practice");
    var ids = Object.keys(STATE.mistakes);
    if (!ids.length) {
      app.innerHTML = '<article class="card"><h1 class="section-title">My Mistake Book</h1><p>🎉 No mistakes saved yet.</p><div class="actions"><a class="btn btn-solid" href="#practice">Start Practice</a></div></article>';
      return;
    }
    var rows = ids.map(function (id) {
      var q = getQuestionById(id);
      var m = STATE.mistakes[id];
      if (!q) return "";
      return '<article class="card"><h3>' + esc(q.subject) + " · " + esc(q.topic) + '</h3><p>' + esc(q.question) + '</p>' +
        '<p class="small muted">Mistakes: ' + m.count + " · Last: " + esc((m.lastSeen || "").slice(0, 10)) + '</p>' +
        '<div class="actions"><a class="btn btn-soft" href="#practice/start?class=' + q.class + "&subject=" + encodeURIComponent(q.subject) + "&chapter=" + encodeURIComponent(q.chapter) + "&topic=" + encodeURIComponent(q.topic) + '">Practice Similar</a><a class="btn btn-soft" href="#ai?subject=' + encodeURIComponent(q.subject) + "&chapter=" + encodeURIComponent(q.chapter) + "&topic=" + encodeURIComponent(q.topic) + '">Ask AI</a><button class="btn btn-solid" data-action="mark-mastered" data-id="' + esc(id) + '">Mark Mastered</button></div></article>';
    }).join("");
    app.innerHTML = '<h1 class="section-title">My Mistake Book</h1><p class="muted">' + ids.length + ' mistakes to review.</p><div class="grid cols-2">' + rows + "</div>";
  }

  function renderTests(args) {
    navActive("tests");
    if (!args || !args.length) {
      app.innerHTML =
        '<h1 class="section-title">Exam Mode</h1><p class="muted">Choose class, subject, chapter and timed question count.</p>' +
        '<article class="card"><form id="test-form" class="grid cols-3">' +
        '<label>Class<select name="class"><option value="' + STATE.profile.class + '">Class ' + STATE.profile.class + '</option><option value="11">Class 11</option><option value="12">Class 12</option></select></label>' +
        '<label>Subject<input name="subject" placeholder="Accountancy"></label>' +
        '<label>Chapter<input name="chapter" placeholder="Partnership"></label>' +
        '<label>Question count<select name="count"><option>10</option><option>15</option><option>20</option></select></label>' +
        '<button class="btn btn-solid" type="submit">Start Test</button>' +
        '</form></article>';
      return;
    }
    if (args[0] === "start") {
      var query = parseQuery(location.hash.split("?")[1] || "");
      var filters = { class: query.class || STATE.profile.class, subject: query.subject || "", chapter: query.chapter || "" };
      STATE.currentTest = buildPracticeSession(filters, true);
      if (!STATE.currentTest) {
        app.innerHTML = '<div class="card"><h2>Could not build test set.</h2><a class="btn btn-soft" href="#tests">Try Again</a></div>';
        return;
      }
      startTestTimer();
      return renderTestSession();
    }
  }

  function startTestTimer() {
    if (STATE.testTimerId) clearInterval(STATE.testTimerId);
    STATE.testTimerId = setInterval(function () {
      if (!STATE.currentTest) return clearInterval(STATE.testTimerId);
      STATE.currentTest.secLeft -= 1;
      if (STATE.currentTest.secLeft <= 0) {
        clearInterval(STATE.testTimerId);
        submitTest();
      } else {
        var timer = document.getElementById("test-timer");
        if (timer) timer.textContent = formatTime(STATE.currentTest.secLeft);
      }
    }, 1000);
  }
  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function renderTestSession() {
    var s = STATE.currentTest;
    if (!s) return;
    var q = s.questions[s.at];
    var picked = s.answers[s.at];
    app.innerHTML =
      '<h1 class="section-title">Timed Test</h1><p class="muted">Time remaining: <strong id="test-timer">' + formatTime(s.secLeft) + '</strong></p>' +
      '<article class="question-card"><p class="small muted">' + esc(q.subject) + " · " + esc(q.chapter) + '</p><h2>Question ' + (s.at + 1) + " / " + s.questions.length + "</h2><p>" + esc(q.question) + '</p>' +
      '<div class="options">' + (q.options || []).map(function (opt, i) {
        return '<label class="option"><input type="radio" name="test-option" value="' + i + '" ' + (picked === i ? "checked" : "") + '><span><strong>' + "ABCD"[i] + ".</strong> " + esc(opt) + "</span></label>";
      }).join("") + "</div>" +
      '<div class="actions"><button class="btn btn-soft" data-action="test-prev">Previous</button><button class="btn btn-soft" data-action="test-next">Next</button><button class="btn btn-solid" data-action="test-submit">Submit Test</button></div></article>';
  }

  function submitTest() {
    var s = STATE.currentTest;
    if (!s) return;
    clearInterval(STATE.testTimerId);
    var correct = 0;
    s.questions.forEach(function (q, i) {
      var ans = s.answers[i];
      var ok = ans === q.correctAnswer;
      if (ok) correct++;
      markAttempt(q, ok, ans, "test");
    });
    var total = s.questions.length;
    var topic = {};
    s.questions.forEach(function (q, i) {
      if (!topic[q.chapter]) topic[q.chapter] = { t: 0, c: 0 };
      topic[q.chapter].t++;
      if (s.answers[i] === q.correctAnswer) topic[q.chapter].c++;
    });
    var rows = Object.keys(topic).map(function (ch) {
      var pct = Math.round((topic[ch].c / topic[ch].t) * 100);
      return "<li>" + esc(ch) + " — " + pct + "%</li>";
    }).join("");
    STATE.currentTest = null;
    app.innerHTML =
      '<article class="panel"><h1 class="section-title">Test Complete</h1>' +
      '<p><strong>' + correct + " / " + total + '</strong> · Accuracy ' + Math.round((correct / total) * 100) + "%</p>" +
      '<h2 style="margin-top:10px">Topic performance</h2><ul>' + rows + '</ul>' +
      '<h2 style="margin-top:10px">Recommended next steps</h2><ul><li>Review low-scoring chapters</li><li>Review 3 mistakes</li><li>Take a 10-question quiz</li></ul>' +
      '<div class="actions"><a class="btn btn-soft" href="#mistakes">Review Mistakes</a><a class="btn btn-solid" href="#practice">Practice Weak Topics</a></div></article>';
  }

  function renderRevision() {
    navActive("revision");
    var cls = classSubjects(STATE.profile.class);
    var chapterItems = [];
    Object.keys(cls).forEach(function (k) { cls[k].chapters.forEach(function (c) { chapterItems.push(c); }); });
    var chips = chapterItems.slice(0, 6).map(function (c, i) {
      return '<article class="card"><h3>' + (i + 1) + ". " + esc(c.title) + '</h3><ol><li>Definition</li><li>Core method/formula</li><li>Worked idea</li><li>Common mistake</li><li>3 rapid questions</li></ol></article>';
    }).join("");
    var formulaRows = content.formulas.map(function (f) {
      return '<article class="list-item"><strong>' + esc(f.name) + '</strong><p class="small muted">' + esc(f.subject) + " · " + esc(f.chapter) + '</p><p><code>' + esc(f.formula) + '</code></p><p class="small">Example: ' + esc(f.example) + "</p></article>";
    }).join("");
    var defRows = content.definitions.map(function (d) {
      return '<article class="list-item"><strong>' + esc(d.term) + '</strong><p>' + esc(d.definition) + '</p><p class="small muted">Related: ' + d.related.map(esc).join(", ") + "</p></article>";
    }).join("");
    app.innerHTML =
      '<h1 class="section-title">Revision Center</h1><div class="actions"><span class="badge">5-Minute Revision</span><span class="badge">Chapter Revision</span><span class="badge">Weak Topics</span><span class="badge">Formula Revision</span></div>' +
      '<section class="grid cols-2" style="margin-top:12px">' + chips + '</section>' +
      '<h2 style="margin:16px 0 10px">Formula Bank</h2><div class="list">' + formulaRows + '</div>' +
      '<h2 style="margin:16px 0 10px">Definition Bank</h2><div class="list">' + defRows + "</div>";
  }

  function renderAI() {
    navActive("ai");
    var query = parseQuery(location.hash.split("?")[1] || "");
    var subject = query.subject || "";
    var chapter = query.chapter || "";
    var topic = query.topic || "";
    var contextLine = [subject, chapter, topic].filter(Boolean).join(" · ");
    app.innerHTML =
      '<h1 class="section-title">AI Study Assistant</h1>' +
      '<p class="muted">Specialized actions: Explain, Solve, Teach Me, Quiz Me, Check My Answer, Give Hint, Simplify.</p>' +
      (contextLine ? '<p class="badge">Context: Class ' + STATE.profile.class + " · " + esc(contextLine) + "</p>" : "") +
      '<article class="card"><h3>Generate context-aware prompt</h3><label>Action<select id="ai-action"><option>Explain</option><option>Solve</option><option>Teach Me</option><option>Quiz Me</option><option>Check My Answer</option><option>Give Hint</option><option>Simplify</option></select></label><label>Question / answer<input id="ai-input" placeholder="Paste your question or your answer"></label><div class="actions"><button class="btn btn-solid" data-action="build-ai-prompt">Build prompt</button></div><pre id="ai-prompt-out" class="list-item">AI not connected. Configure your own backend endpoint if needed.</pre></article>';
  }

  function renderProgress() {
    navActive("progress");
    var ov = calcOverview();
    var sub = subjectStats();
    var subRows = Object.keys(sub).map(function (name) {
      var pct = Math.round((sub[name].correct / sub[name].total) * 100);
      return '<article class="list-item"><strong>' + esc(name) + '</strong><p class="small muted">' + sub[name].total + " attempts</p><div class=\"progress\"><i style=\"width:" + pct + '%"></i></div><p class="small">' + pct + "%</p></article>";
    }).join("");
    var topicStats = computeTopicStats();
    var weak = Object.keys(topicStats).filter(function (k) {
      var t = topicStats[k];
      var pct = Math.round((t.correct / t.total) * 100);
      return t.total >= 3 && pct < 60;
    }).map(function (k) {
      var t = topicStats[k];
      var pct = Math.round((t.correct / t.total) * 100);
      return "<li>" + esc(t.topic) + " · " + pct + "% accuracy · " + t.total + " questions</li>";
    }).join("");
    app.innerHTML =
      '<h1 class="section-title">My Progress</h1><section class="kpis"><article class="card"><div class="kpi">' + ov.total + '</div><div class="small muted">Questions solved</div></article><article class="card"><div class="kpi">' + ov.accuracy + '%</div><div class="small muted">Accuracy</div></article><article class="card"><div class="kpi">' + ov.tests + '</div><div class="small muted">Tests</div></article><article class="card"><div class="kpi">' + ov.mistakes + '</div><div class="small muted">Mistakes</div></article></section>' +
      '<h2 style="margin:16px 0 10px">Subject performance</h2><div class="grid cols-2">' + (subRows || '<article class="card">Your progress will appear after your first practice session.</article>') + '</div>' +
      '<h2 style="margin:16px 0 8px">Weak topics</h2><article class="card"><p class="muted">Based on your recent practice.</p><ul>' + (weak || "<li>No weak topics detected yet.</li>") + '</ul></article>';
  }

  function renderProfile() {
    navActive("profile");
    app.innerHTML =
      '<h1 class="section-title">Profile</h1>' +
      '<article class="card"><form id="profile-form" class="grid cols-2">' +
      '<label>Name<input name="name" value="' + esc(STATE.profile.name || "") + '"></label>' +
      '<label>Class<select name="class"><option value="11"' + (STATE.profile.class === 11 ? " selected" : "") + '>Class 11</option><option value="12"' + (STATE.profile.class === 12 ? " selected" : "") + '>Class 12</option></select></label>' +
      '<label>Exam date<input type="date" name="examDate" value="' + esc(STATE.profile.examDate || "") + '"></label>' +
      '<label>Daily target (minutes)<input type="number" name="dailyTarget" min="10" max="300" value="' + esc(STATE.profile.dailyTarget || 30) + '"></label>' +
      '<label style="grid-column:1/-1">Subjects (comma separated)<input name="subjects" value="' + esc((STATE.profile.subjects || []).join(", ")) + '"></label>' +
      '<div class="actions" style="grid-column:1/-1"><button class="btn btn-solid" type="submit">Save profile</button><button class="btn btn-soft" type="button" data-action="reset-progress">Reset progress</button></div>' +
      "</form></article>" +
      '<article class="card"><h2>Settings</h2><p class="muted">Theme, local progress, and preference data are saved on this device.</p></article>';
  }

  function renderSearchResults(items) {
    var existing = document.getElementById("search-results");
    if (existing) existing.remove();
    if (!items.length) return;
    var box = document.createElement("div");
    box.id = "search-results";
    box.className = "search-results";
    box.innerHTML = items.slice(0, 8).map(function (item) {
      return '<a class="search-link" href="' + item.href + '"><strong>' + esc(item.title) + '</strong><br><span class="small muted">' + esc(item.meta) + "</span></a>";
    }).join("");
    searchInput.parentElement.appendChild(box);
  }

  function globalSearch(text) {
    var q = text.trim().toLowerCase();
    if (!q) return renderSearchResults([]);
    var list = [];
    Object.keys(content.classes).forEach(function (grade) {
      var subs = content.classes[grade];
      Object.keys(subs).forEach(function (k) {
        var s = subs[k];
        if (s.name.toLowerCase().indexOf(q) !== -1) list.push({ title: s.name, meta: "Class " + grade + " subject", href: "#study/" + k });
        s.chapters.forEach(function (c) {
          if (c.title.toLowerCase().indexOf(q) !== -1) list.push({ title: c.title, meta: s.name + " · Class " + grade, href: "#study/" + k + "/" + c.id });
          c.topics.forEach(function (t) {
            if (t.title.toLowerCase().indexOf(q) !== -1) list.push({ title: t.title, meta: s.name + " · " + c.title, href: "#study/" + k + "/" + c.id + "/" + t.id });
          });
        });
      });
    });
    content.formulas.forEach(function (f) {
      if ((f.name + " " + f.topic).toLowerCase().indexOf(q) !== -1) list.push({ title: f.name, meta: "Formula · " + f.subject, href: "#revision" });
    });
    content.questions.forEach(function (qItem) {
      if (qItem.question.toLowerCase().indexOf(q) !== -1) list.push({ title: qItem.chapter + " question", meta: qItem.subject + " · " + qItem.topic, href: "#practice/start?class=" + qItem.class + "&subject=" + encodeURIComponent(qItem.subject) + "&chapter=" + encodeURIComponent(qItem.chapter) + "&topic=" + encodeURIComponent(qItem.topic) });
    });
    renderSearchResults(list);
  }

  function route() {
    STATE.route = getBaseRoute(location.hash);
    var page = STATE.route.page;
    var args = STATE.route.args || [];
    if (page === "home") return renderHome();
    if (page === "study") return renderStudy(args);
    if (page === "practice") return renderPractice(args);
    if (page === "mistakes") return renderMistakes();
    if (page === "tests") return renderTests(args);
    if (page === "revision") return renderRevision();
    if (page === "ai") return renderAI();
    if (page === "progress") return renderProgress();
    if (page === "profile") return renderProfile();
    renderHome();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    if (action === "set-class") {
      STATE.profile.class = Number(btn.getAttribute("data-value"));
      saveJSON(LS.profile, STATE.profile);
      route();
    }
    if (action === "complete-topic") {
      STATE.completedTopics[btn.getAttribute("data-id")] = true;
      saveJSON(LS.completed, STATE.completedTopics);
      btn.textContent = "Completed ✓";
      btn.disabled = true;
    }
    if (action === "submit-practice") {
      var s = STATE.currentPractice; if (!s) return;
      var q = s.questions[s.at];
      var userAnswer = null;
      if (q.options && q.options.length) {
        var picked = app.querySelector('input[name="practice-option"]:checked');
        if (!picked) return;
        userAnswer = Number(picked.value);
      } else if (q.type === "numerical") {
        var val = document.getElementById("numerical-answer");
        userAnswer = val ? String(val.value || "").trim() : "";
      } else {
        var txt = document.getElementById("text-answer");
        userAnswer = txt ? String(txt.value || "").trim() : "";
      }
      var isCorrect;
      if (typeof q.correctAnswer === "number") isCorrect = userAnswer === q.correctAnswer;
      else if (typeof q.correctAnswer === "string") isCorrect = String(userAnswer).replace(/[^\d.]/g, "") === q.correctAnswer.replace(/[^\d.]/g, "");
      else isCorrect = userAnswer.length > 0;
      s.answers[s.at] = userAnswer;
      s.submitted[s.at] = { correct: isCorrect };
      markAttempt(q, isCorrect, userAnswer, "practice");
      renderPracticeSession();
    }
    if (action === "next-practice") {
      var p = STATE.currentPractice; if (!p) return;
      if (p.at >= p.questions.length - 1) finishPractice(); else { p.at++; renderPracticeSession(); }
    }
    if (action === "exit-practice") {
      STATE.currentPractice = null; location.hash = "#practice";
    }
    if (action === "mark-mastered") {
      delete STATE.mistakes[btn.getAttribute("data-id")];
      saveJSON(LS.mistakes, STATE.mistakes);
      renderMistakes();
    }
    if (action === "test-next" || action === "test-prev") {
      var t = STATE.currentTest; if (!t) return;
      var pick = app.querySelector('input[name="test-option"]:checked');
      if (pick) t.answers[t.at] = Number(pick.value);
      t.at = Math.max(0, Math.min(t.questions.length - 1, t.at + (action === "test-next" ? 1 : -1)));
      renderTestSession();
    }
    if (action === "test-submit") {
      if (confirm("Submit test now?")) {
        var pt = app.querySelector('input[name="test-option"]:checked');
        if (pt) STATE.currentTest.answers[STATE.currentTest.at] = Number(pt.value);
        submitTest();
      }
    }
    if (action === "build-ai-prompt") {
      var aiAction = document.getElementById("ai-action").value;
      var aiInput = document.getElementById("ai-input").value.trim();
      var meta = parseQuery(location.hash.split("?")[1] || "");
      var prompt = "Class: " + STATE.profile.class + "\nSubject: " + (meta.subject || "N/A") + "\nChapter: " + (meta.chapter || "N/A") + "\nTopic: " + (meta.topic || "N/A") + "\nAction: " + aiAction + "\nStudent Input: " + aiInput + "\nPlease explain in simple steps, include exam tip, and one practice question.";
      document.getElementById("ai-prompt-out").textContent = prompt;
    }
    if (action === "reset-progress") {
      if (!confirm("Reset all local progress data?")) return;
      [LS.attempts, LS.mistakes, LS.completed, LS.daily].forEach(function (k) { localStorage.removeItem(k); });
      STATE.attempts = [];
      STATE.mistakes = {};
      STATE.completedTopics = {};
      route();
    }
  });

  document.addEventListener("submit", function (e) {
    if (e.target.id === "practice-form") {
      e.preventDefault();
      var f = new FormData(e.target);
      location.hash = "#practice/start?class=" + encodeURIComponent(f.get("class")) +
        "&subject=" + encodeURIComponent(f.get("subject")) +
        "&chapter=" + encodeURIComponent(f.get("chapter")) +
        "&topic=" + encodeURIComponent(f.get("topic")) +
        "&difficulty=" + encodeURIComponent(f.get("difficulty")) +
        "&type=" + encodeURIComponent(f.get("type"));
    }
    if (e.target.id === "test-form") {
      e.preventDefault();
      var ft = new FormData(e.target);
      location.hash = "#tests/start?class=" + encodeURIComponent(ft.get("class")) +
        "&subject=" + encodeURIComponent(ft.get("subject")) +
        "&chapter=" + encodeURIComponent(ft.get("chapter")) +
        "&count=" + encodeURIComponent(ft.get("count"));
    }
    if (e.target.id === "profile-form") {
      e.preventDefault();
      var fp = new FormData(e.target);
      STATE.profile = {
        name: String(fp.get("name") || "Student"),
        class: Number(fp.get("class") || 12),
        examDate: String(fp.get("examDate") || ""),
        dailyTarget: Number(fp.get("dailyTarget") || 30),
        subjects: String(fp.get("subjects") || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean)
      };
      saveJSON(LS.profile, STATE.profile);
      location.hash = "#home";
    }
  });

  searchInput.addEventListener("input", function () {
    globalSearch(searchInput.value);
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-wrap")) {
      var ex = document.getElementById("search-results");
      if (ex) ex.remove();
    }
  });

  themeToggle.addEventListener("click", function () {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });
  window.addEventListener("hashchange", route);

  applyTheme();
  route();
})();
