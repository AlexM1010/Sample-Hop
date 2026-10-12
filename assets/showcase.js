(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const frame = document.getElementById('app-preview'), loading = document.getElementById('preview-loading');
  let ready = false;
  const send = (action, value) => frame.contentWindow.postMessage({type:'samplehop-demo',action,value}, location.origin);
  function markReady() {
    if (ready) return;
    ready = true; loading.hidden = true;
    document.querySelectorAll('[data-demo]').forEach(el => el.disabled = false);
  }
  window.addEventListener('message', e => {
    if (e.origin === location.origin && e.source === frame.contentWindow && e.data?.type === 'samplehop-ready') markReady();
  });
  frame.addEventListener('load', () => {
    const check = setInterval(() => {
      if (frame.contentDocument?.getElementById('lv_body')) { clearInterval(check); markReady(); }
    }, 200);
    setTimeout(() => clearInterval(check), 30000);
  });
  setTimeout(() => {
    if (!ready) { loading.classList.add('preview-error'); loading.replaceChildren(document.createTextNode('The preview is taking longer to load. ')); const a=document.createElement('a');a.href='demo/index.html';a.textContent='Open it in a separate tab â†—';loading.append(a); }
  }, 20000);
  document.querySelectorAll('[data-demo]').forEach(el => el.addEventListener('click', () => {
    if (!ready) return;
    send(el.dataset.demo, el.dataset.value);
    document.querySelectorAll('.demo-guides button').forEach(b => b.setAttribute('aria-pressed',String(b === el)));
  }));
  document.getElementById('fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.getElementById('preview-shell').requestFullscreen(); }
    catch { window.open('demo/index.html','_blank','noopener'); }
  });
  document.addEventListener('fullscreenchange', () => { frame.style.height = document.fullscreenElement ? '100dvh' : ''; });
  const featureText = {
    kit:['Tap the pads to hear eight sounds from the demo library. Open the live app to build and play your own kit.','Kit'],
    layout:['Switch between the desktop viewerâ€™s arrangements and tweak the live physics. Explore sonic neighbourhoods from a new angle.','Layout'],
    project:['Set a tempo and key, find matching sounds, and audition them at your project tempo. Explore Keep pitch in the Project controls.','Project']
  };
  document.querySelectorAll('[data-feature]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-feature]').forEach(x => x.setAttribute('aria-pressed',String(x === b)));
    const [text,label] = featureText[b.dataset.feature];document.getElementById('feature-description').textContent=text;
    const link=document.getElementById('feature-open');link.dataset.demo=b.dataset.feature;link.textContent=`Try ${label} in the live app â†—`;
  }));
  if (!reduced.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    const observer=new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);} }),{threshold:.08});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  const wave=document.getElementById('hero-wave');
  for(let i=0;i<40;i++){const bar=document.createElement('i');bar.style.setProperty('--h',`${6+Math.abs(Math.sin(i*2.7))*24}px`);bar.style.setProperty('--delay',`${i*.04}s`);wave.append(bar);}
  const canvas=document.getElementById('constellation'),ctx=canvas.getContext('2d');
  const groups=[{x:.26,y:.28,c:'#75b7ff'},{x:.75,y:.34,c:'#96a9ff'},{x:.3,y:.72,c:'#57c7df'},{x:.72,y:.75,c:'#c2a3ff'}];
  let seed=19;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const dots=Array.from({length:210},(_,i)=>{const g=groups[i%4],a=rand()*Math.PI*2,r=Math.sqrt(rand())*.22;return{x:g.x+Math.cos(a)*r,y:g.y+Math.sin(a)*r,c:g.c,r:1.3+rand()*2.2,phase:rand()*6.28};});
  let width=0,height=0,visible=true,raf=0;
  function draw(t){ctx.clearRect(0,0,width,height);const points=dots.map(d=>({...d,px:d.x*width+Math.sin(t*.00018+d.phase)*5,py:d.y*height+Math.cos(t*.00015+d.phase)*5}));
    ctx.lineWidth=.65;for(let i=0;i<points.length;i++)for(let j=i+4;j<Math.min(i+29,points.length);j+=4){const a=points[i],b=points[j];if(Math.hypot(a.px-b.px,a.py-b.py)<75){ctx.strokeStyle=a.c+'27';ctx.beginPath();ctx.moveTo(a.px,a.py);ctx.lineTo(b.px,b.py);ctx.stroke();}}
    for(const d of points){ctx.fillStyle=d.c;ctx.globalAlpha=.55+Math.sin(d.phase+t*.0005)*.2;ctx.beginPath();ctx.arc(d.px,d.py,d.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    if(visible&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(draw);
  }
  function start(){cancelAnimationFrame(raf);draw(performance.now());}
  new ResizeObserver(()=>{const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);start();}).observe(canvas);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;start();}).observe(canvas);
  document.addEventListener('visibilitychange',start);reduced.addEventListener('change',start);
  let padAudio=null;
  fetch('demo/payload.json').then(r=>{if(!r.ok)throw Error('demo data');return r.json();}).then(data=>{
    const terms=['kick','snare','hat','clap','bass','bell','synth','swoosh'],used=new Set();
    terms.forEach((term,index)=>{
      const samples=data.nodes.filter(n=>n.k==='sample');
      const n=samples.find(n=>!used.has(n.i)&&(n.role===term||n.l.toLowerCase().includes(term)))||samples.find(n=>!used.has(n.i)&&n.s<4)||samples[index];used.add(n.i);
      const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',`Play ${n.l}`);button.innerHTML=`<small>0${index+1}</small><span>${term.toUpperCase()}</span>`;
      button.addEventListener('click',async()=>{
        if(padAudio){padAudio.pause();padAudio.currentTime=0;}
        document.querySelectorAll('.pad-grid button').forEach(b=>b.classList.remove('active'));
        if (!padAudio) { padAudio=document.createElement('audio');padAudio.id='showcase-audio';padAudio.hidden=true;document.body.append(padAudio); }
        padAudio.src='demo/'+n.sp.split('/').map(encodeURIComponent).join('/');
        const current=padAudio;button.classList.add('active');document.getElementById('pad-status').textContent=n.l;
        current.addEventListener('ended',()=>button.classList.remove('active'),{once:true});
        try{await current.play();}catch{button.classList.remove('active');document.getElementById('pad-status').textContent='Audio could not play. Try another pad.';}
      });document.getElementById('pad-grid').append(button);
    });
  }).catch(()=>{document.getElementById('pad-status').textContent='Demo audio unavailable. Try the live app above.';});
})();
