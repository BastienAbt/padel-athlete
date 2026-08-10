
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const storeKey = "padelAthleteStateV1";
const defaultState = {padelDay:2, events:{}, completed:{}, metrics:[], readiness:[], special:[], trainingLog:[], exerciseDefaults:{}, skillGoals:{pullup:10,lsit:30,handstand:30,pistol:5}, reminders:{workout:false,test:false}, journal:[], adaptivePlans:{}, exerciseProgress:{}, pathwayState:{pullup:0,pushup:0,dip:0}, retest:{last:null,next:null}};
let state = JSON.parse(localStorage.getItem(storeKey) || "null") || structuredClone(defaultState);
state.trainingLog ||= []; state.exerciseDefaults ||= {}; state.skillGoals ||= structuredClone(defaultState.skillGoals); state.reminders ||= structuredClone(defaultState.reminders); state.journal ||= []; state.adaptivePlans ||= {}; state.exerciseProgress ||= {}; state.pathwayState ||= {pullup:0,pushup:0,dip:0}; state.retest ||= {last:null,next:null};
let currentMonth = new Date();
let selectedDate = fmtDate(new Date());

function save(){localStorage.setItem(storeKey,JSON.stringify(state));renderAll()}
function fmtDate(d){const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`}
function parseDate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function addDays(date,n){let d=new Date(date);d.setDate(d.getDate()+n);return d}
function mondayOf(date){let d=new Date(date);let day=d.getDay()||7;d.setDate(d.getDate()-day+1);d.setHours(0,0,0,0);return d}
function frDate(s){return parseDate(s).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
function workoutById(id){return APP_DATA.workouts.find(w=>w.id===id)}
function exById(id){return APP_DATA.exercises.find(e=>e.id===id)}

function buildNormalWeek(baseDate=new Date()){
  const mon=mondayOf(baseDate), pd=+state.padelDay;
  const mapping = pd===2 ? {0:"A",3:"B",5:"C"} : {0:"A",2:"B",6:"C"};
  Object.entries(mapping).forEach(([offset,wid])=>{
    const ds=fmtDate(addDays(mon,+offset));
    if(!state.events[ds]) state.events[ds]=[{type:"workout",id:wid}];
  });
  const padelDate=fmtDate(addDays(mon,pd-1));
  if(!state.events[padelDate]) state.events[padelDate]=[{type:"padel",label:"Cours de padel · 1 h 30"}];
}
function initWeeks(){
  for(let i=-2;i<10;i++) buildNormalWeek(addDays(new Date(),i*7));
  // Seed a configurable intensive week approximately two weeks from 2026-08-08 only if empty.
  if(state.special.length===0){
    const start="2026-08-22";
    state.special.push({start,type:"ucpa"});
    applySpecial({start,type:"ucpa"},false);
  }
  localStorage.setItem(storeKey,JSON.stringify(state));
}
function applySpecial(sp,doSave=true){
  const start=parseDate(sp.start);
  if(sp.type==="ucpa"){
    for(let i=0;i<7;i++){
      const ds=fmtDate(addDays(start,i));
      state.events[ds]=[{type:"special",label:"Stage UCPA — récupération / mobilité uniquement"}];
    }
  } else if(sp.type==="tournament"){
    const ds=fmtDate(start);
    state.events[ds]=[{type:"tournament",label:"Tournoi de padel"}];
    const prev=fmtDate(addDays(start,-1));state.events[prev]=[{type:"workout",id:"R"}];
  } else {
    for(let i=0;i<7;i++){
      const ds=fmtDate(addDays(start,i));
      if(state.events[ds]?.some(e=>e.type==="workout")) state.events[ds]=state.events[ds].map(e=>e.type==="workout"?{...e,deload:true}:e);
    }
  }
  if(doSave) save();
}
initWeeks();


function daysBetween(a,b){return Math.round((parseDate(b)-parseDate(a))/86400000)}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function latestReadiness(){return state.readiness.length?state.readiness[state.readiness.length-1]:null}
function recentTraining(days=7){const now=new Date();return state.trainingLog.filter(l=>(now-parseDate(l.date))/86400000<=days)}
function sessionLoad(log){let total=0;(log.exercises||[]).forEach(ex=>{const sets=(ex.sets||[]).filter(s=>s.done).length;total+=sets*(ex.rpe||3)*10});return Math.round(total)}
function weeklyLoad(days=7){return recentTraining(days).reduce((a,l)=>a+sessionLoad(l),0)}
function painBurden(){const recent=state.journal.filter(j=>(new Date()-parseDate(j.date))/86400000<=14);let vals=[];recent.forEach(j=>["elbow","shoulder","knee","heel","back"].forEach(k=>vals.push(+j[k]||0)));const r=latestReadiness();if(r)vals.push(+r.elbow||0,+r.heel||0);return vals.length?Math.max(...vals):0}
function recoveryScoreCalc(){const r=latestReadiness();if(!r)return 70;return clamp(Math.round(100-((+r.fatigue||3)-1)*14-Math.max(+r.elbow||0,+r.heel||0)*6),0,100)}
function readinessScoreCalc(){let s=recoveryScoreCalc(),load7=weeklyLoad(7),load28=Math.max(weeklyLoad(28)/4,1),ratio=load7/load28;if(ratio>1.5)s-=15;else if(ratio>1.25)s-=8;const p=painBurden();if(p>=5)s-=20;else if(p>=3)s-=10;return clamp(Math.round(s),0,100)}
function trendAnalysis(){const alerts=[],load7=weeklyLoad(7),prev=Math.max((weeklyLoad(28)-load7)/3,1),p=painBurden();if(load7>prev*1.5&&load7>150)alerts.push({level:"warn",title:"Hausse rapide de charge",text:"La charge interne des 7 derniers jours est nettement supérieure aux semaines précédentes. Évite d'augmenter simultanément volume et intensité."});if(p>=5)alerts.push({level:"danger",title:"Douleur significative",text:"Une douleur récente atteint au moins 5/10. Réduire ou remplacer les exercices qui la reproduisent est préférable jusqu'à amélioration."});else if(p>=3)alerts.push({level:"warn",title:"Signal douloureux",text:"Une douleur récente atteint au moins 3/10. Progression conservatrice recommandée."});if(!alerts.length)alerts.push({level:"",title:"Évolution cohérente",text:"Aucun signal fort de surcharge ou de douleur n'est détecté actuellement."});return alerts.slice(0,4)}
function getNextTournament(){const today=fmtDate(new Date());const dates=Object.entries(state.events).filter(([d,ev])=>d>=today&&ev.some(e=>e.type==="tournament")).map(([d])=>d).sort();return dates[0]||null}
function renderAthleticDashboard(){const load7=weeklyLoad(7),rec=recoveryScoreCalc(),pain=painBurden(),ready=readinessScoreCalc();if($("#load7"))$("#load7").textContent=load7;if($("#load7Trend"))$("#load7Trend").textContent=load7<150?"faible":load7<300?"modérée":"élevée";if($("#recoveryScore"))$("#recoveryScore").textContent=rec+"/100";if($("#recoveryLabel"))$("#recoveryLabel").textContent=rec>=80?"bonne":rec>=60?"correcte":"à surveiller";if($("#painScore"))$("#painScore").textContent=pain+"/10";if($("#painLabel"))$("#painLabel").textContent=pain<3?"faible":pain<5?"modérée":"élevée";if($("#readinessScore"))$("#readinessScore").textContent=ready+"/100";if($("#readinessLabel"))$("#readinessLabel").textContent=ready>=80?"prêt":ready>=60?"acceptable":"alléger";if($("#trendAlerts"))$("#trendAlerts").innerHTML=trendAnalysis().map(a=>`<div class="alert ${a.level||""}"><strong>${a.title}</strong><div class="adapt-meta">${a.text}</div></div>`).join("")}
function ensureRetestPlan(){if(!state.retest.next){const base=state.retest.last?parseDate(state.retest.last):new Date();state.retest.next=fmtDate(addDays(base,56))}}
function renderRetest(){ensureRetestPlan();const days=daysBetween(fmtDate(new Date()),state.retest.next);if($("#retestBadge"))$("#retestBadge").textContent=days<=0?"À faire maintenant":days+" j";const items=[["Poids + tour de taille","conditions similaires"],["FC de repos","avant café / effort"],["Détente verticale","3 essais"],["Sprint 5 m","3 essais"],["Grip D/G","3 essais/main"],["Dorsiflexion D/G","genou-au-mur"],["Parcours traction","niveau + qualité"],["L-sit / handstand","maintien propre"]];if($("#retestChecklist"))$("#retestChecklist").innerHTML=items.map(([a,b])=>`<div class="test-row"><span>${a}</span><span>${b}</span></div>`).join("")}
function periodizationWeeks(){const start=mondayOf(new Date()),tournament=getNextTournament(),weeks=[];for(let i=0;i<8;i++){const ws=addDays(start,i*7),we=addDays(ws,6);const tour=tournament&&parseDate(tournament)>=ws&&parseDate(tournament)<=we;let focus="Base technique + force",volume="Progressif";if(tour){focus="Affûtage + tournoi";volume="60–70 %"}else if(i===3){focus="Consolidation / allègement relatif";volume="75–80 %"}else if(i===7){focus="Re-test + semaine légère";volume="60–70 %"}else if(i>=4){focus="Force → puissance + skills";volume="Progressif"}weeks.push({ws,we,focus,volume,tour})}return weeks}
function renderPeriodization(){const el=$("#periodizationPlan");if(!el)return;el.innerHTML=periodizationWeeks().map((w,i)=>`<div class="period-week"><div class="period-top"><strong>Semaine ${i+1}</strong><span class="badge ${w.tour?"accent":""}">${w.volume}</span></div><div class="period-focus">${w.ws.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} – ${w.we.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} · ${w.focus}</div></div>`).join("")}

function renderHome(){
  const mon=mondayOf(new Date()), end=addDays(mon,6);
  $("#weekTitle").textContent=`${mon.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} – ${end.toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`;
  let planned=0, done=0;
  for(let i=0;i<7;i++){const ds=fmtDate(addDays(mon,i)); (state.events[ds]||[]).forEach(e=>{if(e.type==="workout"){planned++;if(state.completed[`${ds}-${e.id}`])done++}})}
  const pct=planned?Math.round(done/planned*100):0;$("#completionText").textContent=pct+"%";$("#completionRing").style.setProperty("--p",pct);
  $("#weekSummary").textContent=`${planned} séances physiques planifiées · ${done} terminée${done>1?"s":""}`;
  let found=null;
  for(let i=0;i<21 && !found;i++){const ds=fmtDate(addDays(new Date(),i));const e=(state.events[ds]||[]).find(x=>x.type==="workout");if(e)found={ds,e}}
  $("#nextWorkoutCard").innerHTML=found?workoutCard(found.e.id,found.ds):`<div class="card muted">Aucune séance planifiée.</div>`;
  const latest=state.metrics[state.metrics.length-1]||{};
  const cards=[["Poids",latest.weight?latest.weight+" kg":"—"],["Tour de taille",latest.waist?latest.waist+" cm":"—"],["Tractions",latest.pullups??"—"],["Détente",latest.jump?latest.jump+" cm":"—"]];
  $("#quickMetrics").innerHTML=cards.map(([l,v])=>`<div class="metric-card"><div class="metric-value">${v}</div><div class="metric-label">${l}</div></div>`).join("");
}
function workoutCard(id,ds){
  const w=workoutById(id);return `<div class="card workout-card" onclick="openWorkout('${id}','${ds||""}')"><div><div class="eyebrow">${w.location.toUpperCase()}</div><h3>${w.name}</h3><div class="meta">${ds?frDate(ds)+" · ":""}${w.duration}</div><div>${w.tags.map(t=>`<span class="badge">${t}</span>`).join("")}</div></div><div>›</div></div>`
}
function renderWorkouts(){$("#workoutList").innerHTML=APP_DATA.workouts.filter(w=>w.id!=="R").map(w=>workoutCard(w.id,"")).join("")}

function renderCalendar(){
  $("#monthLabel").textContent=currentMonth.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
  const first=new Date(currentMonth.getFullYear(),currentMonth.getMonth(),1);
  const start=mondayOf(first); let html="";
  for(let i=0;i<42;i++){
    const d=addDays(start,i), ds=fmtDate(d), other=d.getMonth()!==currentMonth.getMonth();
    const ev=state.events[ds]||[];const has=ev.length>0, special=ev.some(e=>["special","tournament"].includes(e.type));
    html+=`<button class="day ${other?"other":""} ${ds===fmtDate(new Date())?"today":""} ${ds===selectedDate?"selected":""}" onclick="selectDate('${ds}')"><span>${d.getDate()}</span>${has?`<span class="dot ${special?"special":""}"></span>`:""}</button>`
  }
  $("#calendarGrid").innerHTML=html;renderSelectedDay();
}
function selectDate(ds){selectedDate=ds;renderCalendar()}
function renderSelectedDay(){
  const ev=state.events[selectedDate]||[];
  const cards=ev.map(e=>{
    if(e.type==="workout") return workoutCard(e.id,selectedDate);
    return `<div class="card"><span class="badge ${e.type==="padel"?"accent":""}">${e.type==="padel"?"PADEL":e.type==="tournament"?"TOURNOI":"SPÉCIAL"}</span><h3>${e.label}</h3></div>`;
  }).join("");
  $("#selectedDayPanel").innerHTML=`<div class="section-header"><h2>${frDate(selectedDate)}</h2></div>${cards||`<div class="card muted">Journée libre / récupération.</div>`}<div class="card compact"><label>Ajouter / remplacer<select id="dayAction"><option value="">Choisir…</option><option value="A">Séance A — jambes</option><option value="B">Séance B — haut du corps</option><option value="C">Séance C — maison</option><option value="padel">Padel</option><option value="rest">Repos</option></select></label><button class="secondary" onclick="applyDayAction()">Appliquer</button></div>`;
}
function applyDayAction(){
  const v=$("#dayAction").value;if(!v)return;
  if(v==="rest") state.events[selectedDate]=[];
  else if(v==="padel") state.events[selectedDate]=[{type:"padel",label:"Padel"}];
  else state.events[selectedDate]=[{type:"workout",id:v}];
  save();
}
function openWorkout(id,ds){
  const w=workoutById(id);const key=ds?`${ds}-${id}`:"";
  $("#workoutDetail").innerHTML=`<div class="eyebrow">${w.location.toUpperCase()}</div><h2>${w.name}</h2><p class="muted">${w.duration}</p>
  <button class="primary" style="width:100%;margin:8px 0 14px" onclick="startSession('${id}','${ds||fmtDate(new Date())}')">▶ Démarrer la séance</button>
  ${w.exercises.map(([eid,dose,note],idx)=>{const e=exById(eid);const last=getLastExerciseLog(eid);return `<div class="exercise-session"><div class="exercise-session-header"><div><strong>${idx+1}. ${e.name}</strong><div class="muted">${dose} · ${note}</div>${last?`<div class="exercise-history-mini">Dernière fois : ${formatLastLog(last)}</div>`:""}</div><button class="link-button" onclick="openExercise('${eid}')">Voir</button></div></div>`}).join("")}${ds?`<button class="secondary" style="width:100%;margin-top:16px" onclick="toggleComplete('${key}')">${state.completed[key]?"✓ Séance terminée":"Marquer comme terminée sans guidage"}</button>`:""}`;
  $("#workoutDialog").showModal();
}
function toggleComplete(key){state.completed[key]=!state.completed[key];save();$("#workoutDialog").close()}
function openExercise(id){
  const e=exById(id), last=getLastExerciseLog(id);
  $("#exerciseDetail").innerHTML=`<div class="eyebrow">${e.cat.toUpperCase()}</div><h2>${e.name}</h2><p>${e.goal}</p>
  <div class="exercise-demo"><div class="figure">${exerciseEmoji(e.cat)}</div><small>Animation schématique — consulter les consignes ci-dessous</small></div>
  ${last?`<div class="last-load">Dernière réalisation : <strong>${formatLastLog(last)}</strong></div>`:""}
  <div class="cue"><strong>Exécution</strong><p>${e.how}</p></div><div class="cue"><strong>Repères techniques</strong><ul>${e.cues.map(x=>`<li>${x}</li>`).join("")}</ul></div><div class="cue"><strong>Erreurs fréquentes</strong><ul>${e.errors.map(x=>`<li>${x}</li>`).join("")}</ul></div><p class="muted">Une douleur inhabituelle ou croissante justifie d'arrêter l'exercice et de réévaluer la technique ou la charge.</p>`;
  $("#exerciseDialog").showModal()
}
function exerciseEmoji(cat){return {"Force":"🏋","Puissance":"⚡","Prévention":"🛡","Tronc":"◉","Calisthénie":"🤸","Agilité":"↔","Mobilité":"⌁"}[cat]||"●"}
function renderLibrary(filter="Tous",search=""){
  const cats=["Tous",...new Set(APP_DATA.exercises.map(e=>e.cat))];
  $("#categoryFilters").innerHTML=cats.map(c=>`<button class="chip ${c===filter?"active":""}" onclick="setFilter('${c}')">${c}</button>`).join("");
  const q=search.toLowerCase();
  const list=APP_DATA.exercises.filter(e=>(filter==="Tous"||e.cat===filter)&&(e.name.toLowerCase().includes(q)||e.goal.toLowerCase().includes(q)));
  $("#exerciseLibrary").innerHTML=`<div class="card">${list.map(e=>`<div class="exercise-row" onclick="openExercise('${e.id}')"><div><strong>${e.name}</strong><small>${e.cat} · ${e.goal}</small></div><span>›</span></div>`).join("")}</div>`;
}
let activeFilter="Tous";function setFilter(f){activeFilter=f;renderLibrary(activeFilter,$("#exerciseSearch").value)}

const metricDefs={weight:["Poids","kg"],waist:["Tour de taille","cm"],restHr:["FC repos","bpm"],pullups:["Tractions",""],pushups:["Pompes",""],lsit:["L-sit","s"],handstand:["Handstand","s"],jump:["Détente verticale","cm"],sprint5:["Sprint 5 m","s"],gripR:["Grip droit","kg"],gripL:["Grip gauche","kg"],ankleR:["Dorsiflexion droite","cm"],ankleL:["Dorsiflexion gauche","cm"]};
function renderProgress(){
  renderTrainingHistory(); renderSkillGoals();
  $("#chartMetric").innerHTML=Object.entries(metricDefs).map(([k,[n]])=>`<option value="${k}">${n}</option>`).join("");
  $("#metricDate").value=fmtDate(new Date());
  renderChart();
  const m=state.metrics[state.metrics.length-1];
  $("#latestMetrics").innerHTML=m?`<div class="card"><h3>Dernières mesures · ${frDate(m.date)}</h3><div class="metric-grid">${Object.entries(metricDefs).filter(([k])=>m[k]!==undefined&&m[k]!==null&&m[k]!=="").map(([k,[n,u]])=>`<div class="metric-card"><div class="metric-value">${m[k]} <small>${u}</small></div><div class="metric-label">${n}</div></div>`).join("")}</div></div>`:"";
}
function renderChart(){
  const key=$("#chartMetric")?.value||"weight", [name,unit]=metricDefs[key];const data=state.metrics.filter(m=>m[key]!==undefined&&m[key]!==null&&m[key]!=="").slice(-12);
  const c=$("#progressChart");if(!c)return;const ctx=c.getContext("2d");const dpr=devicePixelRatio||1;const rect=c.getBoundingClientRect();c.width=rect.width*dpr;c.height=220*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,rect.width,220);
  ctx.strokeStyle="#283039";ctx.lineWidth=1;for(let i=0;i<5;i++){let y=20+i*42;ctx.beginPath();ctx.moveTo(38,y);ctx.lineTo(rect.width-10,y);ctx.stroke()}
  if(data.length===0){ctx.fillStyle="#98a4ad";ctx.font="13px -apple-system";ctx.fillText("Ajoute des mesures pour afficher la courbe.",45,115);return}
  const vals=data.map(x=>+x[key]), min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;const xstep=(rect.width-60)/Math.max(data.length-1,1);
  ctx.strokeStyle="#c8ff3d";ctx.lineWidth=3;ctx.beginPath();data.forEach((m,i)=>{const x=40+i*xstep,y=190-(+m[key]-min)/span*145;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
  data.forEach((m,i)=>{const x=40+i*xstep,y=190-(+m[key]-min)/span*145;ctx.fillStyle="#c8ff3d";ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill()});
  ctx.fillStyle="#98a4ad";ctx.font="11px -apple-system";ctx.fillText(`${name} (${unit})`,40,14);ctx.fillText(max.toFixed(1),3,50);ctx.fillText(min.toFixed(1),3,194)
}
function saveMetrics(){
  const m={date:$("#metricDate").value};
  Object.keys(metricDefs).forEach(k=>{const el=$("#"+k);if(el&&el.value!=="")m[k]=+el.value});
  state.metrics.push(m);state.metrics.sort((a,b)=>a.date.localeCompare(b.date));save()
}
function renderSettings(){$("#padelDay").value=state.padelDay;$("#specialStart").value=fmtDate(addDays(new Date(),14));$("#reminderWorkout").checked=!!state.reminders.workout;$("#reminderTest").checked=!!state.reminders.test}


let liveSession = null;
let restTimer = {remaining:0,total:0,running:false,interval:null};

function parseSetCount(dose){
  const m = dose.match(/(\d+)\s*[×x]/i);
  return m ? +m[1] : 3;
}
function parseRepHint(dose){
  const m = dose.match(/[×x]\s*([0-9]+(?:[–-][0-9]+)?)/i);
  return m ? m[1] : "";
}
function getLastExerciseLog(eid){
  for(let i=state.trainingLog.length-1;i>=0;i--){
    const ex=(state.trainingLog[i].exercises||[]).find(x=>x.id===eid);
    if(ex) return {...ex, date:state.trainingLog[i].date};
  }
  return null;
}
function formatLastLog(log){
  if(!log) return "";
  const parts=(log.sets||[]).filter(s=>s.done).map(s=>{
    const load=s.load!==""&&s.load!=null?`${s.load} kg`:"PDC";
    const reps=s.reps!==""&&s.reps!=null?` × ${s.reps}`:"";
    return `${load}${reps}`;
  });
  return `${parts.join(" · ")}${log.date?` (${parseDate(log.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})})`:""}`;
}
function suggestLoad(eid){
  const logs=[];
  for(let i=state.trainingLog.length-1;i>=0 && logs.length<3;i--){
    const ex=(state.trainingLog[i].exercises||[]).find(x=>x.id===eid);
    if(ex) logs.push(ex);
  }
  if(!logs.length) return "";
  const last=logs[0], done=(last.sets||[]).filter(s=>s.done && s.load!=="" && s.reps!=="");
  if(!done.length) return "";
  const avgLoad=done.reduce((a,s)=>a+(+s.load||0),0)/done.length;
  const avgReps=done.reduce((a,s)=>a+(+s.reps||0),0)/done.length;
  if(avgLoad<=0) return "";
  if(avgReps>=10) return `Si la dernière séance était confortable, essaie ${Math.round((avgLoad+2.5)*2)/2} kg.`;
  return `Repars autour de ${Math.round(avgLoad*2)/2} kg et cherche d'abord à consolider les répétitions.`;
}
function startSession(workoutId,date){
  const w=structuredClone(workoutById(workoutId));
  // Replace advanced calisthenics work with the current mastered progression step.
  w.exercises = w.exercises.map(x=>{
    const [eid,dose,note]=x;
    if(eid==="dead-hang" || eid==="assisted-pullup"){
      const step=getCurrentPathExercise("pullup");
      return [step.id, step.id.includes("hang")||step.id==="negative-pullup" ? "3 séries" : "3 × 5–8", `Parcours traction · ${step.criterion}`];
    }
    if(eid==="support-hold"){
      const step=getCurrentPathExercise("dip");
      return [step.id, step.id==="support-hold" ? "3 × 20–30 s" : "3 × 5–8", `Parcours dips · ${step.criterion}`];
    }
    return x;
  });
  liveSession={workoutId,date,index:0,startedAt:new Date().toISOString(),exercises:w.exercises.map(([eid,dose,note])=>{
    const n=parseSetCount(dose), last=getLastExerciseLog(eid);
    const target=getAdaptiveTarget(eid,dose,n,last);
    return {id:eid,dose,note,target,rpe:null,pain:0,notes:"",sets:Array.from({length:target.sets||n},(_,i)=>({
      load:target.load ?? last?.sets?.[i]?.load ?? state.exerciseDefaults[eid]?.load ?? "",
      reps:target.reps ?? last?.sets?.[i]?.reps ?? parseRepHint(dose).split(/[–-]/)[0] ?? "",
      seconds:target.seconds ?? "",
      done:false
    }))}
  })};
  $("#workoutDialog").close();
  $$(".view").forEach(v=>v.classList.remove("active"));$("#sessionView").classList.add("active");
  $$(".bottom-nav button").forEach(x=>x.classList.remove("active"));
  renderLiveSession();
}
function renderLiveSession(){
  if(!liveSession)return;
  const w=workoutById(liveSession.workoutId), exLog=liveSession.exercises[liveSession.index], e=exById(exLog.id);
  const p=Math.round((liveSession.index)/liveSession.exercises.length*100);
  $("#sessionProgressBar").style.width=p+"%";$("#sessionProgressText").textContent=`${liveSession.index+1} / ${liveSession.exercises.length}`;
  const last=getLastExerciseLog(exLog.id), target=exLog.target||{};
  const isTimed = target.seconds!=null && target.seconds!=="";
  $("#liveSession").innerHTML=`<div class="card session-exercise">
    <div class="eyebrow">${w.name.toUpperCase()}</div><h2>${e.name}</h2>
    <div class="session-dose">Cible du jour</div>
    <div class="plan-actual">
      <div class="plan-box"><small>Prescription proposée</small><strong>${target.label||exLog.dose}</strong></div>
      <div class="plan-box"><small>Pourquoi ?</small><strong>${target.reason||"Progression standard"}</strong></div>
    </div>
    ${last?`<div class="last-load">Dernière fois : <strong>${formatLastLog(last)}</strong></div>`:""}
    <button class="secondary" style="width:100%;margin-bottom:10px" onclick="openExercise('${e.id}')">Voir la technique</button>
    <div class="set-grid"><div class="head">Série</div><div class="head">${isTimed?"Secondes":"Poids kg"}</div><div class="head">${isTimed?"Qualité":"Rép."}</div><div class="head">OK</div>
    ${exLog.sets.map((s,i)=>`<div class="set-number">${i+1}</div>
      ${isTimed?`<input inputmode="numeric" value="${s.seconds}" onchange="updateSet(${i},'seconds',this.value)" placeholder="s"><input value="${s.reps||""}" onchange="updateSet(${i},'reps',this.value)" placeholder="OK">`:
      `<input inputmode="decimal" value="${s.load}" onchange="updateSet(${i},'load',this.value)" placeholder="PDC"><input inputmode="numeric" value="${s.reps}" onchange="updateSet(${i},'reps',this.value)" placeholder="—">`}
      <button class="set-done ${s.done?"done":""}" onclick="completeSet(${i})">${s.done?"✓":"○"}</button>`).join("")}</div>

    <div class="session-feedback">
      <strong>Difficulté ressentie</strong>
      <div class="rpe-scale">${[1,2,3,4,5].map(v=>`<button class="${exLog.rpe===v?"active":""}" onclick="setExerciseFeedback('rpe',${v})">${v}</button>`).join("")}</div>
      <div class="adapt-meta">1 = très facile · 3 = adapté · 5 = maximal / échec</div>
      <label style="margin-top:10px">Douleur pendant l'exercice (0–10)<input type="number" min="0" max="10" value="${exLog.pain||0}" onchange="setExerciseFeedback('pain',this.value)"></label>
      <label>Note rapide<textarea rows="2" onchange="setExerciseFeedback('notes',this.value)" placeholder="Instable côté gauche, trop facile, gêne au talon…">${exLog.notes||""}</textarea></label>
    </div>
  </div>
  <div class="card rest-card"><div class="eyebrow">RÉCUPÉRATION</div><div class="timer" id="timerDisplay">${formatTimer(restTimer.remaining||90)}</div>
    <div class="timer-controls"><button class="secondary" onclick="setRest(60)">60 s</button><button class="secondary" onclick="setRest(90)">90 s</button><button class="secondary" onclick="setRest(120)">120 s</button></div>
    <div class="timer-controls" style="margin-top:8px"><button class="primary" onclick="toggleTimer()">${restTimer.running?"Pause":"Démarrer"}</button><button class="secondary" onclick="resetTimer()">Réinitialiser</button></div>
  </div>
  <div class="session-nav"><button class="secondary" onclick="prevExercise()" ${liveSession.index===0?"disabled":""}>←</button><button class="primary" onclick="${liveSession.index===liveSession.exercises.length-1?"finishSession()":"nextExercise()"}">${liveSession.index===liveSession.exercises.length-1?"Terminer":"Exercice suivant"}</button><button class="secondary" onclick="nextExercise()" ${liveSession.index===liveSession.exercises.length-1?"disabled":""}>→</button></div>`;
}
function setExerciseFeedback(key,val){
  const ex=liveSession.exercises[liveSession.index];
  ex[key]= key==="notes" ? val : +val;
  if(key==="rpe") renderLiveSession();
}
function updateSet(i,key,val){liveSession.exercises[liveSession.index].sets[i][key]=val}
function completeSet(i){
  const s=liveSession.exercises[liveSession.index].sets[i];s.done=!s.done;
  if(s.done){const eid=liveSession.exercises[liveSession.index].id;state.exerciseDefaults[eid]={load:s.load,reps:s.reps};setRest(90);startTimer()}
  renderLiveSession()
}
function nextExercise(){if(liveSession.index<liveSession.exercises.length-1){liveSession.index++;resetTimer(false);renderLiveSession()}}
function prevExercise(){if(liveSession.index>0){liveSession.index--;resetTimer(false);renderLiveSession()}}
function finishSession(){
  const log={date:liveSession.date,workoutId:liveSession.workoutId,startedAt:liveSession.startedAt,endedAt:new Date().toISOString(),exercises:liveSession.exercises};
  state.trainingLog.push(log);
  updateAdaptiveProgressFromSession(log);
  evaluatePathwayProgress(log);
  state.completed[`${liveSession.date}-${liveSession.workoutId}`]=true;
  liveSession=null;resetTimer(false);save();
  $$(".view").forEach(v=>v.classList.remove("active"));$("#homeView").classList.add("active");$$(".bottom-nav button").forEach(x=>x.classList.remove("active"));$$('.bottom-nav button[data-view="homeView"]')[0].classList.add("active")
}
function formatTimer(s){s=Math.max(0,Math.round(s));return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
function setRest(seconds){restTimer.total=seconds;restTimer.remaining=seconds;restTimer.running=false;if(restTimer.interval)clearInterval(restTimer.interval);restTimer.interval=null;const el=$("#timerDisplay");if(el)el.textContent=formatTimer(seconds)}
function startTimer(){
  if(restTimer.running)return;if(restTimer.remaining<=0)setRest(restTimer.total||90);restTimer.running=true;
  restTimer.interval=setInterval(()=>{restTimer.remaining--;const el=$("#timerDisplay");if(el)el.textContent=formatTimer(restTimer.remaining);if(restTimer.remaining<=0){clearInterval(restTimer.interval);restTimer.interval=null;restTimer.running=false;if("vibrate" in navigator)navigator.vibrate([120,80,120]);try{new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=").play()}catch{}}},1000)
}
function toggleTimer(){restTimer.running?(clearInterval(restTimer.interval),restTimer.interval=null,restTimer.running=false):(startTimer());renderLiveSession()}
function resetTimer(render=true){if(restTimer.interval)clearInterval(restTimer.interval);restTimer={remaining:90,total:90,running:false,interval:null};if(render&&liveSession)renderLiveSession()}
$("#exitSession").onclick=()=>{if(confirm("Quitter la séance ? Les séries non terminées ne seront pas enregistrées.")){liveSession=null;resetTimer(false);$$(".view").forEach(v=>v.classList.remove("active"));$("#homeView").classList.add("active");$$('.bottom-nav button[data-view="homeView"]')[0].classList.add("active")}};



const SKILL_PATHWAYS = {
  pullup: {
    name:"Traction",
    steps:[
      {id:"dead-hang",label:"Suspension passive",criterion:"3 × 30 s sans perte de grip ni douleur"},
      {id:"active-hang",label:"Suspension active",criterion:"3 × 8 répétitions propres"},
      {id:"scap-pullup",label:"Tractions scapulaires",criterion:"3 × 8 contrôlées"},
      {id:"negative-pullup",label:"Tractions négatives",criterion:"3 × 5 avec descente ≥ 5 s"},
      {id:"assisted-pullup",label:"Tractions assistées",criterion:"3 × 8 propres avec assistance modérée"},
      {id:"pullup",label:"Tractions strictes",criterion:"3 × 5 propres avant progression libre"}
    ]
  },
  pushup:{
    name:"Pompe",
    steps:[
      {id:"incline-pushup",label:"Pompes inclinées",criterion:"3 × 12 propres"},
      {id:"pushup",label:"Pompes au sol",criterion:"3 × 12 propres"},
    ]
  },
  dip:{
    name:"Dips",
    steps:[
      {id:"support-hold",label:"Support hold",criterion:"3 × 30 s stable et indolore"},
      {id:"dip",label:"Dips assistés / amplitude réduite",criterion:"3 × 8 propres et indolores"}
    ]
  }
};

function getCurrentPathExercise(path){
  const p=SKILL_PATHWAYS[path], idx=Math.min(state.pathwayState[path]||0,p.steps.length-1);
  return p.steps[idx];
}
function pathForExercise(eid){
  for(const [k,p] of Object.entries(SKILL_PATHWAYS)){
    if(p.steps.some(s=>s.id===eid)) return k;
  }
  return null;
}
function evaluatePathwayProgress(log){
  for(const [path,p] of Object.entries(SKILL_PATHWAYS)){
    const idx=state.pathwayState[path]||0, step=p.steps[idx];
    const ex=(log.exercises||[]).find(x=>x.id===step.id);
    if(!ex) continue;
    const done=(ex.sets||[]).filter(s=>s.done);
    if(!done.length || ex.pain>=3 || (ex.rpe||3)>=5) continue;
    let mastered=false;
    if(step.id==="dead-hang" || step.id==="support-hold"){
      const secs=done.map(s=>+s.seconds||0); mastered=done.length>=3 && Math.min(...secs)>=30;
    } else if(step.id==="active-hang" || step.id==="scap-pullup"){
      const reps=done.map(s=>+s.reps||0); mastered=done.length>=3 && Math.min(...reps)>=8;
    } else if(step.id==="negative-pullup"){
      // use seconds as eccentric duration if entered, otherwise notes/rpe not enough
      const secs=done.map(s=>+s.seconds||0); mastered=done.length>=3 && secs.filter(x=>x>=5).length>=3;
    } else if(step.id==="assisted-pullup" || step.id==="dip"){
      const reps=done.map(s=>+s.reps||0); mastered=done.length>=3 && Math.min(...reps)>=8 && (ex.rpe||3)<=3;
    } else if(step.id==="pullup"){
      const reps=done.map(s=>+s.reps||0); mastered=done.length>=3 && Math.min(...reps)>=5 && (ex.rpe||3)<=3;
    } else if(step.id==="incline-pushup" || step.id==="pushup"){
      const reps=done.map(s=>+s.reps||0); mastered=done.length>=3 && Math.min(...reps)>=12 && (ex.rpe||3)<=3;
    }
    if(mastered && idx<p.steps.length-1) state.pathwayState[path]=idx+1;
  }
}

const EXERCISE_RULES = {
  "leg-press":{type:"load",step:5,minReps:6,maxReps:8},
  "rdl":{type:"load",step:2.5,minReps:8,maxReps:10},
  "bulgarian-split":{type:"load",step:2,minReps:8,maxReps:10},
  "calf-straight":{type:"load",step:2.5,minReps:12,maxReps:15},
  "calf-bent":{type:"load",step:2.5,minReps:12,maxReps:15},
  "row":{type:"load",step:2.5,minReps:8,maxReps:12},
  "woodchop":{type:"load",step:1,minReps:10,maxReps:12},
  "facepull":{type:"load",step:1,minReps:12,maxReps:15},
  "wrist-ext":{type:"load",step:0.5,minReps:12,maxReps:15},
  "pronation":{type:"load",step:0.5,minReps:10,maxReps:15},
  "farmer":{type:"load",step:2,maxReps:40},
  "pullup":{type:"reps",step:1,minReps:3,maxReps:12},
  "pushup":{type:"reps",step:1,minReps:8,maxReps:20},
  "dip":{type:"reps",step:1,minReps:5,maxReps:12},
  "pallof":{type:"reps",step:1,minReps:8,maxReps:15},
  "deadbug":{type:"reps",step:1,minReps:6,maxReps:12},
  "skater":{type:"reps",step:1,minReps:6,maxReps:12},
  "pistol":{type:"reps",step:1,minReps:3,maxReps:8},
  "lsit":{type:"time",step:3,minSeconds:8,maxSeconds:30},
  "handstand-wall":{type:"time",step:5,minSeconds:15,maxSeconds:45},
  "splitstep":{type:"time",step:5,minSeconds:30,maxSeconds:60},
  "reaction":{type:"time",step:5,minSeconds:20,maxSeconds:45},
  "anklemob":{type:"time",step:5,minSeconds:30,maxSeconds:75},
  "thoracic":{type:"reps",step:1,minReps:6,maxReps:12},
  "shortfoot":{type:"reps",step:1,minReps:8,maxReps:15},
  "band-external":{type:"reps",step:1,minReps:10,maxReps:18},
  "box-jump":{type:"quality",step:0,minReps:3,maxReps:6},
  "dead-hang":{type:"time",step:5,minSeconds:15,maxSeconds:30},
  "active-hang":{type:"reps",step:1,minReps:5,maxReps:8},
  "scap-pullup":{type:"reps",step:1,minReps:5,maxReps:8},
  "negative-pullup":{type:"time",step:1,minSeconds:3,maxSeconds:8},
  "assisted-pullup":{type:"reps",step:1,minReps:4,maxReps:8},
  "incline-pushup":{type:"reps",step:1,minReps:8,maxReps:12},
  "support-hold":{type:"time",step:5,minSeconds:15,maxSeconds:30}
};

function median(arr){const a=[...arr].sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function getAdaptiveTarget(eid,dose,n,last){
  const rule=EXERCISE_RULES[eid]||{type:"reps",step:1};
  const saved=state.exerciseProgress[eid];
  if(saved?.nextTarget) return saved.nextTarget;

  if(last){
    const done=(last.sets||[]).filter(s=>s.done);
    if(rule.type==="load"){
      const loads=done.map(s=>+s.load).filter(v=>v>0), reps=done.map(s=>+s.reps).filter(v=>v>0);
      if(loads.length) return {sets:n,load:median(loads),reps:Math.max(rule.minReps||1,Math.round(median(reps)||rule.minReps||8)),label:`${n} séries · ${median(loads)} kg · ${Math.round(median(reps)||8)} rép.`,reason:"Consolidation de la dernière séance"};
    }
    if(rule.type==="time"){
      const secs=done.map(s=>+s.seconds).filter(v=>v>0);
      const sec=median(secs)||rule.minSeconds||20; return {sets:n,seconds:sec,label:`${n} × ${sec} s`,reason:"Consolidation du dernier niveau"};
    }
    const reps=done.map(s=>+s.reps).filter(v=>v>0);
    if(reps.length){const r=Math.round(median(reps));return {sets:n,reps:r,label:`${n} × ${r} rép.`,reason:"Consolidation du dernier niveau"}}
  }
  return parseDoseToTarget(dose,n,rule);
}
function parseDoseToTarget(dose,n,rule){
  const rep=parseRepHint(dose);const low=rep?+(rep.split(/[–-]/)[0]):(rule.minReps||8);
  if(/\bs\b/.test(dose) && rule.type==="time"){return {sets:n,seconds:low,label:dose,reason:"Niveau initial du programme"}}
  return {sets:n,reps:low,label:dose,reason:"Niveau initial du programme"};
}
function updateAdaptiveProgressFromSession(log){
  (log.exercises||[]).forEach(ex=>{
    const rule=EXERCISE_RULES[ex.id]||{type:"reps",step:1};
    const done=(ex.sets||[]).filter(s=>s.done);
    if(!done.length)return;
    const completion=done.length/(ex.sets?.length||1);
    const rpe=ex.rpe||3, pain=ex.pain||0;
    let direction="hold", reason="Consolider le niveau actuel";
    if(pain>=4){direction="regress";reason="Douleur ≥ 4/10 : réduction de charge/volume proposée";}
    else if(completion<0.75 || rpe>=5){direction="regress";reason="Objectif incomplet ou effort maximal";}
    else if(completion===1 && rpe<=2){direction="progress_fast";reason="Objectif réussi avec marge importante";}
    else if(completion===1 && rpe===3){direction="progress";reason="Objectif réussi avec difficulté adaptée";}
    else if(rpe===4){direction="hold";reason="Objectif réussi mais exigeant : consolidation";}

    let target={sets:ex.sets.length,reason};
    if(rule.type==="load"){
      const loads=done.map(s=>+s.load).filter(v=>v>0), reps=done.map(s=>+s.reps).filter(v=>v>0);
      const base=median(loads)||0, rp=Math.round(median(reps)||rule.minReps||8);
      let load=base, rep=rp;
      if(direction==="progress_fast") load=base+rule.step;
      if(direction==="progress") {
        if(rp < (rule.maxReps||rp)) rep=Math.min(rule.maxReps||rp,rp+1);
        else load=base+rule.step, rep=rule.minReps||rp;
      }
      if(direction==="regress") load=Math.max(0,base-rule.step), rep=rule.minReps||rp;
      target.load=Math.round(load*2)/2;target.reps=rep;target.label=`${target.sets} séries · ${target.load} kg · ${rep} rép.`;
    } else if(rule.type==="time"){
      const secs=done.map(s=>+s.seconds).filter(v=>v>0), base=Math.round(median(secs)||rule.minSeconds||20);
      let sec=base;
      if(direction==="progress_fast")sec+=rule.step*2;
      else if(direction==="progress")sec+=rule.step;
      else if(direction==="regress")sec=Math.max(rule.minSeconds||5,sec-rule.step);
      sec=Math.min(rule.maxSeconds||999,sec);target.seconds=sec;target.label=`${target.sets} × ${sec} s`;
    } else if(rule.type==="quality"){
      const reps=done.map(s=>+s.reps).filter(v=>v>0), base=Math.round(median(reps)||rule.minReps||5);
      let rep=base;
      if(direction==="progress"||direction==="progress_fast")rep=Math.min(rule.maxReps||base,base+1);
      if(direction==="regress")rep=Math.max(rule.minReps||3,base-1);
      target.reps=rep;target.label=`${target.sets} × ${rep} répétitions de haute qualité`;
    } else {
      const reps=done.map(s=>+s.reps).filter(v=>v>0), base=Math.round(median(reps)||rule.minReps||8);
      let rep=base;
      if(direction==="progress_fast")rep+=Math.max(2,rule.step);
      else if(direction==="progress")rep+=rule.step;
      else if(direction==="regress")rep=Math.max(rule.minReps||1,rep-rule.step);
      rep=Math.min(rule.maxReps||999,rep);target.reps=rep;target.label=`${target.sets} × ${rep} rép.`;
    }
    state.exerciseProgress[ex.id]={lastDirection:direction,lastReason:reason,nextTarget:target,lastUpdated:log.date};
  });
}

function painSignals(){
  const recent=[...state.journal].filter(j=>{
    const diff=(new Date()-parseDate(j.date))/(86400000);return diff<=21;
  });
  const fields=[["elbow","coude"],["shoulder","épaule"],["knee","genou"],["heel","talon/pied"],["back","dos"]];
  return fields.map(([k,label])=>({k,label,max:Math.max(0,...recent.map(j=>+j[k]||0)),count:recent.filter(j=>(+j[k]||0)>=3).length})).filter(x=>x.max>=3);
}
function textSignals(){
  const txt=state.journal.slice(-8).map(j=>`${j.weaknesses||""} ${j.painNote||""}`.toLowerCase()).join(" ");
  const rules=[
    {terms:["volée","reaction","réaction","retard"],title:"Réactivité à la volée",action:"Maintenir ou augmenter le travail split-step + réaction sur signal."},
    {terms:["talon","pied","plantaire"],title:"Tolérance pied / talon",action:"Prioriser mollets jambe tendue/fléchie, short-foot et contrôle de charge des impacts."},
    {terms:["coude","épicond"],title:"Avant-bras / coude",action:"Renforcement progressif des extenseurs, pronation-supination et réduction temporaire des contraintes douloureuses."},
    {terms:["épaule"],title:"Stabilité d'épaule",action:"Augmenter le travail de coiffe, face-pull et contrôle scapulaire."},
    {terms:["fatigue","jambes lourdes","fin de tournoi"],title:"Endurance des appuis",action:"Conserver le renforcement des mollets et ajouter progressivement du travail intermittent court."},
    {terms:["mobilité","raide","cheville"],title:"Mobilité",action:"Augmenter la fréquence du travail de dorsiflexion et de mobilité active."}
  ];
  return rules.filter(r=>r.terms.some(t=>txt.includes(t)));
}
function replacementSuggestions(){const p=painSignals(),out=[];p.forEach(x=>{if(x.label==="talon/pied")out.push({level:"warn",title:"Adapter les impacts",text:"Si les sauts reproduisent la douleur : remplacer temporairement box jumps/skater jumps par vélo ou force contrôlée, tout en conservant mollets et pied indolores."});if(x.label==="coude")out.push({level:"warn",title:"Adapter le travail du coude",text:"Si grip ou tirages reproduisent la douleur : réduire le grip lourd et privilégier extenseurs du poignet/pronation-supination à faible charge."});if(x.label==="épaule")out.push({level:"warn",title:"Adapter le travail d'épaule",text:"Si dips ou handstand sont douloureux : revenir au support hold indolore, contrôle scapulaire et coiffe."});if(x.label==="genou")out.push({level:"warn",title:"Adapter les impacts du genou",text:"Réduire pliométrie et amplitude douloureuse ; conserver renforcement contrôlé et travail unipodal indolore."})});return out}
function generateCoachSuggestions(){
  const out=[];
  painSignals().forEach(p=>{
    if(p.max>=5) out.push({level:"danger",title:`Douleur ${p.label} signalée jusqu'à ${p.max}/10`,text:"Le programme doit ralentir sur les exercices qui reproduisent la douleur. Si la douleur persiste, augmente, survient au repos ou s'accompagne d'une perte de fonction, une évaluation clinique est préférable."});
    else out.push({level:"warn",title:`Vigilance : ${p.label}`,text:`Douleur répétée ou ≥3/10 récemment. Maintenir une progression conservatrice et éviter d'augmenter simultanément volume et intensité.`});
  });
  textSignals().forEach(s=>out.push({level:"",title:s.title,text:s.action}));
  out.push(...replacementSuggestions());
  if(!out.length) out.push({level:"",title:"Progression normale",text:"Aucun signal récent ne justifie de réduire la charge. Les exercices réussis avec difficulté faible peuvent progresser."});
  return out.slice(0,10);
}
function renderAdaptiveSummary(){
  const el=$("#adaptiveSummary");if(!el)return;
  const sug=generateCoachSuggestions().slice(0,2);
  el.innerHTML=sug.map(s=>`<div class="adapt-card ${s.level||""}"><strong>${s.title}</strong>${s.text}</div>`).join("");
}

function renderSkillPathways(){
  const el=$("#skillPathways"); if(!el) return;
  el.innerHTML=Object.entries(SKILL_PATHWAYS).map(([key,p])=>{
    const idx=state.pathwayState[key]||0;
    return `<div class="pathway"><div class="pathway-head"><strong>${p.name}</strong><span class="badge">${idx+1}/${p.steps.length}</span></div>
      ${p.steps.map((s,i)=>`<div class="path-step ${i<idx?"done":i===idx?"current":""}"><span class="path-dot"></span><div>${s.label}${i===idx?`<div class="adapt-meta">${s.criterion}</div>`:""}</div></div>`).join("")}
      <div class="mastery-note">Le passage au niveau suivant nécessite une exécution propre, sans douleur significative, et une difficulté ressentie compatible avec une marge technique.</div>
    </div>`;
  }).join("");
}

function renderProgressionSuggestions(){
  const el=$("#progressionSuggestions");if(!el)return;
  const rows=Object.entries(state.exerciseProgress).map(([eid,p])=>({e:exById(eid),p})).filter(x=>x.e).slice(-12).reverse();
  el.innerHTML=rows.length?rows.map(({e,p})=>`<div class="adapt-card"><strong>${e.name}</strong><span class="target-pill">${p.nextTarget?.label||"Conserver"}</span><div class="adapt-meta">${p.lastReason||""}</div></div>`).join(""):`<p class="muted">Les propositions apparaîtront après les premières séances guidées.</p>`;
}
function renderPriorities(){
  const el=$("#prioritySuggestions");if(!el)return;
  el.innerHTML=generateCoachSuggestions().map(s=>`<div class="adapt-card ${s.level||""}"><strong>${s.title}</strong>${s.text}</div>`).join("");
}
function saveJournalEntry(){
  const j={date:$("#journalDate").value,type:$("#journalType").value,energy:+$("#journalEnergy").value,quality:+$("#journalQuality").value,
    weaknesses:$("#journalWeaknesses").value.trim(),positives:$("#journalPositives").value.trim(),painNote:$("#journalPainNote").value.trim(),
    elbow:+$("#journalElbow").value||0,shoulder:+$("#journalShoulder").value||0,knee:+$("#journalKnee").value||0,heel:+$("#journalHeel").value||0,back:+$("#journalBack").value||0};
  state.journal.push(j);state.journal.sort((a,b)=>a.date.localeCompare(b.date));save();
  ["journalWeaknesses","journalPositives","journalPainNote"].forEach(id=>$("#"+id).value="");
}
function renderJournal(){
  const h=$("#journalHistory");if(!h)return;
  $("#journalDate").value ||= fmtDate(new Date());
  const arr=[...state.journal].reverse().slice(0,15);
  h.innerHTML=arr.length?arr.map(j=>`<div class="history-item"><div class="history-item-top"><strong>${({padel:"Padel",tournament:"Tournoi",physical:"Séance physique",recovery:"Récupération"})[j.type]||j.type}</strong><span class="muted">${frDate(j.date)}</span></div>
    <div class="history-set">Énergie ${j.energy}/5 · sensations ${j.quality}/5</div>
    ${j.weaknesses?`<div class="adapt-meta"><strong>Difficultés :</strong> ${j.weaknesses}</div>`:""}
    ${j.positives?`<div class="adapt-meta"><strong>Positif :</strong> ${j.positives}</div>`:""}
    ${j.painNote?`<div class="adapt-meta"><strong>Douleur :</strong> ${j.painNote}</div>`:""}
  </div>`).join(""):`<p class="muted">Aucun retour enregistré.</p>`;
}

function renderTrainingHistory(){
  const el=$("#trainingHistory");if(!el)return;
  const logs=[...state.trainingLog].reverse().slice(0,12);
  el.innerHTML=logs.length?logs.map(log=>{const w=workoutById(log.workoutId);return `<div class="history-item"><div class="history-item-top"><strong>${w?.name||log.workoutId}</strong><span class="muted">${parseDate(log.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span></div>${log.exercises.map(ex=>`<div class="history-set">${exById(ex.id)?.name}: ${formatLastLog(ex)}</div>`).join("")}</div>`}).join(""):`<p class="muted">Aucune séance enregistrée pour le moment.</p>`;
}
function renderSkillGoals(){
  const latest=state.metrics[state.metrics.length-1]||{};
  const rows=[
    ["Tractions",latest.pullups||0,state.skillGoals.pullup,"rép."],
    ["L-sit",latest.lsit||0,state.skillGoals.lsit,"s"],
    ["Handstand",latest.handstand||0,state.skillGoals.handstand,"s"],
    ["Pistol squat",latest.pistol||0,state.skillGoals.pistol,"rép./jambe"]
  ];
  $("#skillGoals").innerHTML=rows.map(([name,v,g,u])=>`<div class="skill-row"><div class="skill-row-top"><strong>${name}</strong><span>${v} / ${g} ${u}</span></div><div class="skill-track"><div style="width:${Math.min(100,(v/g)*100)}%"></div></div></div>`).join("");
}

function renderAll(){renderHome();renderCalendar();renderWorkouts();renderLibrary(activeFilter,$("#exerciseSearch")?.value||"");renderProgress();renderSettings();renderAdaptiveSummary();renderProgressionSuggestions();renderPriorities();renderJournal();renderSkillPathways();renderAthleticDashboard();renderRetest();renderPeriodization()}
$$(".bottom-nav button").forEach(b=>b.onclick=()=>{$$(".view").forEach(v=>v.classList.remove("active"));$("#"+b.dataset.view).classList.add("active");$$(".bottom-nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");window.scrollTo(0,0)})
$$("[data-go]").forEach(b=>b.onclick=()=>document.querySelector(`.bottom-nav [data-view="${b.dataset.go}"]`).click())
$("#closeDialog").onclick=()=>$("#exerciseDialog").close();$("#closeWorkoutDialog").onclick=()=>$("#workoutDialog").close();
$("#exerciseSearch").oninput=e=>renderLibrary(activeFilter,e.target.value);
$("#prevMonth").onclick=()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()-1,1);renderCalendar()};
$("#nextMonth").onclick=()=>{currentMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth()+1,1);renderCalendar()};
$("#todayBtn").onclick=()=>{currentMonth=new Date();selectedDate=fmtDate(new Date());renderCalendar()};
$("#saveMetrics").onclick=saveMetrics;$("#chartMetric").onchange=renderChart;
$("#saveReadiness").onclick=()=>{state.readiness.push({date:fmtDate(new Date()),fatigue:+$("#fatigueSelect").value,elbow:+$("#elbowPain").value,heel:+$("#heelPain").value});save()};
$("#applyWeeklyPlan").onclick=()=>{state.padelDay=+$("#padelDay").value;for(let i=0;i<10;i++)buildNormalWeek(addDays(new Date(),i*7));save()};
$("#addSpecialWeek").onclick=()=>{const sp={start:$("#specialStart").value,type:$("#specialType").value};state.special.push(sp);applySpecial(sp)};
$("#exportData").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="padel-athlete-backup.json";a.click();URL.revokeObjectURL(a.href)};
$("#importData").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save()}catch{alert("Fichier non valide")}};r.readAsText(f)};
$("#installHelp").onclick=()=>alert("Sur iPhone : ouvrez cette application dans Safari, touchez Partager, puis « Ajouter à l’écran d’accueil » et activez « Ouvrir comme app web » si l’option apparaît.");

$("#reminderWorkout").onchange=e=>{state.reminders.workout=e.target.checked;save()};
$("#reminderTest").onchange=e=>{state.reminders.test=e.target.checked;save()};
$("#saveJournal").onclick=saveJournalEntry;
$("#markRetestDone").onclick=()=>{state.retest.last=fmtDate(new Date());state.retest.next=fmtDate(addDays(new Date(),56));save()};
$("#requestNotifications").onclick=async()=>{if(!("Notification" in window)){alert("Notifications non disponibles dans ce navigateur.");return}const p=await Notification.requestPermission();alert(p==="granted"?"Notifications autorisées.":"Autorisation non accordée.")};

window.addEventListener("resize",renderChart);
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
renderAll();
