/* ============================================================
   THE OPENING  —  cut the cake → video → the page
   ------------------------------------------------------------
   The cake is the first thing she sees. Cutting it sets off the
   applause, and her tap is also the gesture browsers require
   before any sound will play. Skip unlocks 5 seconds into the
   video, the way ads do.
   ============================================================ */
(function intro(){
  const wrap    = document.getElementById('intro');
  const video   = document.getElementById('intro-video');
  const stage   = document.getElementById('cake-stage');
  const cake    = document.getElementById('bigcake');
  const cutBtn  = document.getElementById('cut-btn');
  const doneMsg = document.getElementById('cake-done');
  const skip    = document.getElementById('skip');
  const count   = document.getElementById('skip-count');

  if (!wrap || !video){ document.body.classList.remove('intro-locked'); return; }

  const SKIP_AFTER = 5;          // seconds before Skip unlocks
  let ended = false, cutDone = false, ticker = null;

  /* ---------- she cuts the cake ----------
     Her tap is also the gesture that lets the browser play sound, so the
     applause and the video both work from here on. */
  function cut(){
    if (cutDone) return;
    cutDone = true;

    cutBtn.disabled = true;
    cake.classList.add('cutting');          // knife swings down

    // start loading the video now, so it's ready when the cheering ends
    try{ video.load(); }catch(e){}

    // candles go out as the blade lands
    setTimeout(() => cake.classList.add('blown'), 520);

    // the slice separates and falls — and the room erupts
    setTimeout(() => {
      cake.classList.add('cut');
      celebrate();                          // ~4s of clapping
      if (typeof confetti === 'function') confetti(150, 0.55);
    }, 900);

    // keep the confetti coming so the celebration really lands
    setTimeout(() => { if (typeof confetti === 'function') confetti(90, 0.6); }, 1700);
    setTimeout(() => { if (typeof confetti === 'function') confetti(70, 0.5); }, 2600);

    // let her enjoy it before anything moves on
    setTimeout(() => {
      doneMsg.classList.add('show');
      cutBtn.classList.add('gone');
    }, 2200);

    // ~3.4s of celebrating after the slice falls, then the video
    setTimeout(playVideo, 4300);
  }

  /* ---------- 3. the video ---------- */
  function playVideo(){
    stage.classList.add('gone');
    wrap.classList.add('playing');
    video.play().then(startSkip).catch(() => {
      // if it refuses, don't trap her behind a dead screen
      finish();
    });
    // and if it simply never loads, move on rather than show black
    setTimeout(() => { if (!ended && video.readyState === 0) finish(); }, 12000);
  }

  function startSkip(){
    let left = SKIP_AFTER;
    count.textContent = 'Skip in ' + left;
    skip.classList.add('show');
    skip.style.setProperty('--p', '0%');

    ticker = setInterval(() => {
      left--;
      if (left > 0){
        count.textContent = 'Skip in ' + left;
        skip.style.setProperty('--p', ((SKIP_AFTER - left) / SKIP_AFTER * 100) + '%');
      } else {
        clearInterval(ticker);
        count.textContent = '';
        skip.disabled = false;
        skip.classList.add('ready');
        skip.style.setProperty('--p', '100%');
      }
    }, 1000);
  }

  /* ---------- 4. on to the birthday page ---------- */
  function finish(){
    if (ended) return;
    ended = true;
    clearInterval(ticker);
    try{ video.pause(); }catch(e){}
    wrap.classList.add('done');
    document.body.classList.remove('intro-locked');
    setTimeout(() => { if (typeof confetti === 'function') confetti(90, 0.55); }, 700);
  }

  /* ---------- applause, built in code so there's no file to load ----------
     Clapping is really just short bursts of filtered noise. Dozens of them
     at random offsets read as a room full of people. A few warm notes over
     the top turn it from noise into a celebration. */
  function celebrate(){
    let ac;
    try{ ac = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){ return; }                     // no audio support — skip silently
    if (ac.state === 'suspended') ac.resume();

    const t0 = ac.currentTime;

    /* Everything runs through a compressor so overlapping claps can't
       clip into a harsh crackle, then a master gain to set the level. */
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 24;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    const master = ac.createGain();
    master.gain.value = 0.85;

    comp.connect(master);
    master.connect(ac.destination);

    /* one clap = a very short burst of noise through a band-pass filter */
    function clap(at, gain){
      const len = Math.floor(ac.sampleRate * 0.055);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++){
        // noise with a sharp decay, so it snaps rather than hisses
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
      }
      const src = ac.createBufferSource();
      src.buffer = buf;

      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1100 + Math.random() * 1500;
      bp.Q.value = 0.8;

      const g = ac.createGain();
      g.gain.value = gain;

      src.connect(bp); bp.connect(g); g.connect(comp);
      src.start(at);
    }

    /* A burst that swells, holds, then thins out. Claps are spread evenly
       across the span (with jitter so they never sound mechanical) and it's
       the loudness envelope — not the spacing — that shapes the applause. */
    const CLAPS = 260, SPAN = 3.4;
    for (let i = 0; i < CLAPS; i++){
      const p = i / CLAPS;
      const at = t0 + 0.04 + p * SPAN + (Math.random() - 0.5) * 0.09;
      // quick swell (0-12%), full for a while, then a long fade
      const envelope =
        p < 0.12 ? p / 0.12
                 : Math.pow(1 - (p - 0.12) / 0.88, 0.85);
      clap(at, (0.03 + Math.random() * 0.045) * envelope);
    }

    /* a bright little fanfare riding over the top */
    const NOTES = [523.25, 659.25, 783.99, 1046.50];   // C E G C
    NOTES.forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const at = t0 + 0.06 + i * 0.1;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.16, at + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
      o.connect(g); g.connect(comp);
      o.start(at); o.stop(at + 1.2);
    });

    // release the audio device once the cheer has died away
    setTimeout(() => { try{ ac.close(); }catch(e){} }, 5000);
  }

  cutBtn.addEventListener('click', cut);
  cake.addEventListener('click', cut);              // tapping the cake works too
  skip.addEventListener('click', () => { if (!skip.disabled) finish(); });

  video.addEventListener('ended', finish);
  video.addEventListener('error', finish);          // missing/corrupt file
})();

/* ============================================================
   Happy Birthday — interactions
   ============================================================ */

/* ---------- state ---------- */
const state = {
  movie: null,
  dates: [],        // array of "YYYY-M-D"
  time: null,
  suggestion: null  // a film she writes in herself — optional
};

/* ---------- scene navigation ---------- */
const scenes = document.querySelectorAll('.scene');

function go(id){
  const current = document.querySelector('.scene.active');
  const next = document.getElementById(id);
  if (!next || current === next) return;

  if (current){
    current.classList.add('leaving');
    current.classList.remove('active');
    setTimeout(() => current.classList.remove('leaving'), 700);
  }
  setTimeout(() => {
    next.classList.add('active');
    next.scrollTop = 0;
    if (id === 'scene-thanks') fillTicket();
  }, current ? 420 : 0);
}

document.querySelectorAll('[data-go]').forEach(el => {
  el.addEventListener('click', () => {
    // saying yes deserves a little celebration
    if (el.dataset.go === 'scene-date') confetti(70, 0.6);
    go(el.dataset.go);
  });
});

/* ---------- the playful "no" button ----------
   It dodges a few times before finally letting her through.  */
const btnNo = document.getElementById('btn-no');
let dodges = 0;

function dodge(){
  if (dodges >= 3) return;
  dodges++;
  const x = (Math.random() - 0.5) * 180;
  const y = (Math.random() - 0.5) * 90;
  btnNo.style.transform = `translate(${x}px, ${y}px)`;
  btnNo.querySelector('span').textContent =
    ['Are you sure?', 'Really?', 'Okay… fine.'][dodges - 1];
}

btnNo.addEventListener('mouseenter', dodge);
btnNo.addEventListener('click', e => {
  if (dodges < 3){ e.preventDefault(); dodge(); return; }
  btnNo.style.transform = '';
  go('scene-convince');          // one more try, with the photo
});

/* if she still says no after the photo, that's genuinely fine */
document.getElementById('btn-no-final').addEventListener('click', () => {
  sendAnswer();
  go('scene-letter');
});

/* ============================================================
   THE MOVIES  —  Star Cineplex, Dhaka
   ------------------------------------------------------------
   Each film gets its own banner, drawn in CSS so nothing can
   break or fail to load. `art` picks the banner treatment.
   ============================================================ */
/* Showing now — if she picks a day on or before Thu 25 Sept */
const NOW_SHOWING = [
  { t:'The End of Oak Street',      g:'Thriller',   art:'oak', img:'assets/oak.jpg',
    d:'Quiet, strange and a little haunting. We can talk about it for days after.' },
  { t:'The Odyssey',                g:'Adventure',  art:'odyssey', img:'assets/odyssey.jpg',
    d:'Big, sweeping, gorgeous. The kind that deserves the huge screen.' },
  { t:'Spider-Man: Brand New Day',  g:'Action',     art:'spider', img:'assets/spider.jpg',
    d:'Loud and fun and completely uncomplicated. Zero thinking required.' },
  { t:'Moana',                      g:'Family',     art:'moana', img:'assets/moana.jpg',
    d:'Warm, funny, and you will sing at least one song on the way home.' },
  { t:'Evil Dead: Burn',            g:'Horror',     art:'evil', img:'assets/evil.jpg',
    d:"You'll grab my arm at least twice — I'm counting on it." },
  { t:'Minions & Monster',          g:'Comedy',     art:'minions', img:'assets/minions.jpg',
    d:'Ridiculous. Silly. Exactly what we need after a long week.' },
  { t:'Insidious: Out of Further',  g:'Horror',     art:'insidious', img:'assets/insidious.jpg',
    d:'The scary one. You can hide behind my shoulder the whole time.' },
  { t:'PAW Patrol: The Dino Movie', g:'Animation',  art:'paw', img:'assets/paw.jpg',
    d:'Bright, loud and completely silly. No thinking allowed.' }
];

/* Coming soon — if she picks any day after 25 Sept */
const UPCOMING = [
  { t:'Jumanji: Open World',        g:'Adventure',  art:'jumanji', img:'assets/jumanji.jpeg',
    d:'Chaos and jungle and terrible decisions. Our kind of film.' },
  { t:'Avengers: Doomsday',         g:'Action',     art:'avengers', img:'assets/avengers.jpg',
    d:"The one everyone will be talking about. Let's be there first." },
  { t:'Dune: Part Three',           g:'Sci-Fi',     art:'dune', img:'assets/dune.jpg',
    d:'Enormous, slow and beautiful. Worth the good seats.' },
  { t:'Clayface',                   g:'Horror',     art:'clayface', img:'assets/clayface.jpg',
    d:'Dark, weird and gorgeous-looking. A proper night out.' },
  { t:'Digger',                     g:'Mystery',    art:'digger', img:'assets/digger.png',
    d:"Nobody knows much about it yet. Let's find out together." },
  { t:'Resident Evil',              g:'Horror',     art:'resident', img:'assets/resident.png',
    d:'Horror again, sorry. You can hide behind my shoulder.' }
];

/* ---------- movie selection ---------- */
const cardWrap   = document.getElementById('movie-cards');
const customIn   = document.getElementById('custom-input');
const btnMovie   = document.getElementById('btn-movie-next');
const movieSub   = document.getElementById('movie-sub');

function buildMovies(){
  cardWrap.innerHTML = '';

  /* Her chosen day decides the list: on or before Thu 25 Sept she sees
     what's actually in cinemas; any later day shows the upcoming slate. */
  const first = state.dates.length ? new Date(...parse(state.dates[0])) : null;
  if (first) first.setHours(0,0,0,0);
  const withinWeek = first && first <= WEEK_END;

  const list = withinWeek ? NOW_SHOWING : UPCOMING;

  // the list just changed, so any earlier pick no longer applies
  if (state.movie && !list.some(m => m.t === state.movie)) state.movie = null;

  movieSub.textContent = withinWeek
    ? "Here's what's playing at Star Cineplex that day."
    : "That's a little further out — so here's what's coming to Star Cineplex.";

  document.getElementById('list-head-label').textContent =
    withinWeek ? 'now showing' : 'coming soon';

  list.forEach((m, i) => {
    const b = document.createElement('button');
    b.className = 'card movie-card';
    b.dataset.movie = m.t;
    b.style.setProperty('--i', i);          // stagger the entrance
    /* The poster carries the artwork. The CSS gradient stays behind it as
       a fallback, so a missing file degrades to the painted banner
       instead of an empty box. */
    b.innerHTML =
      `<span class="banner banner-${m.art}">
         <span class="banner-art"></span>
         <span class="poster-bg" style="background-image:url('${m.img}')"></span>
         <img class="poster" src="${m.img}" alt="${m.t} poster"
              loading="lazy" decoding="async">
         <span class="banner-genre">${m.g}</span>
         <span class="tick">&#10003;</span>
       </span>` +
      `<span class="card-body">
         <span class="card-t">${m.t}</span>
         <span class="card-d">${m.d}</span>
       </span>`;

    // if a poster can't load, quietly fall back to the painted banner
    const im = b.querySelector('.poster');
    im.addEventListener('error', () => {
      im.remove();
      const bg = b.querySelector('.poster-bg');
      if (bg) bg.remove();
    });
    if (state.movie === m.t) b.classList.add('sel');   // keep her pick marked
    b.addEventListener('click', () => pickMovie(b, m));
    cardWrap.appendChild(b);
  });

  syncMovieBtn();
}

function pickMovie(btn, m){
  const wasSelected = btn.classList.contains('sel');
  cardWrap.querySelectorAll('.movie-card').forEach(o => o.classList.remove('sel'));

  if (wasSelected){                 // tapping it again clears it
    state.movie = null;
  } else {
    btn.classList.add('sel');
    state.movie = m.t;
    confetti(26, 0.62);
  }
  syncMovieBtn();
}

/* her own recommendation — completely optional */
customIn.addEventListener('input', () => {
  state.suggestion = customIn.value.trim() || null;
  syncMovieBtn();
});

/* She can continue once she's picked a film OR written one in.  */
function syncMovieBtn(){
  btnMovie.disabled = !(state.movie || state.suggestion);
}

btnMovie.addEventListener('click', () => {
  // read the box directly, so autofill/paste can't leave a stale value
  state.suggestion = customIn.value.trim() || null;
  go('scene-thanks');
});

/* ---------- calendar ---------- */
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const grid     = document.getElementById('cal-grid');
const calTitle = document.getElementById('cal-title');
const chips    = document.getElementById('date-chips');
const btnDate  = document.getElementById('btn-date-next');
const dateSub  = document.getElementById('date-sub');

const today = new Date();
today.setHours(0,0,0,0);
let viewY = today.getFullYear();
let viewM = today.getMonth();

const key  = (y,m,d) => `${y}-${m}-${d}`;
const parse = k => k.split('-').map(Number);

/* her birthday week — only used to tint those days in the calendar */
const WEEK_START = new Date(2026, 8, 18);
const WEEK_END   = new Date(2026, 8, 25);
[WEEK_START, WEEK_END].forEach(d => d.setHours(0,0,0,0));

function renderCal(){
  calTitle.textContent = `${MONTHS[viewM]} ${viewY}`;
  grid.innerHTML = '';

  const firstDow  = new Date(viewY, viewM, 1).getDay();
  const daysInMon = new Date(viewY, viewM + 1, 0).getDate();

  for (let i = 0; i < firstDow; i++){
    const blank = document.createElement('div');
    blank.className = 'day off';
    grid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMon; d++){
    const cell = document.createElement('button');
    cell.className = 'day';
    cell.textContent = d;

    const thisDate = new Date(viewY, viewM, d);
    thisDate.setHours(0,0,0,0);
    const k = key(viewY, viewM, d);

    /* Anything before today is out; every future day is hers. */
    if (thisDate < today) cell.classList.add('past');

    if (thisDate.getTime() === today.getTime()) cell.classList.add('today');
    if (state.dates.includes(k)) cell.classList.add('on');

    // gently mark the birthday week, and the day itself
    if (thisDate >= WEEK_START && thisDate <= WEEK_END)
      cell.classList.add('week');
    if (thisDate.getTime() === WEEK_START.getTime())
      cell.classList.add('bday');

    cell.addEventListener('click', () => toggleDate(k));
    grid.appendChild(cell);
  }
}

function toggleDate(k){
  const i = state.dates.indexOf(k);
  if (i > -1) state.dates.splice(i, 1);
  else        state.dates.push(k);

  state.dates.sort((a,b) => {
    const [ay,am,ad] = parse(a), [by,bm,bd] = parse(b);
    return new Date(ay,am,ad) - new Date(by,bm,bd);
  });

  renderCal();
  renderChips();
}

function pretty(k, opts = {}){
  const [y,m,d] = parse(k);
  const dt = new Date(y,m,d);
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getDay()];
  return opts.long
    ? `${dow}, ${MONTHS[m]} ${d}`
    : `${dow} ${d} ${MONTHS[m].slice(0,3)}`;
}

function renderChips(){
  chips.innerHTML = '';
  state.dates.forEach(k => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `<b>${pretty(k)}</b>`;
    const x = document.createElement('button');
    x.textContent = '×';
    x.setAttribute('aria-label', 'Remove date');
    x.addEventListener('click', () => toggleDate(k));
    chip.appendChild(x);
    chips.appendChild(chip);
  });

  // the time question only appears once she's picked a day
  timeWrap.classList.toggle('open', state.dates.length > 0);
  if (!state.dates.length) resetTime();
  btnDate.disabled = !(state.dates.length && state.time);
}

/* ---------- time of day — whole hours only ---------- */
const timeWrap = document.getElementById('time-wrap');
const timeEcho = document.getElementById('time-echo');
const hoursBox = document.getElementById('hours');
const ampmBox  = document.getElementById('ampm');

let pickedHour = null;
let pickedAmPm = 'PM';   // an evening film is the likelier plan

/* 12, 1, 2 … 11 — reading the way a clock does */
[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(h => {
  const b = document.createElement('button');
  b.className = 'hr';
  b.textContent = h;
  b.dataset.h = h;
  b.addEventListener('click', () => {
    pickedHour = h;
    hoursBox.querySelectorAll('.hr').forEach(o => o.classList.remove('sel'));
    b.classList.add('sel');
    syncTime();
  });
  hoursBox.appendChild(b);
});

ampmBox.querySelectorAll('.ap').forEach(b => {
  b.addEventListener('click', () => {
    pickedAmPm = b.dataset.ap;
    ampmBox.querySelectorAll('.ap').forEach(o => o.classList.remove('sel'));
    b.classList.add('sel');
    syncTime();
  });
});

function syncTime(){
  if (pickedHour === null){
    state.time = null;
    timeEcho.textContent = '';
  } else {
    state.time = `${pickedHour}:00 ${pickedAmPm}`;
    timeEcho.textContent = state.time;
    timeEcho.classList.remove('pop');
    void timeEcho.offsetWidth;
    timeEcho.classList.add('pop');
  }
  btnDate.disabled = !(state.dates.length && state.time);
}

function resetTime(){
  pickedHour = null;
  pickedAmPm = 'PM';
  hoursBox.querySelectorAll('.hr').forEach(o => o.classList.remove('sel'));
  ampmBox.querySelectorAll('.ap').forEach(o =>
    o.classList.toggle('sel', o.dataset.ap === 'PM'));
  timeEcho.textContent = '';
  state.time = null;
}

document.getElementById('cal-prev').addEventListener('click', () => {
  if (--viewM < 0){ viewM = 11; viewY--; }
  renderCal();
});
document.getElementById('cal-next').addEventListener('click', () => {
  if (++viewM > 11){ viewM = 0; viewY++; }
  renderCal();
});

btnDate.addEventListener('click', () => {
  buildMovies();
  confetti(60, 0.62);
  go('scene-movie');
});

renderCal();
renderChips();

/* ---------- ticket ---------- */
function fillTicket(){
  // if she only wrote one in, that's the feature
  document.getElementById('t-movie').textContent =
    state.movie || state.suggestion || '—';

  const sugRow = document.getElementById('t-sug-row');
  if (state.suggestion && state.movie){
    sugRow.style.display = '';
    document.getElementById('t-sug').textContent = state.suggestion;
  } else {
    sugRow.style.display = 'none';
  }
  document.getElementById('t-dates').textContent =
    state.dates.map(k => pretty(k, {long:true})).join('  ·  ') || '—';
  document.getElementById('t-plural').textContent =
    state.dates.length > 1 ? 's' : '';
  document.getElementById('t-time').textContent = state.time || '—';
  startCountdown();
  sendAnswer();
  burst();
  confetti(120, 0.55);
}

/* ---------- letter ---------- */
const envelope = document.getElementById('envelope');
const letter   = document.getElementById('letter');

document.getElementById('letter-date').textContent =
  new Date().toLocaleDateString(undefined, {
    year:'numeric', month:'long', day:'numeric'
  });

envelope.addEventListener('click', () => {
  envelope.classList.add('gone');
  setTimeout(() => letter.classList.add('show'), 380);
  burst();
  confetti(90, 0.5);
});

document.getElementById('btn-restart').addEventListener('click', () => {
  state.movie = null;
  state.dates = [];
  state.time = null;
  state.suggestion = null;
  viewY = today.getFullYear();
  viewM = today.getMonth();
  resetTime();
  timeWrap.classList.remove('open');
  dodges = 0;
  btnNo.style.transform = '';
  btnNo.querySelector('span').textContent = 'Not this time';
  cardWrap.querySelectorAll('.movie-card').forEach(c => c.classList.remove('sel'));
  customIn.value = '';
  btnMovie.disabled = true;
  envelope.classList.remove('gone');
  letter.classList.remove('show');
  blown = false;
  cake.classList.remove('out');
  wishHint.textContent = 'blow out the candle ✨';
  wishHint.classList.remove('done');
  clearInterval(cdTimer);
  alreadySent = false;
  document.getElementById('countdown').style.display = '';
  renderCal();
  renderChips();
  go('scene-open');
});

/* ============================================================
   Floating petals / sparks
   ============================================================ */
const cv  = document.getElementById('petals');
const ctx = cv.getContext('2d');
let W, H, bits = [];
const COLORS = ['#ffc94d', '#ff7eb3', '#ffe9a8', '#5ee7c4', '#64c8ff', '#b57bff'];

function size(){
  W = cv.width  = window.innerWidth;
  H = cv.height = window.innerHeight;
}
size();
window.addEventListener('resize', size);

function makeBit(y){
  return {
    x: Math.random() * W,
    y: y !== undefined ? y : H + 20,
    r: Math.random() * 2.4 + 0.7,
    vy: -(Math.random() * 0.45 + 0.15),
    vx: (Math.random() - 0.5) * 0.35,
    a: Math.random() * 0.5 + 0.12,
    c: COLORS[(Math.random() * COLORS.length) | 0],
    sw: Math.random() * Math.PI * 2,
    ss: Math.random() * 0.018 + 0.005
  };
}

for (let i = 0; i < 70; i++) bits.push(makeBit(Math.random() * H));

/* celebratory burst of upward sparks */
function burst(){
  for (let i = 0; i < 40; i++){
    const b = makeBit(H * 0.75 + Math.random() * H * 0.25);
    b.vy = -(Math.random() * 1.9 + 0.7);
    b.r  = Math.random() * 3 + 1.2;
    b.a  = Math.random() * 0.6 + 0.3;
    bits.push(b);
  }
}

function tick(){
  ctx.clearRect(0, 0, W, H);

  for (let i = bits.length - 1; i >= 0; i--){
    const b = bits[i];
    b.sw += b.ss;
    b.y  += b.vy;
    b.x  += b.vx + Math.sin(b.sw) * 0.45;

    if (b.y < -20){
      if (bits.length > 70) { bits.splice(i, 1); continue; }
      Object.assign(b, makeBit());
    }

    ctx.globalAlpha = b.a * (0.65 + Math.sin(b.sw) * 0.35);
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(tick);
}
tick();

/* ============================================================
   BIRTHDAY DECOR
   ============================================================ */

const PARTY = ['#ffc94d','#ff7eb3','#5ee7c4','#64c8ff','#b57bff','#ffe9a8'];

/* ---------- bunting flags ---------- */
(function buildFlags(){
  const wrap = document.getElementById('flags');
  const n = Math.max(9, Math.min(22, Math.round(window.innerWidth / 78)));
  for (let i = 0; i < n; i++){
    const f = document.createElement('div');
    f.className = 'flag';
    f.style.background = PARTY[i % PARTY.length];
    f.style.setProperty('--fd', (i * 0.14).toFixed(2) + 's');
    // follow the rope's sag
    const t = i / (n - 1);
    const sag = Math.sin(t * Math.PI) * 22;
    f.style.marginTop = (6 + sag) + 'px';
    wrap.appendChild(f);
  }
})();

/* ---------- balloons ---------- */
(function buildBalloons(){
  const wrap = document.getElementById('balloons');
  for (let i = 0; i < 9; i++){
    const b = document.createElement('div');
    b.className = 'balloon';
    b.style.left = (Math.random() * 92 + 2) + '%';
    b.style.setProperty('--bc', PARTY[(Math.random() * PARTY.length) | 0]);
    b.style.setProperty('--bw', (34 + Math.random() * 26).toFixed(0) + 'px');
    b.style.setProperty('--bt', (20 + Math.random() * 18).toFixed(1) + 's');
    b.style.setProperty('--bdel', (-Math.random() * 30).toFixed(1) + 's');
    b.innerHTML = '<div class="bulb"></div><div class="string"></div>';
    wrap.appendChild(b);
  }
})();

/* ---------- blow out the candle ---------- */
const cake = document.getElementById('cake');
const wishHint = document.getElementById('wish-hint');
let blown = false;

function blowOut(){
  if (blown) return;
  blown = true;
  cake.classList.add('out');
  wishHint.textContent = 'wish made 🤍';
  wishHint.classList.add('done');
  confetti(60);
}

cake.addEventListener('click', blowOut);

/* microphone: actually blow at it, if she allows the mic */
(function micBlow(){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  // only ask once she has interacted, to avoid an instant scary prompt
  const ask = () => {
    document.removeEventListener('click', ask);
    navigator.mediaDevices.getUserMedia({ audio:true }).then(stream => {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      (function listen(){
        if (blown){ stream.getTracks().forEach(t => t.stop()); ac.close(); return; }
        an.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        if (sum / buf.length > 62) blowOut();
        requestAnimationFrame(listen);
      })();
    }).catch(() => {});
  };
  document.addEventListener('click', ask, { once:true });
})();

/* ============================================================
   CONFETTI
   ============================================================ */
const cfc = document.createElement('canvas');
cfc.id = 'confetti';
cfc.style.cssText = 'position:fixed;inset:0;z-index:3;pointer-events:none;';
document.body.appendChild(cfc);
const cfx = cfc.getContext('2d');
let pieces = [];

function sizeCf(){ cfc.width = window.innerWidth; cfc.height = window.innerHeight; }
sizeCf();
window.addEventListener('resize', sizeCf);

function confetti(count = 90, originY = 0.5){
  for (let i = 0; i < count; i++){
    pieces.push({
      x: cfc.width * (0.3 + Math.random() * 0.4),
      y: cfc.height * originY,
      w: 5 + Math.random() * 7,
      h: 8 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 11,
      vy: -(Math.random() * 13 + 5),
      g: 0.26 + Math.random() * 0.14,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      c: PARTY[(Math.random() * PARTY.length) | 0],
      life: 1
    });
  }
  if (!cfRunning) runCf();
}

let cfRunning = false;
function runCf(){
  cfRunning = true;
  (function loop(){
    cfx.clearRect(0, 0, cfc.width, cfc.height);
    for (let i = pieces.length - 1; i >= 0; i--){
      const p = pieces[i];
      p.vy += p.g;
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > cfc.height + 40){ pieces.splice(i, 1); continue; }
      cfx.save();
      cfx.translate(p.x, p.y);
      cfx.rotate(p.rot);
      cfx.fillStyle = p.c;
      cfx.globalAlpha = 0.95;
      cfx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot)));
      cfx.restore();
    }
    cfx.globalAlpha = 1;
    if (pieces.length){ requestAnimationFrame(loop); }
    else { cfRunning = false; }
  })();
}


/* ============================================================
   COUNTDOWN to the first movie night
   ============================================================ */
let cdTimer = null;

function startCountdown(){
  clearInterval(cdTimer);
  if (!state.dates.length) return;

  const [y, m, d] = parse(state.dates[0]);

  // aim at the time she actually picked
  let hh = 20, mm = 0;
  if (state.time){
    const t = state.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (t){
      hh = Number(t[1]) % 12;
      if (/PM/i.test(t[3])) hh += 12;
      mm = Number(t[2]);
    }
  }
  const target = new Date(y, m, d, hh, mm, 0);

  const tick = () => {
    const diff = target - new Date();
    if (diff <= 0){
      document.querySelector('.cd-label').textContent = "it's tonight ♥";
      ['cd-d','cd-h','cd-m','cd-s'].forEach(id =>
        document.getElementById(id).textContent = '0');
      clearInterval(cdTimer);
      return;
    }
    const s = Math.floor(diff / 1000);
    document.getElementById('cd-d').textContent = Math.floor(s / 86400);
    document.getElementById('cd-h').textContent = String(Math.floor(s / 3600) % 24).padStart(2,'0');
    document.getElementById('cd-m').textContent = String(Math.floor(s / 60) % 60).padStart(2,'0');
    document.getElementById('cd-s').textContent = String(s % 60).padStart(2,'0');
  };
  tick();
  cdTimer = setInterval(tick, 1000);
}

/* ============================================================
   MUSIC
   ------------------------------------------------------------
   Browsers block audio until the person interacts with the page,
   so nothing plays on its own — she taps the button. Volume is
   faded in and out so it never starts or stops abruptly.
   ============================================================ */
const musicBtn = document.getElementById('music');
const track    = new Audio('assets/music.mp3');
track.loop = true;
track.volume = 0;
track.preload = 'none';           // don't spend her data until she asks

let musicOn = false, fadeTimer = null;
const MAX_VOL = 0.55;

function fadeTo(target, done){
  clearInterval(fadeTimer);
  fadeTimer = setInterval(() => {
    const diff = target - track.volume;
    if (Math.abs(diff) < 0.04){
      track.volume = target;
      clearInterval(fadeTimer);
      if (done) done();
      return;
    }
    track.volume = Math.min(1, Math.max(0, track.volume + diff * 0.18));
  }, 40);
}

musicBtn.addEventListener('click', () => {
  musicOn = !musicOn;
  musicBtn.classList.toggle('on', musicOn);
  musicBtn.setAttribute('aria-pressed', musicOn ? 'true' : 'false');

  if (musicOn){
    track.play().then(() => fadeTo(MAX_VOL)).catch(() => {
      // autoplay refused or file missing — undo the toggle silently
      musicOn = false;
      musicBtn.classList.remove('on');
      musicBtn.setAttribute('aria-pressed', 'false');
    });
  } else {
    fadeTo(0, () => track.pause());
  }
});

/* pause when she switches tabs, resume when she comes back */
document.addEventListener('visibilitychange', () => {
  if (!musicOn) return;
  if (document.hidden){ track.pause(); }
  else { track.play().catch(() => {}); }
});

/* ============================================================
   SEND HER ANSWER TO YOUR GOOGLE SHEET
   ------------------------------------------------------------
   Setup (5 minutes, all free — full steps in SETUP.md):
     1. Make a new Google Sheet
     2. Extensions > Apps Script, paste the code from SETUP.md
     3. Deploy > New deployment > Web app
          Execute as:    Me
          Who has access: Anyone
     4. Copy the /exec URL it gives you and paste it below
   Leave it as-is and nothing is sent (the page still works).
   ============================================================ */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwDyYmHliJq6cYI-ztxUi6wQ2rVtKeYPz0SbyxojBEyBtFSLPFPawA2Tzf8tNTJtsA4Kg/exec';

let alreadySent = false;

function sendAnswer(){
  if (alreadySent) return;
  if (!SHEET_URL || SHEET_URL.indexOf('script.google.com') === -1){
    console.log('[birthday] No sheet URL set — skipping send.');
    return;
  }
  alreadySent = true;

  const saidYes = !!(state.movie || state.suggestion);

  const payload = {
    answer:  saidYes ? 'YES' : 'NO',
    movie:   state.movie || state.suggestion || '— skipped the movie —',
    dates:   state.dates.length
               ? state.dates.map(k => pretty(k, {long:true})).join('  |  ')
               : '— none picked —',
    time:    state.time || '— none picked —',
    suggestion: state.suggestion || '',
    sent_at: new Date().toLocaleString()
  };

  /* no-cors: the browser won't let us read Apps Script's reply, but the
     row still lands in the sheet. We don't need a reply — she must never
     wait on a network call during her own birthday. */
  fetch(SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(() => console.log('[birthday] Sent to sheet.'))
  .catch(() => {
    alreadySent = false;
    console.log('[birthday] Send failed — saved locally instead.');
    try{
      localStorage.setItem('birthday_answer', JSON.stringify(payload));
    }catch(e){}
  });
}
