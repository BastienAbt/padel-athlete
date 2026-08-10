(() => {
  const deepClone = x => JSON.parse(JSON.stringify(x));
  const BACKUP_KEY = "padelAthleteBackupsV1";
  const APP_VERSION = "v7";

  function meaningfulState(s){
    return (s.metrics?.length||0)+(s.trainingLog?.length||0)+(s.journal?.length||0)+(s.readiness?.length||0) > 0;
  }
  function makeBackup(reason){
    try{
      const raw=localStorage.getItem(BACKUP_KEY); const arr=raw?JSON.parse(raw):[];
      const today=fmtDate(new Date());
      const last=arr[arr.length-1];
      if(reason==="daily" && last?.date===today) return;
      if(meaningfulState(state)){
        arr.push({date:today,ts:new Date().toISOString(),reason,version:APP_VERSION,state:deepClone(state)});
        while(arr.length>6) arr.shift();
        localStorage.setItem(BACKUP_KEY,JSON.stringify(arr));
      }
    }catch(e){console.warn("Backup impossible",e)}
  }
  makeBackup("upgrade-v7");

  const originalSave = save;
  save = function(){ makeBackup("daily"); originalSave(); };

  function restoreLastBackup(){
    try{
      const arr=JSON.parse(localStorage.getItem(BACKUP_KEY)||"[]");
      if(!arr.length){alert("Aucune sauvegarde locale disponible.");return;}
      const b=arr[arr.length-1];
      if(confirm(`Restaurer la sauvegarde du ${new Date(b.ts).toLocaleString("fr-FR")} ?`)){
        state=deepClone(b.state); localStorage.setItem(storeKey,JSON.stringify(state)); location.reload();
      }
    }catch(e){alert("Impossible de restaurer la sauvegarde.")}
  }
  window.restoreLastBackup=restoreLastBackup;

  // UCPA: only one useful card, no duplicate informational card.
  const oldApplySpecial = applySpecial;
  applySpecial = function(sp, doSave=true){
    if(sp.type!=="ucpa") return oldApplySpecial(sp,doSave);
    const start=parseDate(sp.start);
    for(let i=0;i<7;i++){
      const ds=fmtDate(addDays(start,i));
      state.events[ds]=[{type:"workout",id:"U"}];
    }
    if(doSave) save();
  };
  (state.special||[]).filter(sp=>sp.type==="ucpa").forEach(sp=>applySpecial(sp,false));
  localStorage.setItem(storeKey,JSON.stringify(state));

  // Minimal manual tracking: only measures that are easy to obtain.
  ["pullups","pushups","lsit","handstand","gripR","gripL","ankleR","ankleL"].forEach(k=>{try{delete metricDefs[k]}catch(e){}});
  const manualKeep = new Set(["metricDate","weight","waist","restHr","jump","sprint5"]);
  const progressForm = document.querySelector("#progressView .form-grid");
  if(progressForm){
    [...progressForm.querySelectorAll("label")].forEach(l=>{const input=l.querySelector("input");if(input && !manualKeep.has(input.id)) l.remove();});
    const details=document.createElement("details"); details.className="optional-tests";
    details.innerHTML='<summary>Tests optionnels de performance</summary><p class="muted">À utiliser seulement si tu veux les mesurer dans des conditions comparables, par exemple au re-test à 8 semaines.</p>';
    ["jump","sprint5"].forEach(id=>{const lab=progressForm.querySelector(`#${id}`)?.closest("label");if(lab)details.appendChild(lab);});
    progressForm.after(details);
  }

  // Re-test: no dynamometer required; dorsiflexion only if clinically/usefully relevant.
  renderRetest = function(){
    ensureRetestPlan();
    const days=daysBetween(fmtDate(new Date()),state.retest.next);
    if($("#retestBadge"))$("#retestBadge").textContent=days<=0?"À faire maintenant":days+" j";
    const items=[
      ["Poids + tour de taille","simple et reproductible"],
      ["FC de repos","optionnelle"],
      ["Parcours traction / poussée / inversion","issu des séances, sans test supplémentaire"],
      ["Détente verticale","optionnelle si mesure smartphone possible"],
      ["Sprint 5 m","optionnel"],
      ["Dorsiflexion cheville","uniquement si douleur/raideur cheville-pied ou besoin spécifique"]
    ];
    if($("#retestChecklist"))$("#retestChecklist").innerHTML=items.map(([a,b])=>`<div class="test-row"><span>${a}</span><span>${b}</span></div>`).join("");
  };

  // Skill progress is derived from workout logs/pathways, not manual duplicate entry.
  renderSkillGoals = function(){
    const el=$("#skillGoals"); if(!el)return;
    const rows=Object.entries(SKILL_PATHWAYS).map(([key,p])=>{
      const idx=state.pathwayState[key]||0;
      const step=p.steps[Math.min(idx,p.steps.length-1)];
      return `<div class="skill-row"><div class="skill-row-top"><strong>${p.name}</strong><span>Niveau ${idx+1}/${p.steps.length}</span></div><div class="adapt-meta">${step.label}</div><div class="skill-track"><div style="width:${Math.round((idx+1)/p.steps.length*100)}%"></div></div></div>`;
    });
    el.innerHTML=rows.join("");
  };

  // Simple in-app SVG diagrams: 3 phases, enough for a quick reminder.
  function svgFrame(x,label,pose){
    const y=32; let body="";
    const head=(cx,cy)=>`<circle cx="${cx}" cy="${cy}" r="6" fill="none" stroke="currentColor" stroke-width="2"/>`;
    const line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
    if(pose==="hang") body=head(x+35,y)+line(x+35,y+6,x+35,y+35)+line(x+35,y+13,x+18,y-2)+line(x+35,y+13,x+52,y-2)+line(x+35,y+35,x+24,y+58)+line(x+35,y+35,x+46,y+58)+line(x+12,y-7,x+58,y-7);
    else if(pose==="pull") body=head(x+35,y-8)+line(x+35,y-2,x+35,y+30)+line(x+35,y+8,x+20,y-4)+line(x+35,y+8,x+50,y-4)+line(x+35,y+30,x+25,y+54)+line(x+35,y+30,x+45,y+54)+line(x+12,y-7,x+58,y-7);
    else if(pose==="squat") body=head(x+35,y)+line(x+35,y+6,x+32,y+34)+line(x+32,y+34,x+18,y+48)+line(x+32,y+34,x+48,y+46)+line(x+35,y+16,x+18,y+26)+line(x+35,y+16,x+52,y+26);
    else if(pose==="hinge") body=head(x+44,y+8)+line(x+40,y+14,x+24,y+34)+line(x+24,y+34,x+22,y+58)+line(x+24,y+34,x+42,y+50)+line(x+31,y+26,x+54,y+34);
    else if(pose==="pushup") body=head(x+55,y+30)+line(x+49,y+33,x+18,y+42)+line(x+18,y+42,x+8,y+55)+line(x+34,y+38,x+30,y+58)+line(x+47,y+35,x+52,y+58);
    else if(pose==="pike") body=head(x+16,y+34)+line(x+21,y+34,x+40,y+20)+line(x+40,y+20,x+58,y+50)+line(x+23,y+31,x+18,y+56)+line(x+39,y+21,x+55,y+56);
    else if(pose==="calf") body=head(x+34,y)+line(x+34,y+6,x+34,y+38)+line(x+34,y+15,x+18,y+28)+line(x+34,y+15,x+50,y+28)+line(x+34,y+38,x+26,y+60)+line(x+34,y+38,x+44,y+56)+line(x+44,y+56,x+52,y+54);
    else if(pose==="lunge") body=head(x+34,y)+line(x+34,y+6,x+32,y+34)+line(x+32,y+34,x+14,y+50)+line(x+32,y+34,x+54,y+48)+line(x+34,y+16,x+18,y+26)+line(x+34,y+16,x+50,y+26);
    else if(pose==="core") body=head(x+35,y)+line(x+35,y+6,x+35,y+38)+line(x+35,y+16,x+14,y+16)+line(x+35,y+16,x+56,y+16)+line(x+35,y+38,x+24,y+58)+line(x+35,y+38,x+46,y+58);
    else body=head(x+35,y)+line(x+35,y+6,x+35,y+38)+line(x+35,y+16,x+16,y+27)+line(x+35,y+16,x+54,y+27)+line(x+35,y+38,x+24,y+58)+line(x+35,y+38,x+46,y+58);
    return `<g>${body}<text x="${x+35}" y="98" text-anchor="middle" font-size="11" fill="currentColor">${label}</text></g>`;
  }
  function diagramFor(e){
    let poses=["stand","stand","stand"],labels=["Départ","Mouvement","Retour"];
    if(["dead-hang","active-hang","scap-pullup","negative-pullup","assisted-pullup","pullup"].includes(e.id)){poses=["hang","pull","hang"];labels=["Suspension","Contrôle / tirage","Retour lent"];}
    else if(["leg-press","bulgarian-split","pistol"].includes(e.id)){poses=["stand","squat","stand"];labels=["Départ","Descente contrôlée","Poussée"];}
    else if(e.id==="rdl"){poses=["stand","hinge","stand"];labels=["Debout","Hanches en arrière","Extension"];}
    else if(["calf-straight","calf-bent"].includes(e.id)){poses=["stand","calf","stand"];labels=["Pied à plat","Montée sur pointe","Descente lente"];}
    else if(["pushup","incline-pushup","dip","support-hold"].includes(e.id)){poses=["stand","pushup","stand"];labels=["Gainage","Descente / maintien","Poussée"];}
    else if(["pike-support","elevated-pike","wall-walk-partial","handstand-wall"].includes(e.id)){poses=["stand","pike","pike"];labels=["Installation","Appui actif","Retour contrôlé"];}
    else if(["deadbug","pallof","woodchop","lsit"].includes(e.id)){poses=["core","core","core"];labels=["Position","Contrôle","Retour"];}
    else if(["splitstep","skater","reaction","box-jump"].includes(e.id)){poses=["stand","lunge","stand"];labels=["Prêt","Déplacement","Stabiliser"];}
    else if(["anklemob","thoracic","wall-slide","shortfoot","wrist-ext","pronation","facepull","band-external","forearm-isometric"].includes(e.id)){poses=["stand","core","stand"];labels=["Position","Amplitude contrôlée","Retour"];}
    return `<div class="movement-diagram"><svg viewBox="0 0 240 108" role="img" aria-label="Schéma simplifié de ${e.name}">${svgFrame(5,labels[0],poses[0])}${svgFrame(85,labels[1],poses[1])}${svgFrame(165,labels[2],poses[2])}</svg><div class="diagram-caption">Schéma simplifié pour rappel rapide — la fiche et la démonstration externe priment pour la technique.</div></div>`;
  }

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
    $("#exerciseDetail").innerHTML=`<div class="eyebrow">${e.cat.toUpperCase()}</div><h2>${e.name}</h2><p>${e.goal}</p>${diagramFor(e)}${last?`<div class="last-load">Dernière réalisation : <strong>${formatLastLog(last)}</strong></div>`:""}<a class="secondary demo-link" href="${demoUrl(e)}" target="_blank" rel="noopener">▶ Voir la démonstration détaillée</a><div class="cue"><strong>Exécution</strong><p>${e.how}</p></div><div class="cue"><strong>Repères techniques</strong><ul>${e.cues.map(x=>`<li>${x}</li>`).join("")}</ul></div><div class="cue"><strong>Erreurs fréquentes</strong><ul>${e.errors.map(x=>`<li>${x}</li>`).join("")}</ul></div><p class="muted">Une douleur inhabituelle ou croissante justifie d'arrêter l'exercice et de réévaluer la technique ou la charge.</p>`;
    $("#exerciseDialog").showModal();
  };

  // Data safety UI in Settings.
  const dataCard=[...document.querySelectorAll('#settingsView .card')].find(c=>c.querySelector('h3')?.textContent.trim()==='Données');
  if(dataCard && !document.getElementById('restoreBackupBtn')){
    const p=document.createElement('p');p.className='muted';p.textContent='Les mises à jour ne doivent pas effacer tes données : elles restent dans le stockage local. Une sauvegarde locale automatique est maintenant créée avant les changements importants.';dataCard.appendChild(p);
    const b=document.createElement('button');b.id='restoreBackupBtn';b.className='secondary';b.style.marginTop='8px';b.textContent='Restaurer la dernière sauvegarde locale';b.onclick=restoreLastBackup;dataCard.appendChild(b);
  }

  const css=document.createElement('style');css.textContent=`.movement-diagram{background:var(--panel2);border:1px solid var(--line);border-radius:16px;padding:10px;margin:12px 0;color:var(--text)}.movement-diagram svg{width:100%;height:auto;display:block}.diagram-caption{font-size:11px;color:var(--muted);margin-top:4px}.optional-tests{margin:12px 0;background:var(--panel2);border-radius:14px;padding:12px}.optional-tests summary{font-weight:700;cursor:pointer}.optional-tests label{margin-top:10px}`;document.head.appendChild(css);

  renderAll();
})();
