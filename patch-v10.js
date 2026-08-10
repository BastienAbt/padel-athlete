(() => {
  const SEARCH_TERMS={
    'box-jump':'box jump','leg-press':'leg press','rdl':'romanian deadlift','bulgarian-split':'bulgarian split squat','calf-straight':'standing calf raise','calf-bent':'seated calf raise','pallof':'pallof press','dead-hang':'dead hang','active-hang':'active hang','scap-pullup':'scapular pull up','negative-pullup':'negative pull up','assisted-pullup':'assisted pull up','pullup':'pull up','handstand-wall':'wall handstand','dip':'dips','row':'inverted row','incline-pushup':'incline push up','support-hold':'parallel bar support hold','pushup':'push up','woodchop':'cable wood chop','facepull':'face pull','wrist-ext':'wrist extension dumbbell','pronation':'forearm pronation','farmer':'farmers walk','splitstep':'split step','skater':'skater jump','reaction':'lateral reaction drill','lsit':'l sit','pistol':'pistol squat','deadbug':'dead bug','shortfoot':'short foot exercise','anklemob':'ankle dorsiflexion mobility','thoracic':'thoracic rotation quadruped','band-external':'band external rotation shoulder','pike-support':'pike hold','elevated-pike':'elevated pike hold','wall-walk-partial':'wall walk','wall-slide':'wall slide shoulder','forearm-isometric':'wrist extension isometric'
  };
  const CACHE_KEY='padelWgerVisualCacheV1';
  let catalogPromise=null;
  const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const words=s=>new Set(norm(s).split(' ').filter(Boolean));
  function scoreName(name,term){const a=words(name),b=words(term);let hit=0;b.forEach(w=>{if(a.has(w))hit+=3;else if([...a].some(x=>x.includes(w)||w.includes(x)))hit+=1});if(norm(name)===norm(term))hit+=20;if(norm(name).includes(norm(term))||norm(term).includes(norm(name)))hit+=8;return hit;}
  function cached(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')}catch(e){return{}}}
  function setCached(id,val){try{const c=cached();c[id]={...val,ts:Date.now()};localStorage.setItem(CACHE_KEY,JSON.stringify(c))}catch(e){}}
  async function getCatalog(){
    if(catalogPromise)return catalogPromise;
    catalogPromise=fetch('https://wger.de/api/v2/exerciseinfo/?limit=1000&language=2&status=2',{headers:{'Accept':'application/json'}}).then(r=>{if(!r.ok)throw new Error('wger '+r.status);return r.json()}).then(j=>j.results||[]);
    return catalogPromise;
  }
  function namesFor(item){const arr=[];(item.translations||[]).forEach(t=>{if(t.name)arr.push(t.name)});if(item.name)arr.push(item.name);return arr;}
  function imageUrls(item){
    const urls=[];(item.images||[]).forEach(im=>{const u=im.thumbnails?.medium||im.thumbnails?.small||im.image;if(u&&!urls.includes(u))urls.push(u)});return urls.slice(0,3);
  }
  async function findVisual(e){
    const c=cached()[e.id];if(c&&c.urls?.length)return c;
    const term=SEARCH_TERMS[e.id]||e.name;const cat=await getCatalog();let best=null,bestScore=0;
    for(const item of cat){const urls=imageUrls(item);if(!urls.length)continue;for(const n of namesFor(item)){const s=scoreName(n,term);if(s>bestScore){bestScore=s;best=item}}}
    if(!best||bestScore<3)return null;
    const urls=imageUrls(best);const trans=(best.translations||[]).find(t=>t.language===2)||(best.translations||[])[0]||{};
    const val={urls,name:trans.name||namesFor(best)[0]||e.name,license:best.license?.full_name||best.license?.short_name||best.license?.name||'',author:best.license_author||'',score:bestScore};setCached(e.id,val);return val;
  }
  function visualShell(e){return `<section class="real-visual-block" data-real-visual="${e.id}"><div class="real-visual-head"><strong>Démonstration visuelle</strong><span>Images réelles / illustrées</span></div><div class="real-visual-loading">Chargement du visuel de ${e.name}…</div></section>`;}
  async function hydrateVisual(e){
    const root=document.querySelector(`[data-real-visual="${e.id}"]`);if(!root)return;
    try{
      const v=await findVisual(e);
      if(!v||!v.urls?.length){root.innerHTML=`<div class="real-visual-unavailable"><strong>Visuel en cours de validation</strong><span>Aucun visuel suffisamment fiable n'a été trouvé automatiquement pour cet exercice. Le lien vidéo reste disponible.</span></div>`;return;}
      const labels=v.urls.length>=3?['Position 1','Position 2','Position 3']:v.urls.length===2?['Départ','Fin du mouvement']:['Démonstration'];
      root.innerHTML=`<div class="real-visual-head"><strong>Démonstration visuelle</strong><span>${v.name}</span></div><div class="real-visual-grid ${v.urls.length===1?'one':v.urls.length===2?'two':'three'}">${v.urls.map((u,i)=>`<figure><img src="${u}" alt="${e.name} — ${labels[i]}" loading="lazy" referrerpolicy="no-referrer"><figcaption>${labels[i]}</figcaption></figure>`).join('')}</div><div class="visual-source">Source : wger Exercise Wiki${v.author?` · ${v.author}`:''}${v.license?` · ${v.license}`:''}</div>`;
    }catch(err){root.innerHTML=`<div class="real-visual-unavailable"><strong>Visuel indisponible hors connexion</strong><span>Ouvre cette fiche une première fois avec Internet ; le lien vidéo reste disponible.</span></div>`;}
  }
  const previousOpen=openExercise;
  openExercise=function(id){
    const e=exById(id);if(!e)return previousOpen(id);
    previousOpen(id);
    const box=document.querySelector('#exerciseDetail');if(!box)return;
    box.querySelectorAll('.movement-diagram,.exercise-visual-v9,.visual-v9,.exercise-demo').forEach(x=>x.remove());
    box.querySelectorAll('svg').forEach(svg=>{const p=svg.closest('.movement-diagram,.exercise-visual-v9,.visual-v9');if(p)p.remove();});
    if(!box.querySelector(`[data-real-visual="${id}"]`)){
      const marker=[...box.children].find(x=>x.tagName==='P')||box.querySelector('h2');
      if(marker)marker.insertAdjacentHTML('afterend',visualShell(e));else box.insertAdjacentHTML('afterbegin',visualShell(e));
    }
    hydrateVisual(e);
  };
  // Remove any old explanatory copy praising simplified diagrams.
  document.querySelectorAll('.diagram-caption').forEach(x=>x.remove());
  const css=document.createElement('style');css.textContent=`
  .real-visual-block{margin:14px 0;background:var(--panel2);border:1px solid var(--line);border-radius:16px;padding:12px;overflow:hidden}
  .real-visual-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.real-visual-head strong{font-size:14px}.real-visual-head span,.visual-source{font-size:10px;color:var(--muted)}
  .real-visual-grid{display:grid;gap:8px}.real-visual-grid.three{grid-template-columns:repeat(3,1fr)}.real-visual-grid.two{grid-template-columns:repeat(2,1fr)}.real-visual-grid.one{grid-template-columns:1fr}
  .real-visual-grid figure{margin:0;background:#0b0f12;border:1px solid var(--line);border-radius:12px;overflow:hidden}.real-visual-grid img{display:block;width:100%;height:180px;object-fit:contain;background:#f6f6f4}.real-visual-grid figcaption{text-align:center;padding:7px 4px;font-size:10px;color:var(--muted)}
  .visual-source{margin-top:8px}.real-visual-loading,.real-visual-unavailable{min-height:160px;display:grid;place-content:center;text-align:center;gap:5px;color:var(--muted)}.real-visual-unavailable strong{color:var(--text)}
  @media(max-width:430px){.real-visual-grid img{height:150px}.real-visual-grid.three{gap:5px}}
  `;document.head.appendChild(css);
})();