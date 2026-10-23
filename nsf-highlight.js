/* =====================================================================
   נתי SAFE — הודעות בולטות על לוח המודעות · NatiHighlight v1.0 · 23.10.26
   ---------------------------------------------------------------------
   שמחות ("נולדה בת למשפחת…", קידוש, ברית, פדיון הבן) והודעות חשובות.
   מופיעות במרכז הלוח ככרטיס זוהר — לא בגלילה — בכל פעם שהגלילה של
   ההודעה הרגילה מסתיימת (הגלילה נעצרת בזמן הזה ואז ממשיכה).
   כשאין גלילה (קובץ / טקסט קבוע) — מופיעות כל דקה וחצי.

   display_config:
     highlights  [{type:"simcha"|"important"|"general", title, text, from, to}]
                 from/to — תאריכים (YYYY-MM-DD), כולל. ריק = בלי הגבלה.
     hl_sec      כמה שניות כל כרטיס מוצג (ברירת מחדל 12)
     hl_every    כשאין גלילה — כל כמה שניות (ברירת מחדל 90)
   ===================================================================== */
(function(root){
  if(root.NatiHighlight) return;
  var css=document.createElement("style");
  css.textContent=
    "#hl-wrap{position:absolute;left:0;right:0;bottom:0;top:140px;z-index:8;display:flex;align-items:center;justify-content:center;"+
    " pointer-events:none;opacity:0;visibility:hidden;transition:opacity .7s ease,visibility 0s linear .7s;"+
    " background:radial-gradient(ellipse at center,rgba(4,8,18,.55),rgba(4,8,18,.82))}"+
    "#hl-wrap.on{opacity:1;visibility:visible;transition:opacity .7s ease}"+
    "#hl-card{position:relative;z-index:2;box-sizing:border-box;width:min(88%,1500px);max-height:88%;overflow:hidden;text-align:center;direction:rtl;"+
    " padding:4.2vmin 5vmin 4.6vmin;border-radius:3.2vmin;border:.45vmin solid transparent;"+
    " background:linear-gradient(160deg,#101a33 0%,#0a1124 60%,#070c1a 100%) padding-box,"+
    "  linear-gradient(135deg,#8a6a1f,#f7e08a 28%,#b8902f 52%,#fff3b8 74%,#9b7724) border-box;"+
    " box-shadow:0 0 6vmin rgba(240,200,90,.35),0 2vmin 6vmin rgba(0,0,0,.7);"+
    " transform:scale(.92) translateY(2vmin);transition:transform .8s cubic-bezier(.2,.8,.2,1);animation:hlGlow 3.2s ease-in-out infinite}"+
    "#hl-wrap.on #hl-card{transform:none}"+
    "@keyframes hlGlow{0%,100%{box-shadow:0 0 4vmin rgba(240,200,90,.28),0 2vmin 6vmin rgba(0,0,0,.7)}"+
    " 50%{box-shadow:0 0 9vmin rgba(255,215,110,.55),0 2vmin 6vmin rgba(0,0,0,.7)}}"+
    "#hl-card::before{content:'';position:absolute;inset:1.2vmin;border-radius:2.2vmin;border:1px solid rgba(247,224,138,.28);pointer-events:none}"+
    /* פס אור שעובר על הכרטיס */
    "#hl-card::after{content:'';position:absolute;top:-20%;bottom:-20%;width:22%;left:-30%;pointer-events:none;"+
    " background:linear-gradient(100deg,transparent,rgba(255,240,190,.16),transparent);transform:skewX(-14deg);animation:hlSweep 4.5s ease-in-out infinite}"+
    "@keyframes hlSweep{0%{left:-30%}60%,100%{left:120%}}"+
    "#hl-card .hl-tag{display:inline-flex;align-items:center;gap:1.4vmin;font-family:'Frank Ruhl Libre',serif;font-weight:900;"+
    " font-size:3.6vmin;letter-spacing:.06em;color:#1a1204;padding:.8vmin 3.4vmin;border-radius:99vmin;margin-bottom:2.4vmin;"+
    " background:linear-gradient(180deg,#fff3c4,#f3d77a 40%,#d4a943 75%,#b8862a);box-shadow:0 .4vmin 1.6vmin rgba(0,0,0,.5)}"+
    "#hl-card .hl-tag svg{width:3.4vmin;height:3.4vmin}"+
    "#hl-card .hl-t{overflow-wrap:anywhere;font-family:'Frank Ruhl Libre',serif;font-weight:900;line-height:1.2;margin:0 0 2vmin;"+
    " background:linear-gradient(180deg,#fff8dc 0%,#f6dc86 34%,#d4a943 62%,#f3dc92 100%);-webkit-background-clip:text;background-clip:text;color:transparent;"+
    " filter:drop-shadow(0 .4vmin .8vmin rgba(0,0,0,.6))}"+
    "#hl-card .hl-orn{display:block;width:34%;height:2vmin;margin:0 auto 2vmin}"+
    "#hl-card .hl-x{overflow-wrap:anywhere;font-family:Assistant,Heebo,Arial,sans-serif;font-weight:600;color:#eef2f7;line-height:1.55;white-space:pre-line;"+
    " text-shadow:0 .2vmin .8vmin rgba(0,0,0,.6)}"+
    /* הודעה חשובה — מסגרת אדומה-כתומה */
    "#hl-card.important{background:linear-gradient(160deg,#2a0d0d 0%,#1a0808 60%,#120505 100%) padding-box,"+
    "  linear-gradient(135deg,#a3341b,#ffb36b 30%,#e0482a 55%,#ffd08a 78%,#a3341b) border-box;animation-name:hlGlowR}"+
    "@keyframes hlGlowR{0%,100%{box-shadow:0 0 4vmin rgba(255,110,60,.3),0 2vmin 6vmin rgba(0,0,0,.7)}"+
    " 50%{box-shadow:0 0 9vmin rgba(255,130,70,.6),0 2vmin 6vmin rgba(0,0,0,.7)}}"+
    "#hl-card.important .hl-tag{background:linear-gradient(180deg,#ffd9b0,#ff9a5a 45%,#e0482a);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4)}"+
    "#hl-card.important .hl-t{background:linear-gradient(180deg,#fff2e6,#ffc49a 45%,#ff8a5c);-webkit-background-clip:text;background-clip:text}"+
    /* כללי — כחול */
    "#hl-card.general .hl-tag{background:linear-gradient(180deg,#d8ecff,#8cc3ff 45%,#3d8ce0);color:#06213f}"+
    /* קונפטי עדין לשמחה */
    "#hl-wrap .hl-cf{position:absolute;z-index:1;top:-4vmin;width:1.1vmin;height:2vmin;border-radius:.3vmin;opacity:.85;animation:hlFall linear infinite}"+
    "@keyframes hlFall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(120vh) rotate(540deg)}}"+
    "body.portrait #hl-wrap{top:0}";
  document.head.appendChild(css);

  var STAR='<svg viewBox="0 0 24 24"><path d="M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 8.7l7.1-.6z" fill="#7a5410"/></svg>';
  var BELL='<svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3a1.5 1.5 0 0 0-3 0v1.2A7 7 0 0 0 5 11v5l-2 2v1h18v-1z" fill="#fff"/></svg>';
  var ORN='<svg class="hl-orn" viewBox="0 0 300 16" preserveAspectRatio="none"><path d="M4 8 H128 M172 8 H296" stroke="#d9b65a" stroke-width="1.6"/>'+
          '<path d="M150 1 L158 8 L150 15 L142 8 Z" fill="#f3d77a"/><circle cx="134" cy="8" r="2.2" fill="#f3d77a"/><circle cx="166" cy="8" r="2.2" fill="#f3d77a"/></svg>';
  var TAGS={simcha:["מזל טוב",STAR], important:["הודעה חשובה",BELL], general:["לתשומת לב הדיירים",""]};

  var LIST=[], SEC=12, EVERY=90, idx=0, wrap=null, card=null, showing=false, hideT=null, lastShow=0, pausedEl=null;

  function esc(t){ return String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function today(){ var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function active(){
    var t=today();
    return LIST.filter(function(h){
      if(!h || !(String(h.title||"").trim() || String(h.text||"").trim())) return false;
      if(h.from && t < String(h.from).slice(0,10)) return false;
      if(h.to && t > String(h.to).slice(0,10)) return false;
      return true;
    });
  }
  function ensure(){
    if(wrap) return;
    var ref=document.getElementById("mq-wrap");
    wrap=document.createElement("div"); wrap.id="hl-wrap"; wrap.setAttribute("aria-live","polite");
    wrap.innerHTML='<div id="hl-card"></div>';
    (ref && ref.parentNode ? ref.parentNode : document.body).appendChild(wrap);
    card=wrap.firstChild;
  }
  /* הטקסט מוקטן עד שהכרטיס נכנס בלוח — אף פעם לא נחתך */
  function fit(){
    var t=card.querySelector(".hl-t"), x=card.querySelector(".hl-x");
    var vm=Math.min(innerWidth,innerHeight)/100, ft=9*vm, fx=5.2*vm, n=0;
    var maxH=wrap.clientHeight*0.86;
    do{
      if(t) t.style.fontSize=ft+"px"; if(x) x.style.fontSize=fx+"px";
      /* רק הגובה נבדק — הטקסט נשבר לשורות; מילה ארוכה מדי נבדקת בנפרד */
      var wide=(t && t.scrollWidth>t.clientWidth+1) || (x && x.scrollWidth>x.clientWidth+1);
      if(card.scrollHeight<=maxH && !wide) break;
      ft*=0.92; fx*=0.92;
    }while(++n<24);
  }
  function confetti(on){
    [].forEach.call(wrap.querySelectorAll(".hl-cf"),function(e){ e.remove(); });
    if(!on) return;
    var cols=["#f7e08a","#ffffff","#d4a943","#8cc3ff","#ffb3c7"];
    for(var i=0;i<26;i++){
      var e=document.createElement("i"); e.className="hl-cf";
      e.style.left=(Math.random()*100)+"%"; e.style.background=cols[i%cols.length];
      e.style.animationDuration=(6+Math.random()*6)+"s"; e.style.animationDelay=(-Math.random()*8)+"s";
      wrap.appendChild(e);
    }
  }
  function show(onDone){
    var A=active(); if(!A.length || showing){ if(onDone) onDone(); return false; }
    ensure();
    var ref=document.getElementById("mq-wrap");
    try{ if(ref) wrap.style.top=getComputedStyle(ref).top; }catch(e){}
    var h=A[idx % A.length]; idx++;
    var ty=TAGS[h.type] ? h.type : "simcha", tg=TAGS[ty];
    card.className=ty;
    card.innerHTML='<div class="hl-tag">'+tg[1]+'<span>'+esc(h.tag||tg[0])+'</span>'+tg[1]+'</div>'+
      (h.title?'<div class="hl-t">'+esc(h.title)+'</div>':'')+
      ((h.title&&h.text)?ORN:'')+
      (h.text?'<div class="hl-x">'+esc(h.text)+'</div>':'');
    showing=true; lastShow=Date.now();
    confetti(ty==="simcha");
    wrap.classList.add("on");
    requestAnimationFrame(fit);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(showing) fit(); });
    clearTimeout(hideT);
    hideT=setTimeout(function(){
      wrap.classList.remove("on"); showing=false;
      setTimeout(function(){ confetti(false); if(onDone) onDone(); }, 700);
    }, Math.max(4,SEC)*1000);
    return true;
  }
  /* בסוף כל גלילה: עוצרים את הגלילה, מציגים כרטיס, וממשיכים */
  document.addEventListener("animationiteration",function(e){
    var mv=document.getElementById("mq-mover");
    if(!mv || e.target!==mv || !active().length || showing) return;
    mv.style.animationPlayState="paused"; pausedEl=mv;
    show(function(){ if(pausedEl){ pausedEl.style.animationPlayState="running"; pausedEl=null; } });
  },true);
  /* בלי גלילה (קובץ / טקסט קבוע / קובץ+גלילה) — לפי זמן */
  setInterval(function(){
    if(showing || !active().length) return;
    if(Date.now()-lastShow < EVERY*1000) return;
    var mv=document.getElementById("mq-mover"), mw=document.getElementById("mq-wrap");
    var pureScroll = mv && mw && getComputedStyle(mw).display!=="none" && /mqRoll/.test(mv.style.animation||getComputedStyle(mv).animationName||"");
    if(pureScroll && Date.now()-lastShow < EVERY*3000) return;   /* בגלילה רגילה — מחכים לסוף הגלילה */
    show();
  }, 5000);

  function set(list, sec, every){
    LIST=Array.isArray(list)?list.slice():[];
    SEC=(+sec>=4)?+sec:12; EVERY=(+every>=20)?+every:90;
    if(!lastShow) lastShow=Date.now()-EVERY*1000+15000;   /* הכרטיס הראשון — 15 שניות אחרי הטעינה */
    if(showing && !active().length){ clearTimeout(hideT); wrap.classList.remove("on"); showing=false; confetti(false);
      if(pausedEl){ pausedEl.style.animationPlayState="running"; pausedEl=null; } }
  }
  root.NatiHighlight={set:set, show:show, active:active, VERSION:"1.0"};
})(window);
