(() => {
  // V6 corrective patch loaded after the V5 application.
  const addExercise = ex => { if (!APP_DATA.exercises.some(x => x.id === ex.id)) APP_DATA.exercises.push(ex); };
  const addWorkout = w => { if (!APP_DATA.workouts.some(x => x.id === w.id)) APP_DATA.workouts.push(w); };

  addExercise({id:"pike-support",name:"Maintien en pike",cat:"Calisthénie",goal:"Construire progressivement l'appui sur les bras et le contrôle scapulaire avant toute inversion.",how:"Mains au sol ou sur un support stable, pieds au sol, hanches hautes. Pousser activement dans les mains, bras tendus, sans chercher à devenir vertical.",cues:["Pousser le sol","Bras tendus","Rester loin de l'échec"],errors:["Chercher la verticale trop tôt","Cambrer excessivement","Continuer malgré une douleur d'épaule ou de poignet"]});
  addExercise({id:"elevated-pike",name:"Pike pieds surélevés",cat:"Calisthénie",goal:"Augmenter progressivement la charge sur les épaules avant un travail réellement inversé.",how:"Pieds sur un banc bas, mains au sol, hanches hautes. Maintenir la position en poussant activement dans les mains.",cues:["Banc bas au départ","Épaules actives","Respiration régulière"],errors:["Support trop haut trop tôt","Perdre le gainage"]});
  addExercise({id:"wall-walk-partial",name:"Wall walk partiel",cat:"Calisthénie",goal:"Découvrir progressivement l'inversion sans imposer un handstand complet.",how:"Depuis une planche pieds au mur, marcher légèrement les pieds vers le haut et les mains vers le mur jusqu'à une inclinaison confortable, puis revenir.",cues:["Petite amplitude au début","Contrôle à la descente","Aucune obligation d'aller vertical"],errors:["Monter trop haut dès la première séance","Continuer avec appréhension importante"]});
  addExercise({id:"wall-slide",name:"Wall slide",cat:"Mobilité",goal:"Entretenir la mobilité active de l'épaule et le contrôle scapulaire sans charge importante.",how:"Dos contre un mur, faire glisser lentement les avant-bras vers le haut dans une amplitude confortable.",cues:["Pas de douleur","Côtes contrôlées","Mouvement lent"],errors:["Forcer l'amplitude","Cambrer pour monter plus haut"]});
  addExercise({id:"forearm-isometric",name:"Isométrique extenseurs du poignet",cat:"Prévention",goal:"Entretenir les extenseurs de l'avant-bras sans matériel pendant une semaine très chargée en sports de raquette.",how:"Avant-bras soutenu. Avec l'autre main, opposer une résistance légère à l'extension du poignet sans créer de mouvement.",cues:["Effort modéré","Indolore ou gêne minime","Respirer"],errors:["Forcer jusqu'à la douleur","Contraction maximale inutile"]});

  addWorkout({id:"U",name:"UCPA — mobilité & récupération",duration:"15–20 min",location:"Sans matériel",tags:["UCPA","Mobilité","Récupération"],exercises:[
    ["anklemob","2 × 45 s / côté","Mobilité confortable, sans forcer"],
    ["thoracic","2 × 8 / côté","Rotation thoracique lente"],
    ["wall-slide","2 × 10","Mobilité et contrôle scapulaire"],
    ["forearm-isometric","2 × 30 s / côté","Auto-résistance légère, indolore"],
    ["shortfoot","2 × 10","Activation du pied"],
    ["deadbug","2 × 8 / côté","Gainage léger"]
  ]});

  const wb = APP_DATA.workouts.find(w => w.id === "B");
  if (wb) wb.exercises = wb.exercises.map(x => x[0] === "handstand-wall" ? ["pike-support","3 × 20 s","Parcours inversion débutant"] : x);

  state.pathwayState ||= {};
  if (state.pathwayState.inversion == null) state.pathwayState.inversion = 0;
  if (typeof SKILL_PATHWAYS !== "undefined" && !SKILL_PATHWAYS.inversion) {
    SKILL_PATHWAYS.inversion = {name:"Appui renversé",steps:[
      {id:"pike-support",label:"Maintien en pike",criterion:"3 × 30 s stables, sans douleur"},
      {id:"elevated-pike",label:"Pike pieds surélevés",criterion:"3 × 30 s stables"},
      {id:"wall-walk-partial",label:"Wall walk partiel",criterion:"3 × 3 contrôlés, sans appréhension"},
      {id:"handstand-wall",label:"Handstand au mur",criterion:"Introduit uniquement après validation des étapes précédentes"}
    ]};
  }
  if (typeof EXERCISE_RULES !== "undefined") {
    Object.assign(EXERCISE_RULES,{
      "pike-support":{type:"time",step:5,minSeconds:15,maxSeconds:30},
      "elevated-pike":{type:"time",step:5,minSeconds:15,maxSeconds:30},
      "wall-walk-partial":{type:"reps",step:1,minReps:2,maxReps:3},
      "wall-slide":{type:"reps",step:1,minReps:8,maxReps:12},
      "forearm-isometric":{type:"time",step:5,minSeconds:20,maxSeconds:40}
    });
  }

  // UCPA: keep the sports-racket week, but add a very light mobility/recovery routine.
  const originalApplySpecial = applySpecial;
  applySpecial = function(sp, doSave=true){
    if (sp.type !== "ucpa") return originalApplySpecial(sp, doSave);
    const start = parseDate(sp.start);
    for (let i=0;i<7;i++) {
      const ds=fmtDate(addDays(start,i));
      state.events[ds]=[{type:"special",label:"Stage UCPA — sports de raquette"},{type:"workout",id:"U"}];
    }
    if(doSave) save();
  };
  (state.special||[]).filter(sp=>sp.type==="ucpa").forEach(sp=>applySpecial(sp,false));
  localStorage.setItem(storeKey,JSON.stringify(state));

  // Progressive inversion: the initial prescription never starts with a handstand.
  const oldStartSession = startSession;
  startSession = function(workoutId,date){
    if (workoutId !== "B") return oldStartSession(workoutId,date);
    const w=structuredClone(workoutById(workoutId));
    w.exercises=w.exercises.map(x=>{
      const [eid,dose,note]=x;
      if(eid==="dead-hang"||eid==="assisted-pullup"){
        const step=getCurrentPathExercise("pullup");
        return [step.id,step.id.includes("hang")||step.id==="negative-pullup"?"3 séries":"3 × 5–8",`Parcours traction · ${step.criterion}`];
      }
      if(eid==="support-hold"){
        const step=getCurrentPathExercise("dip");
        return [step.id,step.id==="support-hold"?"3 × 20–30 s":"3 × 5–8",`Parcours dips · ${step.criterion}`];
      }
      if(eid==="pike-support"){
        const step=getCurrentPathExercise("inversion");
        return [step.id,step.id==="wall-walk-partial"?"3 × 3":"3 × 20–30 s",`Parcours inversion · ${step.criterion}`];
      }
      return x;
    });
    liveSession={workoutId,date,index:0,startedAt:new Date().toISOString(),exercises:w.exercises.map(([eid,dose,note])=>{
      const n=parseSetCount(dose),last=getLastExerciseLog(eid),target=getAdaptiveTarget(eid,dose,n,last);
      return {id:eid,dose,note,target,rpe:null,pain:0,notes:"",sets:Array.from({length:target.sets||n},(_,i)=>({load:target.load??last?.sets?.[i]?.load??state.exerciseDefaults[eid]?.load??"",reps:target.reps??last?.sets?.[i]?.reps??parseRepHint(dose).split(/[–-]/)[0]??"",seconds:target.seconds??"",done:false}))};
    })};
    $("#workoutDialog").close();
    $$(".view").forEach(v=>v.classList.remove("active"));$("#sessionView").classList.add("active");
    $$(".bottom-nav button").forEach(x=>x.classList.remove("active"));renderLiveSession();
  };

  const oldEval = evaluatePathwayProgress;
  evaluatePathwayProgress = function(log){
    oldEval(log);
    const p=SKILL_PATHWAYS.inversion,idx=state.pathwayState.inversion||0,step=p.steps[idx];
    const ex=(log.exercises||[]).find(x=>x.id===step.id); if(!ex)return;
    const done=(ex.sets||[]).filter(s=>s.done); if(!done.length||ex.pain>=3||(ex.rpe||3)>=5)return;
    let mastered=false;
    if(step.id==="pike-support"||step.id==="elevated-pike"){const secs=done.map(s=>+s.seconds||0);mastered=done.length>=3&&Math.min(...secs)>=30&&(ex.rpe||3)<=3;}
    else if(step.id==="wall-walk-partial"){const reps=done.map(s=>+s.reps||0);mastered=done.length>=3&&Math.min(...reps)>=3&&(ex.rpe||3)<=3;}
    if(mastered&&idx<p.steps.length-1)state.pathwayState.inversion=idx+1;
  };

  function demoUrl(e){
    const direct={
      "dead-hang":"https://www.hybridcalisthenics.com/barhangs",
      "splitstep":"https://thepadelschool.com/padel-tips/how-to-move-your-feet",
      "anklemob":"https://e3rehab.com/ankle-dorsiflexion/"
    };
    if(direct[e.id])return direct[e.id];
    const source=e.cat==="Calisthénie"?"Hybrid Calisthenics":e.cat==="Agilité"?"The Padel School":"E3 Rehab";
    return "https://www.youtube.com/results?search_query="+encodeURIComponent(source+" "+e.name);
  }
  openExercise = function(id){
    const e=exById(id),last=getLastExerciseLog(id);
    $("#exerciseDetail").innerHTML=`<div class="eyebrow">${e.cat.toUpperCase()}</div><h2>${e.name}</h2><p>${e.goal}</p>${last?`<div class="last-load">Dernière réalisation : <strong>${formatLastLog(last)}</strong></div>`:""}<a class="secondary demo-link" href="${demoUrl(e)}" target="_blank" rel="noopener">▶ Voir une démonstration externe</a><p class="resource-note">Ressource vidéo ou pédagogique sélectionnée selon le type d'exercice.</p><div class="cue"><strong>Exécution</strong><p>${e.how}</p></div><div class="cue"><strong>Repères techniques</strong><ul>${e.cues.map(x=>`<li>${x}</li>`).join("")}</ul></div><div class="cue"><strong>Erreurs fréquentes</strong><ul>${e.errors.map(x=>`<li>${x}</li>`).join("")}</ul></div><p class="muted">Une douleur inhabituelle ou croissante justifie d'arrêter l'exercice et de réévaluer la technique ou la charge.</p>`;
    $("#exerciseDialog").showModal();
  };

  // Deletion/undo of false entries.
  window.deleteMetric = i => {if(confirm("Supprimer cette saisie de suivi ?")){state.metrics.splice(i,1);save();}};
  window.deleteTrainingLog = key => {if(confirm("Supprimer cette séance de l'historique ?")){state.trainingLog=state.trainingLog.filter(l=>(l.endedAt||l.startedAt||l.date)!==key);save();}};
  window.deleteJournal = key => {if(confirm("Supprimer cette note du journal ?")){state.journal=state.journal.filter(j=>(j.savedAt||j.date)!==key);save();}};

  const oldSaveJournal=saveJournalEntry;
  saveJournalEntry=function(){
    const before=state.journal.length; oldSaveJournal();
    if(state.journal.length>before){const j=state.journal[state.journal.length-1];j.savedAt||=(new Date().toISOString());localStorage.setItem(storeKey,JSON.stringify(state));}
  };
  $("#saveJournal").onclick=saveJournalEntry;

  const oldRenderProgress=renderProgress;
  renderProgress=function(){oldRenderProgress();const m=state.metrics[state.metrics.length-1];if(m&&$("#latestMetrics .card")&&!$("#latestMetrics .danger-button")){const d=document.createElement("div");d.className="history-actions";d.innerHTML=`<button class="danger-button" onclick="deleteMetric(${state.metrics.length-1})">Supprimer cette saisie</button>`;$("#latestMetrics .card").appendChild(d);}};
  const oldRenderHistory=renderTrainingHistory;
  renderTrainingHistory=function(){oldRenderHistory();const els=$$("#trainingHistory .history-item");[...state.trainingLog].reverse().slice(0,12).forEach((log,i)=>{if(els[i]&&!els[i].querySelector(".danger-button")){const d=document.createElement("div");d.className="history-actions";d.innerHTML=`<button class="danger-button" onclick="deleteTrainingLog('${log.endedAt||log.startedAt||log.date}')">Supprimer</button>`;els[i].appendChild(d);}});};
  const oldRenderJournal=renderJournal;
  renderJournal=function(){oldRenderJournal();const entries=[...state.journal].reverse().slice(0,15),els=$$("#journalHistory .history-item");entries.forEach((j,i)=>{if(els[i]&&!els[i].querySelector(".danger-button")){const d=document.createElement("div");d.className="history-actions";d.innerHTML=`<button class="danger-button" onclick="deleteJournal('${j.savedAt||j.date}')">Supprimer</button>`;els[i].appendChild(d);}});};

  // UI cleanup after installation.
  const plus=$("#installHelp");
  if(plus){plus.textContent="⚙";plus.setAttribute("aria-label","Réglages");plus.onclick=()=>{$$(".view").forEach(v=>v.classList.remove("active"));$("#settingsView").classList.add("active");$$(".bottom-nav button").forEach(x=>x.classList.remove("active"));window.scrollTo(0,0);};}
  const settingsTab=document.querySelector('.bottom-nav button[data-view="settingsView"]'); if(settingsTab)settingsTab.remove();
  document.documentElement.style.setProperty('--bottom-tabs','6');
  const style=document.createElement('style');style.textContent=`.bottom-nav{grid-template-columns:repeat(6,1fr)!important}.demo-link{display:block;width:100%;text-align:center;text-decoration:none;margin:12px 0}.danger-button{background:transparent;color:var(--danger);border:1px solid rgba(255,107,107,.35);border-radius:11px;padding:8px 10px}.history-actions{margin-top:8px}.resource-note{font-size:12px;color:var(--muted)}.form-note{grid-column:1/-1}`;document.head.appendChild(style);
  const exit=$("#exitSession");if(exit){exit.textContent="Annuler la séance";exit.onclick=()=>{if(confirm("Annuler cette séance ? Rien ne sera enregistré dans l’historique.")){liveSession=null;resetTimer(false);$$(".view").forEach(v=>v.classList.remove("active"));$("#homeView").classList.add("active");const h=document.querySelector('.bottom-nav button[data-view="homeView"]');if(h)h.classList.add("active");}};}
  const handstandInput=$("#handstand");if(handstandInput){const lab=handstandInput.closest('label');if(lab)lab.remove();}
  const ankleL=$("#ankleL");if(ankleL&&!document.querySelector('.dorsi-note')){const p=document.createElement('p');p.className='muted form-note dorsi-note';p.textContent='Dorsiflexion, grip, sprint et détente : surtout à renseigner lors des re-tests à 8 semaines, pas après chaque séance.';ankleL.closest('label').after(p);}

  // Remove handstand from quick skill goals until the pathway actually reaches it.
  const oldSkillGoals=renderSkillGoals;
  renderSkillGoals=function(){oldSkillGoals();const rows=$$("#skillGoals .skill-row");rows.forEach(r=>{if(r.textContent.includes("Handstand"))r.remove();});};

  // Re-render with patched logic.
  renderAll();
})();
