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
  var state = { wsOk:false, apiOk:false, sbOk:false, rtOk:false, sbMsg:'', wsWhy:'',
                last:null, active:null, hideT:null };
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
    var ok = state.rtOk || state.wsOk || state.apiOk || state.sbOk;
    var txt = state.rtOk  ? 'מחובר · זמן אמת'
            : state.wsOk  ? 'מחובר (ישיר · חי)'
            : state.apiOk ? 'מחובר (ישיר)'
            : state.sbOk  ? 'מחובר (גיבוי)'
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
      ws.onclose = function(ev){
        state.wsOk = false;
        state.wsWhy = 'סגירה '+(ev&&ev.code||'?');
        renderConn(); ws=null;
        /* קוד 1006 חוזר = הרשת או השירות חוסמים. מפסיקים לנסות
           אחרי שלושה כשלונות, במקום להעמיס לנצח. */
        state.wsFails = (state.wsFails||0)+1;
        if (state.wsFails <= 3) setTimeout(connectWs, 30000);
        else state.wsWhy = 'חסום';
      };
      ws.onerror = function(){ try{ ws.close(); }catch(e){} };
    }catch(e){ state.wsOk=false; renderConn(); setTimeout(connectWs, 60000); }
  }

  /* ---------- מסלול 1ב: פנייה ישירה ב-HTTPS ----------
     ה-WebSocket רץ על פורט 8443 שהרבה רשתות חוסמות.
     כאן פונים על 443 הרגיל, שעובר כמעט תמיד. */
  function pollDirect(){
    fetch('https://www.tzevaadom.co.il/api/alerts-history?limit=1',
      { cache:'no-store' })
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(rows){
        state.apiOk = true; renderConn();
        if (!Array.isArray(rows) || !rows.length) return;
        var a = rows[0];
        var t = a.time ? a.time*1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        if (t && Date.now() - t > 5*60*1000) return;
        handle({ id:a.id || String(t), cities:a.cities || a.areas || [], title:a.title });
      })
      .catch(function(){
        state.apiOk = false; renderConn();
        state.apiFails = (state.apiFails||0)+1;
        /* חסימת CORS אינה משתנה עם הזמן — אין טעם להמשיך לנסות */
        if (state.apiFails > 3 && window._apiT){ clearInterval(window._apiT); window._apiT=null; }
      });
  }

  /* ---------- מסלול ראשי: חיבור חי ל-Supabase ----------
     אותו דומיין שכבר עובד, ולכן עובר בכל רשת שבה המסך פועל.
     ברגע שהשירות כותב התראה — היא מגיעה תוך פחות משנייה. */
  var rt = null, rtRef = 0, rtHb = null, rtFails = 0;
  function connectRealtime(){
    if (!CFG.supa || !CFG.key) return;
    try{
      var host = CFG.supa.replace(/^https?:\/\//,'');
      rt = new WebSocket('wss://'+host+'/realtime/v1/websocket?apikey='+
                         encodeURIComponent(CFG.key)+'&vsn=1.0.0');

      rt.onopen = function(){
        rtFails = 0;
        rt.send(JSON.stringify({
          topic:'realtime:public:alerts', event:'phx_join',
          payload:{ config:{ postgres_changes:[
            { event:'INSERT', schema:'public', table:'alerts' } ] } },
          ref: String(++rtRef)
        }));
        rtHb = setInterval(function(){
          try{ rt.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(++rtRef)})); }
          catch(e){}
        }, 25000);
      };

      rt.onmessage = function(ev){
        try{
          var m = JSON.parse(ev.data);
          if (m.event === 'phx_reply' && m.payload && m.payload.status === 'ok'){
            state.rtOk = true; renderConn(); return;
          }
          if (m.event === 'postgres_changes'){
            var rec = m.payload && m.payload.data && m.payload.data.record;
            if (rec) handle({ id:rec.id, cities:rec.areas || [], title:rec.title });
          }
        }catch(e){}
      };

      rt.onclose = function(){
        state.rtOk = false; renderConn();
        if (rtHb){ clearInterval(rtHb); rtHb = null; }
        rt = null; rtFails++;
        setTimeout(connectRealtime, Math.min(30000, 3000 * rtFails));
      };
      rt.onerror = function(){ try{ rt.close(); }catch(e){} };
    }catch(e){ state.rtOk=false; renderConn(); setTimeout(connectRealtime, 30000); }
  }

  /* ---------- מסלול גיבוי: דגימה ---------- */
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
    connectRealtime();
    connectWs();
    pollDirect();
    pollSupa();
    window._apiT = setInterval(pollDirect, 12000);
    /* Supabase הוא המסלול שעובד — דוגמים אותו בתדירות גבוהה */
    poll = setInterval(pollSupa, 8000);

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
      var qp = new URLSearchParams(location.search);
      if (qp.get('alerttest') === '1')
        setTimeout(function(){ show(CFG.areas.length?CFG.areas:['בדיקה'],'בדיקת מערכת'); }, 1500);

      /* ?alertdebug=1 — מציג את מצב כל מסלול בנפרד */
      if (qp.get('alertdebug') === '1'){
        var d=document.createElement('div');
        d.style.cssText='position:fixed;bottom:26px;left:6px;z-index:2147482000;'+
          'background:rgba(0,0,0,.82);color:#e6edf3;font:11px/1.6 Assistant,Arial,sans-serif;'+
          'direction:rtl;padding:6px 10px;border-radius:8px;border:1px solid #30363d';
        document.body.appendChild(d);
        setInterval(function(){
          d.innerHTML =
            'WebSocket: <b style="color:'+(state.wsOk?'#7ee787':'#ff9a9a')+'">'+
              (state.wsOk?'מחובר':'לא מחובר '+(state.wsWhy||''))+'</b><br>'+
            'HTTPS ישיר: <b style="color:'+(state.apiOk?'#7ee787':'#ff9a9a')+'">'+
              (state.apiOk?'עובד':'חסום')+'</b><br>'+
            'זמן אמת: <b style="color:'+(state.rtOk?'#7ee787':'#ff9a9a')+'">'+
              (state.rtOk?'מחובר':'לא מחובר')+'</b><br>'+
            'Supabase דגימה: <b style="color:'+(state.sbOk?'#7ee787':'#ff9a9a')+'">'+
              (state.sbOk?'עובד':(state.sbMsg||'חסום'))+'</b>';
        }, 1000);
      }
    }catch(e){}
  }

  root.NatiAlerts = { init:init, show:show, hide:hide, state:state };
})(typeof window !== 'undefined' ? window : globalThis);
