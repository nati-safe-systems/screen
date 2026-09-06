/* =====================================================================
   נתי SAFE — התראות פיקוד העורף  ·  v1.0
   ---------------------------------------------------------------------
   תצוגה משלימה בלבד. אין להסתמך על המסך כאמצעי התרעה.
   המסך מציג חיווי חיבור גלוי — אם הקשר נופל, רואים את זה.

   שני מסלולים:
     1. חיבור ישיר (WebSocket) — מיידי, כשהרשת מאפשרת
     2. דרך Supabase — גיבוי, עד דקה של השהיה

   שימוש:
     NatiAlerts.init({ supa:SUPA, key:SKEY, areas:["ירושלים","בית שמש"] });
   ===================================================================== */
(function (root) {
  'use strict';

  var CFG = { supa:'', key:'', areas:[], testMode:false };
  /* שני מסלולים עצמאיים. החיווי מציג את הטוב מביניהם — קודם הם דרסו זה את זה. */
  var state = { wsOk:false, sbOk:false, sbMsg:'', last:null, active:null, hideT:null };
  var ws = null, poll = null, audioCtx = null, sirenTimer = null;

  /* ---------- ממשק ---------- */
  function ensureDom(){
    if (document.getElementById('nsf-alert')) return;

    var css = document.createElement('style');
    css.textContent =
      '#nsf-alert{position:fixed;inset:0;z-index:2147483000;display:none;' +
        'background:radial-gradient(ellipse at 50% 40%,#a11,#4a0000 60%,#1a0000);' +
        'color:#fff;direction:rtl;font-family:Assistant,Arial,sans-serif;' +
        'align-items:center;justify-content:center;text-align:center;' +
        'animation:nsfFlash 1.1s ease-in-out infinite}' +
      '@keyframes nsfFlash{0%,100%{filter:brightness(1)}50%{filter:brightness(1.45)}}' +
      '#nsf-alert .in{padding:4vh 3vw}' +
      '#nsf-alert .t{font-size:13vh;font-weight:900;line-height:1;letter-spacing:.02em;' +
        'text-shadow:0 0 6vh rgba(255,120,90,.8)}' +
      '#nsf-alert .s{font-size:4.6vh;font-weight:800;margin-top:2vh;color:#ffd9d2}' +
      '#nsf-alert .a{font-size:3.4vh;margin-top:2.4vh;color:#fff;background:rgba(0,0,0,.35);' +
        'border:2px solid rgba(255,255,255,.4);border-radius:1.4vh;padding:1.4vh 2.4vw;display:inline-block}' +
      '#nsf-alert .n{font-size:1.9vh;margin-top:3vh;color:rgba(255,255,255,.75)}' +
      '#nsf-conn{position:fixed;bottom:6px;left:6px;z-index:2147482000;' +
        'font:700 11px Assistant,Arial,sans-serif;direction:rtl;padding:2px 8px;' +
        'border-radius:9px;opacity:.85;pointer-events:none}' +
      '#nsf-conn.ok{background:rgba(20,60,35,.75);color:#7ee787;border:1px solid rgba(126,231,135,.4)}' +
      '#nsf-conn.no{background:rgba(70,20,20,.8);color:#ff9a9a;border:1px solid rgba(255,120,120,.5)}';
    document.head.appendChild(css);

    var d = document.createElement('div');
    d.id = 'nsf-alert';
    d.innerHTML = '<div class="in"><div class="t">צבע אדום</div>' +
      '<div class="s" id="nsf-alert-sub"></div>' +
      '<div class="a" id="nsf-alert-area"></div>' +
      '<div class="n">היכנסו למרחב המוגן · תצוגה משלימה בלבד, אין להסתמך עליה</div></div>';
    document.body.appendChild(d);

    var c = document.createElement('div');
    c.id = 'nsf-conn'; c.className = 'no'; c.textContent = 'פיקוד העורף: מתחבר...';
    document.body.appendChild(c);
  }

  function renderConn(){
    var c = document.getElementById('nsf-conn');
    if (!c) return;
    var ok = state.wsOk || state.sbOk;
    var txt = state.wsOk ? 'מחובר (ישיר)'
            : state.sbOk ? 'מחובר (גיבוי)'
            : (state.sbMsg || 'אין קשר');
    c.className = ok ? 'ok' : 'no';
    c.textContent = 'פיקוד העורף: ' + txt;
  }

  /* ---------- צליל ----------
     מייצרים צפירה בקוד, בלי קובץ חיצוני, כדי שתעבוד גם בלי רשת. */
  function siren(on){
    if (!on){ if (sirenTimer){ clearInterval(sirenTimer); sirenTimer = null; } return; }
    if (sirenTimer) return;
    function beep(){
      try{
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        var t = audioCtx.currentTime;
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(480, t);
        o.frequency.linearRampToValueAtTime(900, t + 0.9);
        o.frequency.linearRampToValueAtTime(480, t + 1.8);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.35, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(t); o.stop(t + 1.9);
      }catch(e){}
    }
    beep();
    sirenTimer = setInterval(beep, 2000);
  }

  /* ---------- הצגה ---------- */
  function show(areas, title){
    ensureDom();
    var d = document.getElementById('nsf-alert');
    document.getElementById('nsf-alert-sub').textContent  = title || 'ירי רקטות וטילים';
    document.getElementById('nsf-alert-area').textContent = (areas || []).join(' · ');
    d.style.display = 'flex';
    siren(true);
    state.active = { areas: areas, at: Date.now() };
    /* ההתראה נעלמת לבד אחרי 3 דקות */
    clearTimeout(state.hideT);
    state.hideT = setTimeout(hide, 3 * 60 * 1000);
  }
  function hide(){
    var d = document.getElementById('nsf-alert');
    if (d) d.style.display = 'none';
    siren(false);
    state.active = null;
  }

  /* ---------- האם ההתראה נוגעת לנו ---------- */
  function relevant(areas){
    if (!CFG.areas.length) return true;              /* לא הוגדרו אזורים — מציגים הכל */
    if (!areas || !areas.length) return false;
    for (var i=0;i<areas.length;i++)
      for (var j=0;j<CFG.areas.length;j++)
        if (String(areas[i]).indexOf(CFG.areas[j]) > -1 ||
            CFG.areas[j].indexOf(String(areas[i])) > -1) return true;
    return false;
  }

  function handle(payload){
    if (!payload) return;
    var areas = payload.cities || payload.areas || [];
    var title = payload.title || payload.desc || 'ירי רקטות וטילים';
    var id = (payload.id || '') + '|' + areas.join(',');
    if (id === state.last) return;                   /* אותה התראה שוב */
    state.last = id;
    if (relevant(areas)) show(areas, title);
  }

  /* ---------- מסלול 1: חיבור ישיר ---------- */
  function connectWs(){
    try{
      ws = new WebSocket('wss://ws.tzevaadom.co.il:8443/socket?platform=WEB');
      ws.onopen = function(){ state.wsOk = true; renderConn(); };
      ws.onmessage = function(ev){
        try{
          var m = JSON.parse(ev.data);
          if (m && m.type === 'ALERT' && m.data) handle(m.data);
        }catch(e){}
      };
      ws.onclose = function(){ state.wsOk = false; renderConn(); ws=null; setTimeout(connectWs, 30000); };
      ws.onerror = function(){ try{ ws.close(); }catch(e){} };
    }catch(e){ state.wsOk=false; renderConn(); setTimeout(connectWs, 60000); }
  }

  /* ---------- מסלול 2: דרך Supabase ---------- */
  function pollSupa(){
    if (!CFG.supa || !CFG.key) return;
    fetch(CFG.supa + '/rest/v1/alerts?select=*&order=created_at.desc&limit=1',
      { headers:{ apikey:CFG.key, Authorization:'Bearer ' + CFG.key }, cache:'no-store' })
      .then(function(r){ return r.json(); })
      .then(function(rows){
        if (!Array.isArray(rows)){
          /* תשובה שאינה רשימה = הטבלה חסרה או אין הרשאה */
          state.sbOk=false; state.sbMsg='טבלת ההתראות חסרה'; renderConn(); return;
        }
        state.sbOk = true; state.sbMsg=''; renderConn();
        if (!rows.length) return;
        var a = rows[0];
        if (Date.now() - new Date(a.created_at).getTime() > 5*60*1000) return;  /* ישן */
        handle({ id:a.id, cities:a.areas || [], title:a.title });
      })
      .catch(function(){ state.sbOk=false; state.sbMsg='אין קשר'; renderConn(); });
  }

  function init(opt){
    opt = opt || {};
    CFG.supa  = opt.supa || '';
    CFG.key   = opt.key  || '';
    CFG.areas = opt.areas || [];
    ensureDom();
    state.sbMsg='מתחבר...'; renderConn();
    connectWs();
    pollSupa();
    poll = setInterval(pollSupa, 20000);

    /* הדפדפן חוסם צליל ללא מגע — מנסים לשחרר בכל אינטראקציה */
    var unlock = function(){
      try{
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
      }catch(e){}
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    document.addEventListener('keydown', unlock);

    /* בדיקה ידנית: הוסף ?alerttest=1 לכתובת */
    try{
      if (new URLSearchParams(location.search).get('alerttest') === '1')
        setTimeout(function(){ show(CFG.areas.length?CFG.areas:['בדיקה'],'בדיקת מערכת'); }, 1500);
    }catch(e){}
  }

  root.NatiAlerts = { init:init, show:show, hide:hide, state:state };
})(typeof window !== 'undefined' ? window : globalThis);
