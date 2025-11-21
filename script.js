(function(){
  const byId = (id)=>document.getElementById(id);

  // Floating petals on home
  const petalsRoot = byId('floating-petals');
  if(petalsRoot){
    const count = 18;
    for(let i=0;i<count;i++){
      const p = document.createElement('div');
      p.className = 'petal';
      const delay = Math.random()*8;
      const duration = 12 + Math.random()*10;
      const left = Math.random()*100;
      p.style.left = left + 'vw';
      p.style.animationDuration = duration+'s';
      p.style.animationDelay = delay+'s';
      petalsRoot.appendChild(p);
    }
  }

  // Bokeh background dots to fill negative space
  const bokehRoot = byId('bokeh');
  if(bokehRoot){
    function seedBokeh(){
      bokehRoot.innerHTML = '';
      const vw = window.innerWidth, vh = window.innerHeight;
      const n = Math.max(16, Math.floor((vw*vh)/120000)); // responsive density
      for(let i=0;i<n;i++){
        const d = document.createElement('div');
        d.className = 'bokeh';
        const size = 80 + Math.random()*160; // 80-240px
        d.style.width = size+'px';
        d.style.height = size+'px';
        d.style.left = Math.random()*(vw - size) + 'px';
        d.style.top = Math.random()*(vh - size) + 'px';
        d.style.animationDelay = (Math.random()*4)+'s';
        bokehRoot.appendChild(d);
      }
    }
    seedBokeh();
    window.addEventListener('resize', ()=>{ seedBokeh(); });
  }

  // Sparkles on envelope hover
  const sparklesRoot = byId('ambient-sparkles');
  function spawnSparkles(x,y){
    if(!sparklesRoot) return;
    for(let i=0;i<5;i++){
      const s = document.createElement('div');
      s.className='sparkle';
      const ox = (Math.random()-0.5)*28;
      const oy = (Math.random()-0.5)*18;
      s.style.left = (x+ox)+'px';
      s.style.top = (y+oy)+'px';
      sparklesRoot.appendChild(s);
      setTimeout(()=>s.remove(), 900);
    }
  }
  document.querySelectorAll('[data-sparkle]').forEach(el=>{
    el.addEventListener('mouseenter', (e)=>{
      const rect = el.getBoundingClientRect();
      spawnSparkles(rect.left + rect.width/2, rect.top + rect.height/2);
    });
  });

  // Interactable background: click hearts & subtle cursor trail
  function spawnHeart(x,y){
    if(!sparklesRoot) return;
    const h = document.createElement('div');
    h.className = 'tap-heart';
    h.style.left = (x-9)+'px';
    h.style.top = (y-9)+'px';
    sparklesRoot.appendChild(h);
    setTimeout(()=>h.remove(), 1800);
  }
  let trailTick = 0;
  window.addEventListener('pointermove', (e)=>{
    if(!sparklesRoot) return;
    // throttle ~ every 40ms
    const now = performance.now();
    if(now - trailTick < 40) return;
    trailTick = now;
    const t = document.createElement('div');
    t.className = 'trail-spark';
    t.style.left = e.clientX+'px';
    t.style.top = e.clientY+'px';
    sparklesRoot.appendChild(t);
    setTimeout(()=>t.remove(), 700);
  }, { passive:true });
  window.addEventListener('click', (e)=>{
    // avoid triggering when clicking interactive controls
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if(['a','button','input','textarea','select','audio','video'].includes(tag)) return;
    spawnHeart(e.clientX, e.clientY);
  });

  // Ambient floating hearts with gentle mouse attraction
  (function(){
    const ambientRoot = petalsRoot || sparklesRoot;
    if(!ambientRoot) return;
    const hearts = [];
    const count = 28; // slightly denser to fill gaps
    let mouseX = NaN, mouseY = NaN;
    let vw = window.innerWidth, vh = window.innerHeight;
    window.addEventListener('resize', ()=>{ vw = window.innerWidth; vh = window.innerHeight; });
    window.addEventListener('pointermove', (e)=>{ mouseX = e.clientX; mouseY = e.clientY; }, { passive:true });

    for(let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className = 'ambient-heart';
      const size = 10 + Math.random()*10; // 10-20px
      el.style.width = size+'px';
      el.style.height = size+'px';
      ambientRoot.appendChild(el);
      hearts.push({
        el,
        x: Math.random()*vw,
        y: Math.random()*vh,
        vx: (Math.random()*0.3 - 0.15),
        vy: 0.15 + Math.random()*0.35, // slow downward drift
        wobble: Math.random()*Math.PI*2,
        wobbleSpeed: 0.01 + Math.random()*0.02,
        scale: 0.8 + Math.random()*0.5
      });
    }

    function step(){
      for(const h of hearts){
        // gentle horizontal wobble
        h.wobble += h.wobbleSpeed;
        const wobbleX = Math.sin(h.wobble) * 0.25;
        h.vx += wobbleX * 0.02;

        // mouse attraction within a radius
        if(!Number.isNaN(mouseX)){
          const dx = mouseX - h.x;
          const dy = mouseY - h.y;
          const dist2 = dx*dx + dy*dy;
          const radius = 220;
          if(dist2 < radius*radius){
            const dist = Math.sqrt(dist2) || 1;
            const nx = dx / dist;
            const ny = dy / dist;
            const strength = 0.06 * (1 - dist/radius); // stronger when closer
            h.vx += nx * strength;
            h.vy += ny * strength;
          }
        }

        // damping to keep motion soft
        h.vx *= 0.985;
        h.vy = h.vy*0.985 + 0.003; // tiny buoyancy

        h.x += h.vx;
        h.y += h.vy;

        // wrap around edges gently
        if(h.y > vh + 30){ h.y = -20; h.x = Math.random()*vw; }
        if(h.x < -30){ h.x = vw + 20; }
        if(h.x > vw + 30){ h.x = -20; }

        h.el.style.transform = `translate(${h.x}px, ${h.y}px) rotate(45deg) scale(${h.scale})`;
      }
      requestAnimationFrame(step);
    }
    step();
  })();

  // Background music toggle (home)
  const music = byId('bgMusic');
  const musicToggle = byId('musicToggle');
  if(music && musicToggle){
    let enabled = false;
    const ensureSrc = () => {
      if(!music.src){
        const ds = music.getAttribute('data-src');
        if(ds) music.src = ds;
      }
    };
    music.addEventListener('error', ()=>{
      enabled = false;
      musicToggle.setAttribute('aria-pressed', 'false');
      musicToggle.disabled = true;
      musicToggle.textContent = 'Music unavailable';
    });
    musicToggle.addEventListener('click', async ()=>{
      enabled = !enabled;
      musicToggle.setAttribute('aria-pressed', String(enabled));
      try{
        if(enabled){
          ensureSrc();
          await music.play();
        } else {
          music.pause();
        }
      }catch(err){ /* ignore autoplay block */ }
    });
  }

  // Hidden vault access (no password)
  const vaultTrigger = byId('vaultTrigger');
  if(vaultTrigger){
    vaultTrigger.addEventListener('click', ()=>{
      window.location.href = './vault.html';
    });
  }

  // Letter page typing + local audio toggle
  const letterRoot = document.querySelector('[data-letter-root]');
  if(letterRoot){
    const messageEl = letterRoot.querySelector('[data-message]');
    const full = (messageEl?.getAttribute('data-message')||'').trim();
    const speed = 22;
    let i=0;
    function type(){
      if(i<=full.length){
        messageEl.textContent = full.slice(0,i);
        i++;
        setTimeout(type, speed + Math.random()*40);
      }
    }
    setTimeout(type, 600);

    const audio = letterRoot.querySelector('audio');
    const toggle = letterRoot.querySelector('[data-audio-toggle]');
    if(audio && toggle){
      // Special popup for the vault button titled "how can i pretend - by me"
      if((toggle.textContent||'').toLowerCase().includes('how can i pretend')){
        toggle.addEventListener('click', (e)=>{
          e.preventDefault();
          e.stopPropagation();
          alert("I couldn't sing 'cause my voice cracked — but I'll sing tomorrow. ♡");
        }, { capture:true });
      }
      audio.addEventListener('error', ()=>{
        toggle.disabled = true;
        toggle.textContent = 'Voice note coming soon';
        toggle.setAttribute('aria-pressed','false');
      });
      let playing = false;
      toggle.addEventListener('click', async ()=>{
        playing = !playing;
        toggle.setAttribute('aria-pressed', String(playing));
        try{
          if(playing) { await audio.play(); }
          else { audio.pause(); }
        }catch(e){}
      });
    }
  }

  // Vault slider
  const slider = document.querySelector('[data-slider]');
  if(slider){
    async function exists(url){
      try{
        // Only attempt network check when running over http(s). On file:// this may fail.
        if(location.protocol.startsWith('http')){
          const res = await fetch(url, { method:'HEAD' });
          return res.ok;
        }
      }catch(e){}
      return true; // fall back to assuming it exists; 'error' event will still catch failures
    }
    function replaceWithPlaceholder(slideEl, text){
      const ph = document.createElement('div');
      ph.className = 'gallery-missing';
      ph.textContent = text;
      slideEl.replaceChildren(ph);
    }
    // If a stored config exists, rebuild slides
    try{
      const stored = localStorage.getItem('vaultMedia');
      if(stored){
        const list = JSON.parse(stored);
        if(Array.isArray(list) && list.length){
          const trackEl = slider.querySelector('.slides');
          trackEl.innerHTML = '';
          list.slice(0,6).forEach(item=>{
            const fig = document.createElement('figure');
            fig.className = 'slide';
            if(item.type === 'video'){
              const v = document.createElement('video');
              v.controls = true; v.preload = 'metadata';
              if(item.poster) v.setAttribute('poster', item.poster);
              const src = document.createElement('source');
              src.src = item.src; src.type = 'video/mp4';
              v.appendChild(src); fig.appendChild(v);
              // verify existence
              exists(item.src).then(ok=>{ if(!ok) replaceWithPlaceholder(fig, 'video not added yet'); });
            } else {
              const im = document.createElement('img');
              im.src = item.src; im.alt = item.alt || '';
              fig.appendChild(im);
              exists(item.src).then(ok=>{ if(!ok) replaceWithPlaceholder(fig, 'image not added yet'); });
            }
            trackEl.appendChild(fig);
          });
        }
      }
    }catch(e){}
    const track = slider.querySelector('.slides');
    const slides = Array.from(slider.querySelectorAll('.slide'));
    const prevBtn = slider.querySelector('.slider-btn.prev');
    const nextBtn = slider.querySelector('.slider-btn.next');
    const dotsRoot = slider.querySelector('.dots');

    // placeholders for missing media (image/video)
    slides.forEach(s=>{
      const img = s.querySelector('img');
      const vid = s.querySelector('video');
      if(img){
        img.addEventListener('error', ()=>{
          const ph = document.createElement('div');
          ph.className = 'gallery-missing';
          ph.textContent = 'image not added yet';
          s.replaceChildren(ph);
        }, { once:true });
        if(img.src) exists(img.src).then(ok=>{ if(!ok){ const ph=document.createElement('div'); ph.className='gallery-missing'; ph.textContent='image not added yet'; s.replaceChildren(ph);} });
      }
      if(vid){
        vid.addEventListener('error', ()=>{
          const ph = document.createElement('div');
          ph.className = 'gallery-missing';
          ph.textContent = 'video not added yet';
          s.replaceChildren(ph);
        }, { once:true });
        const source = vid.querySelector('source');
        const vsrc = source ? source.src : vid.src;
        if(vsrc) exists(vsrc).then(ok=>{ if(!ok){ const ph=document.createElement('div'); ph.className='gallery-missing'; ph.textContent='video not added yet'; s.replaceChildren(ph);} });
      }
    });

    let idx = 0;
    let lastIdx = 0;
    function pauseAllExcept(activeIndex){
      slides.forEach((s,i)=>{
        const v = s.querySelector('video');
        if(v){
          try{ if(i!==activeIndex) v.pause(); }catch(e){}
        }
      });
    }
    function render(dir){
      slides.forEach((s,i)=>{
        s.classList.remove('enter-left','enter-right','leave-left','leave-right','active');
      });
      const leaving = slides[lastIdx];
      const entering = slides[idx];
      if(leaving && leaving!==entering){
        leaving.classList.add(dir==='right' ? 'leave-left' : 'leave-right');
        setTimeout(()=>{ leaving.classList.remove('leave-left','leave-right'); }, 620);
      }
      if(entering){
        entering.classList.add('active', dir==='right' ? 'enter-right' : 'enter-left');
        setTimeout(()=>{ entering.classList.remove('enter-left','enter-right'); }, 30);
      }
      Array.from(dotsRoot.children).forEach((d,i)=>{
        d.setAttribute('aria-current', i===idx ? 'true' : 'false');
      });
      pauseAllExcept(idx);
    }
    function go(i){
      const newIdx = (i+slides.length)%slides.length;
      const dir = newIdx > idx || (newIdx===0 && idx===slides.length-1) ? 'right' : 'left';
      lastIdx = idx;
      idx = newIdx;
      render(dir);
    }
    function next(){ go(idx+1); }
    function prev(){ go(idx-1); }

    // dots
    dotsRoot.innerHTML = '';
    slides.forEach((_,i)=>{
      const b = document.createElement('button');
      b.type='button';
      b.addEventListener('click', ()=>go(i));
      dotsRoot.appendChild(b);
    });

    // swipe
    let startX=0, startY=0, swiping=false;
    track.addEventListener('pointerdown', (e)=>{ startX=e.clientX; startY=e.clientY; swiping=true; track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointerup', (e)=>{
      if(!swiping) return; swiping=false;
      const dx = e.clientX - startX; const dy = Math.abs(e.clientY - startY);
      if(Math.abs(dx)>40 && dy<60){ if(dx<0) next(); else prev(); }
    });

    // keys
    slider.addEventListener('keydown', (e)=>{ if(e.key==='ArrowRight') next(); if(e.key==='ArrowLeft') prev(); });
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    slider.tabIndex = 0; // focusable for arrow keys

    render('right');
  }

  // Admin page logic
  const admin = document.querySelector('[data-admin]');
  if(admin){
    const passOk = (function(){
      const q = new URLSearchParams(location.search);
      if(q.get('dev')==='1') return true;
      const a = prompt('Developer access password:');
      return (a||'').toLowerCase().trim() === 'devlove';
    })();
    if(!passOk){ location.href = './index.html'; }

    const itemsRoot = document.getElementById('items');
    const rows = 6;
    const state = [];
    function renderRow(i){
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="row">
          <label>Type:</label>
          <select data-type>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div class="row">
          <input type="file" data-file accept="image/*,video/mp4" />
        </div>
        <div class="row">
          <input type="text" data-path placeholder="or paste a path like assets/images/photo1.jpg" />
        </div>
        <div class="row" data-poster-row style="display:none">
          <input type="text" data-poster placeholder="optional video poster path (image)" />
        </div>
        <div class="preview" data-preview>no media yet</div>
      `;
      const typeSel = card.querySelector('[data-type]');
      const fileEl = card.querySelector('[data-file]');
      const pathEl = card.querySelector('[data-path]');
      const posterEl = card.querySelector('[data-poster]');
      const posterRow = card.querySelector('[data-poster-row]');
      const preview = card.querySelector('[data-preview]');

      function updatePreview(){
        preview.innerHTML = '';
        const t = typeSel.value;
        const pathVal = pathEl.value.trim();
        let srcVal = pathVal;
        if(!srcVal && fileEl.files && fileEl.files[0]){
          srcVal = URL.createObjectURL(fileEl.files[0]);
        }
        if(!srcVal){ preview.textContent = 'no media yet'; state[i] = null; return; }
        if(t==='video'){
          const v = document.createElement('video'); v.controls = true; v.src = srcVal; v.preload='metadata';
          preview.appendChild(v);
          state[i] = { type:'video', src: srcVal, poster: (posterEl.value||'').trim() };
        }else{
          const im = document.createElement('img'); im.src = srcVal; preview.appendChild(im);
          state[i] = { type:'image', src: srcVal };
        }
      }
      typeSel.addEventListener('change', ()=>{ posterRow.style.display = typeSel.value==='video' ? '' : 'none'; updatePreview(); });
      fileEl.addEventListener('change', updatePreview);
      pathEl.addEventListener('input', updatePreview);
      posterEl.addEventListener('input', updatePreview);

      itemsRoot.appendChild(card);
    }
    for(let i=0;i<6;i++) renderRow(i);

    const saveBtn = document.getElementById('saveAdmin');
    const clearBtn = document.getElementById('clearAdmin');
    saveBtn.addEventListener('click', ()=>{
      const filtered = state.filter(Boolean).slice(0,6);
      if(filtered.length===0){ alert('Add at least one item.'); return; }
      localStorage.setItem('vaultMedia', JSON.stringify(filtered));
      alert('Saved! Open the Vault to view.');
    });
    clearBtn.addEventListener('click', ()=>{ localStorage.removeItem('vaultMedia'); alert('Cleared vault media config.'); });
  }
})();


