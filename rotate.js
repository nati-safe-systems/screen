/* =====================================================================
   נתי SAFE — מסכים מתחלפים  ·  v1.0
   ---------------------------------------------------------------------
   מדי כמה זמן המסך הרגיל מתחלף למסך הודעה, ואז חוזר.
   שימושי ל"אין לדבר בשעת התפילה", "נא לכבות פלאפונים", וכל מסר קבוע.

   הגדרה (display_config.rotate):
     { every: 20, show: 8, slides: [ {title, text, color}, ... ] }
     every — כל כמה שניות מופיע מסך הודעה
     show  — כמה שניות הוא נשאר
     slides — רשימת מסכים. מתחלפים בזה אחר זה בכל הופעה.

   שימוש:  NatiRotate.start(cfg);
   ===================================================================== */
(function (root) {
  'use strict';

  var CFG = null, idx = 0, timer = null, hideT = null, el = null;

  var CSS =
    '#nsf-slide{position:absolute;inset:0;z-index:7500;display:flex;align-items:center;' +
      'justify-content:center;text-align:center;direction:rtl;opacity:0;pointer-events:none;' +
      'transition:opacity .7s ease}' +
    '#nsf-slide.on{opacity:1}' +
    '#nsf-slide .bgw{position:absolute;inset:0;' +
      'background:radial-gradient(ellipse at 50% 40%,rgba(18,26,48,.97),rgba(3,6,14,.99))}' +
    '#nsf-slide .box{position:relative;z-index:2;width:min(84%,1400px);padding:6vh 4vw;' +
      'border-radius:2vh}' +
    '#nsf-slide .t{font-family:"Frank Ruhl Libre",serif;font-weight:900;line-height:1.12;' +
      'font-size:11vh;letter-spacing:.02em;' +
      'background:linear-gradient(180deg,#fff4cf 0%,#ffcc00 55%,#c98f10 100%);' +
      '-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;' +
      'filter:drop-shadow(0 .4vh 1.6vh rgba(0,0,0,.75))}' +
    '#nsf-slide .s{color:#dce8f8;font-size:4.4vh;font-weight:700;margin-top:3vh;line-height:1.35}' +
    '#nsf-slide .rule{height:.3vh;width:38%;margin:3.4vh auto 0;border-radius:.3vh;' +
      'background:linear-gradient(90deg,transparent,#e8c86a,transparent)}';

  function ensure(host){
    if (el) return el;
    var st = document.createElement('style');
    st.id = 'nsf-slide-css'; st.textContent = CSS;
    document.head.appendChild(st);

    el = document.createElement('div');
    el.id = 'nsf-slide';
    el.innerHTML = '<div class="bgw"></div>' +
      '<div class="box"><div class="t" id="nsf-slide-t"></div>' +
      '<div class="rule"></div><div class="s" id="nsf-slide-s"></div></div>';
    var h = host ? document.querySelector(host) : document.body;
    if (!h) h = document.body;
    if (getComputedStyle(h).position === 'static') h.style.position = 'relative';
    h.appendChild(el);
    return el;
  }

  function showSlide(){
    if (!CFG || !CFG.slides || !CFG.slides.length) return;
    var s = CFG.slides[idx % CFG.slides.length];
    idx++;
    var t = document.getElementById('nsf-slide-t');
    var x = document.getElementById('nsf-slide-s');
    if (t) t.textContent = s.title || '';
    if (x){ x.textContent = s.text || ''; x.style.display = s.text ? '' : 'none'; }
    var r = el.querySelector('.rule');
    if (r) r.style.display = s.text ? '' : 'none';
    el.classList.add('on');

    clearTimeout(hideT);
    hideT = setTimeout(function(){ el.classList.remove('on'); },
                       Math.max(2, +CFG.show || 8) * 1000);
  }

  function start(cfg, host){
    stop();
    if (!cfg || !cfg.slides || !cfg.slides.length) return;
    CFG = cfg; idx = 0;
    ensure(host);
    var every = Math.max(5, +cfg.every || 20) * 1000;
    timer = setInterval(showSlide, every);
  }

  function stop(){
    if (timer){ clearInterval(timer); timer = null; }
    clearTimeout(hideT);
    if (el) el.classList.remove('on');
  }

  /* השהיה — למשל כשמוצגת התראת פיקוד העורף */
  function pause(ms){
    if (!timer) return;
    var c = CFG, h = el ? el.parentNode : null;
    stop();
    setTimeout(function(){ if (c) start(c); }, ms || 60000);
  }

  root.NatiRotate = { start: start, stop: stop, pause: pause, show: showSlide };
})(typeof window !== 'undefined' ? window : globalThis);
