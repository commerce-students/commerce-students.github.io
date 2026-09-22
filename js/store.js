const PREFIX = "cs:v2:";
const KEYS = {
  profile: PREFIX+"profile",
  progress: PREFIX+"progress",
  mistakes: PREFIX+"mistakes",
  checklist: PREFIX+"checklist",
  streak: PREFIX+"streak",
  studyPlan: PREFIX+"studyPlan",
  theme: PREFIX+"theme",
  daily10: PREFIX+"daily10",
  bookmarks: PREFIX+"bookmarks",
  apiKey: PREFIX+"apiKey",
};

function load(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{ return fallback; }
}
function save(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch{}
}

// Profile
export function getProfile(){
  return load(KEYS.profile, { name:"", class:12, examDate:"", dailyTarget:10, subjects:[] });
}
export function setProfile(p){ save(KEYS.profile, p); }

// Attempts & Progress
export function getProgress(){
  return load(KEYS.progress, { attempts:[], topicStats:{}, chapterStats:{}, timeSpent:0, tests:[] });
}
export function recordAttempt({questionId, correct, time, chapter, topic, subject, class:cls}){
  const prog = getProgress();
  const now = new Date().toISOString();
  prog.attempts.push({questionId, correct, time: time||60, date: now, chapter, topic, subject, class:cls});
  // update topic stats
  const key = `${subject}|${chapter}|${topic}`;
  if(!prog.topicStats[key]) prog.topicStats[key] = {attempts:0, correct:0};
  prog.topicStats[key].attempts +=1;
  if(correct) prog.topicStats[key].correct +=1;
  // chapter stats
  const ckey = `${subject}|${chapter}`;
  if(!prog.chapterStats[ckey]) prog.chapterStats[ckey] = {attempts:0, correct:0};
  prog.chapterStats[ckey].attempts+=1;
  if(correct) prog.chapterStats[ckey].correct+=1;
  prog.timeSpent += time||60;
  if(prog.attempts.length>2000) prog.attempts = prog.attempts.slice(-2000);
  save(KEYS.progress, prog);
  updateStreak();
  return prog;
}
export function addTestResult(result){
  const prog = getProgress();
  prog.tests.push({...result, date:new Date().toISOString()});
  save(KEYS.progress, prog);
}
export function getTopicStatus(key){
  const stats = getProgress().topicStats[key];
  if(!stats || stats.attempts<5) return {label:"Not enough data", level:"not", accuracy: stats? Math.round(stats.correct/stats.attempts*100):0, attempts: stats?.attempts||0};
  const acc = stats.correct / stats.attempts;
  if(acc>=0.75) return {label:"Strong", level:"strong", accuracy:Math.round(acc*100), attempts:stats.attempts};
  if(acc>=0.5) return {label:"Improving", level:"improving", accuracy:Math.round(acc*100), attempts:stats.attempts};
  return {label:"Needs Revision", level:"needs", accuracy:Math.round(acc*100), attempts:stats.attempts};
}
export function getChapterProgress(subject, chapter){
  const stats = getProgress().chapterStats[`${subject}|${chapter}`];
  if(!stats) return {attempts:0, accuracy:0};
  return {attempts:stats.attempts, accuracy: Math.round(stats.correct/stats.attempts*100)};
}
export function getOverallStats(){
  const prog = getProgress();
  const total = prog.attempts.length;
  const correct = prog.attempts.filter(a=>a.correct).length;
  return {
    total,
    correct,
    accuracy: total? Math.round(correct/total*100):0,
    timeSpent: prog.timeSpent,
    tests: prog.tests.length
  };
}
export function getWeakTopics(limit=5){
  const prog = getProgress();
  const entries = Object.entries(prog.topicStats)
    .filter(([,v])=>v.attempts>=3)
    .map(([k,v])=>({
      key:k,
      subject:k.split('|')[0],
      chapter:k.split('|')[1],
      topic:k.split('|')[2],
      attempts:v.attempts,
      correct:v.correct,
      accuracy: Math.round(v.correct/v.attempts*100)
    }))
    .sort((a,b)=> a.accuracy - b.accuracy);
  return entries.slice(0, limit);
}
export function getStrongTopics(limit=5){
  const prog = getProgress();
  return Object.entries(prog.topicStats)
    .filter(([,v])=>v.attempts>=5 && v.correct/v.attempts>=0.75)
    .map(([k,v])=>({key:k, accuracy:Math.round(v.correct/v.attempts*100), attempts:v.attempts, ...Object.fromEntries([['subject',k.split('|')[0]],['chapter',k.split('|')[1]],['topic',k.split('|')[2]]])}))
    .slice(0,limit);
}

// Mistakes
export function getMistakes(){
  return load(KEYS.mistakes, {});
}
export function addMistake(q, userAnswer){
  const m = getMistakes();
  const entry = m[q.id] || {question:q, attempts:0, lastDate:null, mastered:false, userAnswers:[]};
  entry.attempts +=1;
  entry.lastDate = new Date().toISOString();
  entry.mastered = false;
  entry.userAnswers.push({answer:userAnswer, date: entry.lastDate});
  entry.question = q;
  entry.correctAnswer = q.correct;
  m[q.id]=entry;
  save(KEYS.mistakes, m);
}
export function markMastered(id, mastered=true){
  const m=getMistakes();
  if(m[id]){ m[id].mastered = mastered; save(KEYS.mistakes,m);}
}
export function removeMistake(id){
  const m=getMistakes();
  delete m[id];
  save(KEYS.mistakes,m);
}
export function getMistakeList(){
  const m=getMistakes();
  return Object.entries(m).filter(([,v])=>!v.mastered).map(([id,v])=>({id,...v})).sort((a,b)=> new Date(b.lastDate)-new Date(a.lastDate));
}

// Checklist
export function getChecklist(){ return load(KEYS.checklist, {}); }
export function toggleCheck(key){
  const c=getChecklist();
  c[key]=!c[key];
  save(KEYS.checklist,c);
  return c[key];
}
export function setCheck(key,val){
  const c=getChecklist();
  c[key]=val;
  save(KEYS.checklist,c);
}
export function isChecked(key){ return !!getChecklist()[key]; }
export function getCheckedCount(prefix){
  const c=getChecklist();
  return Object.keys(c).filter(k=>k.startsWith(prefix) && c[k]).length;
}

// Streak
export function updateStreak(){
  const s=load(KEYS.streak,{dates:[]});
  const today=new Date().toISOString().slice(0,10);
  if(!s.dates.includes(today)){
    s.dates.push(today);
    s.dates.sort();
    if(s.dates.length>365) s.dates=s.dates.slice(-365);
    save(KEYS.streak,s);
  }
  return s;
}
export function getStreak(){
  const s=load(KEYS.streak,{dates:[]});
  if(!s.dates.length) return {count:0, dates:[]};
  // count consecutive days ending today
  s.dates.sort();
  let count=0;
  let d=new Date();
  for(let i=0;i<365;i++){
    const ds=d.toISOString().slice(0,10);
    if(s.dates.includes(ds)) count++;
    else break;
    d.setDate(d.getDate()-1);
  }
  return {count, dates:s.dates};
}

// Study plan & bookmarks
export function getStudyPlan(){ return load(KEYS.studyPlan, null); }
export function setStudyPlan(p){ save(KEYS.studyPlan,p); }
export function getBookmarks(){ return load(KEYS.bookmarks, {}); }
export function toggleBookmark(id){
  const b=getBookmarks();
  b[id]=!b[id];
  if(!b[id]) delete b[id];
  save(KEYS.bookmarks,b);
  return !!b[id];
}

// Theme
export function getTheme(){ return load(KEYS.theme, null); }
export function setTheme(t){ save(KEYS.theme,t); document.documentElement.setAttribute("data-theme",t); }

// Daily 10 cache
export function getDaily10(){
  const d=load(KEYS.daily10,null);
  const today=new Date().toISOString().slice(0,10);
  if(d && d.date===today) return d;
  return null;
}
export function setDaily10(data){
  save(KEYS.daily10,{...data, date:new Date().toISOString().slice(0,10)});
}

// API Key (for Gemini / Pollinations) - stored locally only, never committed
export function getApiKey(){ try{ const raw=localStorage.getItem(KEYS.apiKey); return raw? JSON.parse(raw):"" }catch{ return "" } }
export function setApiKey(k){ try{ localStorage.setItem(KEYS.apiKey, JSON.stringify(k||"")); }catch{} }
export function clearApiKey(){ try{ localStorage.removeItem(KEYS.apiKey); }catch{} }

export const STORAGE_KEYS = KEYS;
