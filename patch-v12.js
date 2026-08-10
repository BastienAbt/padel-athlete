(() => {
  function removeLegacyMovementBlocks(){
    const box=document.querySelector('#exerciseDetail');
    if(!box)return;

    const candidates=[...box.querySelectorAll('*')].filter(el=>/^mouvement\b/i.test((el.textContent||'').trim()));
    candidates.forEach(el=>{
      let node=el;
      let target=null;
      for(let i=0;i<6 && node && node!==box;i++,node=node.parentElement){
        const svgs=node.querySelectorAll?.('svg').length||0;
        const text=(node.textContent||'').trim();
        if(svgs>=3 && /^mouvement\b/i.test(text)){target=node;break;}
      }
      if(!target){
        node=el.parentElement;
        for(let i=0;i<5 && node && node!==box;i++,node=node.parentElement){
          const svgs=node.querySelectorAll?.('svg').length||0;
          if(svgs>=3){target=node;break;}
        }
      }
      if(target && !target.classList.contains('real-visual-block')) target.remove();
    });

    [...box.querySelectorAll('section,div')].forEach(node=>{
      if(node.classList.contains('real-visual-block'))return;
      const txt=(node.textContent||'').trim();
      if(/^mouvement\s*[—-]/i.test(txt) && (node.querySelectorAll('svg').length>=3 || /illustration intégrée pour rappel rapide/i.test(txt))) node.remove();
    });
  }

  const previousOpen=openExercise;
  openExercise=function(id){
    previousOpen(id);
    requestAnimationFrame(()=>{
      removeLegacyMovementBlocks();
      setTimeout(removeLegacyMovementBlocks,0);
    });
  };

  const observer=new MutationObserver(()=>removeLegacyMovementBlocks());
  const detail=document.querySelector('#exerciseDetail');
  if(detail)observer.observe(detail,{childList:true,subtree:true});
  removeLegacyMovementBlocks();
})();