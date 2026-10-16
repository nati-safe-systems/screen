/* =====================================================================
   נתי SAFE — "תפילת ___ מתחילה כאן עכשיו"
   ---------------------------------------------------------------------
   גרסה 2.4 · 16.10.26 — לחיצה קצרה: "תתחיל כאן בעוד 3:00" עם ספירה לאחור,
   ואז "מתחילה כאן עכשיו" + חץ (המשך לפי הגדרת בית הכנסת, ברירת מחדל 3 דק'), ונעלם.
   לחיצה נוספת בזמן שההודעה רצה — לא עושה כלום. לחיצה ארוכה / "ביטול" — מבטלת מיד.
   ---------------------------------------------------------------------
   שני מצבים, לפי המסך:
   • מסך דלת של חדר — "תפילת X / תתחיל כאן בעוד 3:00", ואז "מתחילה כאן עכשיו" + חץ.
   • המסך הראשי (בלי חדר, משויך לאתר) — אותו רצף עם שם השטיבל.
     רואה לחיצות של כל החדרים באותו בית כנסת.
   הספירה לאחור ו"המניין הבא" (גרסה 2.0–2.1) הוסרו לבקשת הלקוח.
   ---------------------------------------------------------------------
   נטען במסך דלת של חדר (door.html). המסך בודק כל 3 שניות אם הגבאי
   לחץ על החדר שלו — בשלט או באפליקציה — ואם כן, מתחיל רצף של שלושה שלבים:
     1. "תפילת X תתחיל כאן בעוד" + ספירה לאחור של 3 דקות
     2. "תפילת X מתחילה כאן עכשיו" + חץ — למשך 2 דקות
     3. "המניין הבא" — למשך 3 דקות. תפילה עם זמנים קבועים (שחרית): שעה ושטיבל.
        תפילה בלי זמנים (מנחה, ערבית): השטיבל הבא בסבב, בלי שעה —
        הגבאי ילחץ שם שוב כשהמניין יתחיל.
   הזמנים נספרים מרגע הלחיצה, כך שמסך שנדלק באמצע ממשיך מהשלב הנכון.

   מסך שלא משויך לחדר (באדמין: אתר + חדר) — הסקריפט פשוט לא פועל.
   ===================================================================== */
(function(){
  var SUPA="https://cxtrrejclkhqhkqbicmz.supabase.co";
  var KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dHJyZWpjbGtocWhrcWJpY216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTk3MDksImV4cCI6MjA5NTU3NTcwOX0._7wB4YwrYEnK6hWuR6YqcFxRb05OLnWvOelIC-ahIEQ";
  var PRE_SEC=180;    // "תתחיל כאן בעוד" — ספירה לאחור של 3 דקות
  var NOW_SEC=180;    // "מתחילה כאן עכשיו" — ברירת מחדל 3 דקות; מתעדכן מהגדרת בית הכנסת
  var NEXT_SEC=0;     // בלי "המניין הבא"
  var TOTAL=PRE_SEC+NOW_SEC+NEXT_SEC;

  var qp; try{ qp=new URLSearchParams(location.search); }catch(e){ return; }
  var sid=qp.get("id"); if(!sid) return;

/* ---- איזו תפילה עכשיו — לפי השעה והשקיעה ----
   השקיעה מחושבת לפי מיקום (ברירת מחדל: בית שמש). עד 04:00 — ערבית
   (מניין מאוחר), עד 12:30 — שחרית, עד השקיעה — מנחה, אחריה — ערבית. */
function nsfSunset(d, lat, lon){
  var rad=Math.PI/180;
  var jd = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12)/864e5 + 2440587.5;
  var n = Math.round(jd - 2451545.0 + 0.0008);
  var J = n - lon/360;
  var M = (357.5291 + 0.98560028*J) % 360;
  var C = 1.9148*Math.sin(M*rad) + 0.02*Math.sin(2*M*rad) + 0.0003*Math.sin(3*M*rad);
  var L = (M + C + 180 + 102.9372) % 360;
  var Jt = 2451545 + J + 0.0053*Math.sin(M*rad) - 0.0069*Math.sin(2*L*rad);
  var dec = Math.asin(Math.sin(L*rad)*Math.sin(23.44*rad));
  var w = Math.acos((Math.sin(-0.833*rad) - Math.sin(lat*rad)*Math.sin(dec)) / (Math.cos(lat*rad)*Math.cos(dec)));
  var Jset = Jt + (w/rad)/360;
  return new Date((Jset - 2440587.5)*864e5);
}
function nsfPrayerNow(d, lat, lon){
  d = d || new Date();
  var h = d.getHours() + d.getMinutes()/60;
  if(h < 4) return "ערבית";
  if(h < 12.5) return "שחרית";
  var ss = nsfSunset(d, lat==null?31.7470:lat, lon==null?34.9883:lon);
  return (d < ss) ? "מנחה" : "ערבית";
}

  /* בדיקה: ?roomtest=1 מציג את ההודעה מיד, בלי שלט */
  var lastId=0;
  try{ lastId=+localStorage.getItem("nsf_rc_last_"+sid)||0; }catch(e){}

  /* 2.4 — עיצוב יוקרתי: אמרלד עמוק, מסגרת זהב, הלוגו ברקע ופס אור שעובר ומזהיב אותו */
  (function(){ var l=document.createElement("link"); l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Bellefair&family=Frank+Ruhl+Libre:wght@500;700;900&display=swap";
    document.head.appendChild(l); })();
  var css=document.createElement("style");
  var GOLD="linear-gradient(180deg,#fff7d6 0%,#f6dc86 30%,#d4a943 55%,#b8862a 70%,#f3dc92 100%)";
  css.textContent=
  "#nsf-rc{position:fixed;inset:0;z-index:2147482500;display:none;align-items:center;justify-content:center;direction:rtl;"+
  " background:radial-gradient(ellipse at 50% 45%,rgba(6,48,28,.72),rgba(0,0,0,.94) 72%);opacity:0;transition:opacity .6s}"+
  "#nsf-rc.on{display:flex;opacity:1}"+
  "#nsf-rc .lg{display:none!important}"+
  "#nsf-rc .c{position:relative;overflow:hidden;text-align:center;box-sizing:border-box;"+
  " width:min(88vw,150vh);padding:6.5vmin 6vmin 6vmin;border-radius:2.6vmin;border:.42vmin solid transparent;"+
  " background:radial-gradient(ellipse at 50% -10%,#1d6e48 0%,#0d4229 42%,#06261a 78%,#041a11 100%) padding-box,"+
  "  linear-gradient(135deg,#7d5d18,#f7e08a 22%,#b8902f 45%,#fff3b8 62%,#9b7724 82%,#f0d27a) border-box;"+
  " box-shadow:0 0 0 .6vmin rgba(0,0,0,.55),0 4vmin 10vmin rgba(0,0,0,.75),0 0 9vmin rgba(212,175,55,.32);"+
  " animation:nsfRcIn 1.1s cubic-bezier(.18,1.25,.4,1) both}"+
  /* מצב "מתחילה עכשיו" — אמרלד בהיר יותר ופעימה עדינה של זהב */
  "#nsf-rc .c.now{background:radial-gradient(ellipse at 50% -10%,#2fa56a 0%,#13704a 40%,#0a4430 75%,#06301f 100%) padding-box,"+
  "  linear-gradient(135deg,#7d5d18,#f7e08a 22%,#b8902f 45%,#fff3b8 62%,#9b7724 82%,#f0d27a) border-box;"+
  " animation:nsfRcIn 1.1s cubic-bezier(.18,1.25,.4,1) both,nsfRcBeat 2.4s ease-in-out 1.1s infinite}"+
  /* מסגרת פנימית דקה עם פינות זהב */
  "#nsf-rc .fr{position:absolute;inset:1.7vmin;border-radius:1.6vmin;border:1px solid rgba(247,224,138,.38);pointer-events:none;z-index:3}"+
  "#nsf-rc .fr::before,#nsf-rc .fr::after{content:'';position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;"+
  " background:linear-gradient(#f3d77a,#f3d77a) top right/5vmin .32vmin,linear-gradient(#f3d77a,#f3d77a) top right/.32vmin 5vmin,"+
  "  linear-gradient(#f3d77a,#f3d77a) bottom left/5vmin .32vmin,linear-gradient(#f3d77a,#f3d77a) bottom left/.32vmin 5vmin;background-repeat:no-repeat}"+
  "#nsf-rc .fr::after{transform:scaleX(-1)}"+
  /* הלוגו ברקע + הזהבה כשפס האור עובר מעליו */
  "#nsf-rc .wm,#nsf-rc .wmg{position:absolute;inset:0;z-index:1;pointer-events:none;display:none}"+
  "#nsf-rc.has-lg .wm,#nsf-rc.has-lg .wmg{display:block}"+
  /* הלוגו עצמו, עמום ברקע */
  "#nsf-rc .wm{background:var(--rclg) center 55%/auto 82% no-repeat;opacity:.12;filter:saturate(.7)}"+
  /* הברק: רק החלקים הבהירים (הזהב) של הלוגו נדלקים כשהפס עובר */
  "#nsf-rc .wmg{-webkit-mask:var(--rclg) center 55%/auto 82% no-repeat;mask:var(--rclg) center 55%/auto 82% no-repeat luminance;mix-blend-mode:screen}"+
  "#nsf-rc .wmg{background:linear-gradient(105deg,transparent 0%,transparent 38%,rgba(255,226,140,.0) 41%,#ffe9a3 47%,#fffbe8 50%,#ffe9a3 53%,rgba(255,226,140,0) 59%,transparent 62%,transparent 100%);"+
  " background-size:320% 100%;opacity:.85;animation:nsfRcSweep 7s linear infinite}"+
  "#nsf-rc .sw{position:absolute;inset:0;z-index:2;pointer-events:none;"+
  " background:linear-gradient(105deg,transparent 0%,transparent 40%,rgba(255,255,255,.07) 46%,rgba(255,250,225,.16) 50%,rgba(255,255,255,.07) 54%,transparent 60%,transparent 100%);"+
  " background-size:320% 100%;animation:nsfRcSweep 7s linear infinite}"+
  "@keyframes nsfRcSweep{0%{background-position:115% 0}62%{background-position:-15% 0}100%{background-position:-15% 0}}"+
  /* תוכן */
  "#nsf-rc .in{position:relative;z-index:4}"+
  "#nsf-rc .p{font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:13.5vmin;line-height:1.02;letter-spacing:.01em;"+
  " background:"+GOLD+";-webkit-background-clip:text;background-clip:text;color:transparent;"+
  " filter:drop-shadow(0 .5vmin .9vmin rgba(0,0,0,.65)) drop-shadow(0 0 2.4vmin rgba(240,200,90,.25))}"+
  "#nsf-rc .orn{display:block;margin:2vmin auto 1.4vmin;width:min(52vmin,60%);height:3.2vmin}"+
  "#nsf-rc .s{font-family:Bellefair,'Frank Ruhl Libre',serif;font-weight:400;font-size:7.6vmin;line-height:1.1;color:#f6eed8;"+
  " letter-spacing:.03em;text-shadow:0 .4vmin 1.2vmin rgba(0,0,0,.6)}"+
  "#nsf-rc .tm{font-family:'Frank Ruhl Libre',serif;font-weight:700;font-size:25vmin;line-height:1;margin-top:1.6vmin;direction:ltr;"+
  " filter:drop-shadow(0 .7vmin 1.2vmin rgba(0,0,0,.7)) drop-shadow(0 0 3vmin rgba(240,200,90,.3))}"+
  "#nsf-rc .tm i{display:inline-block;width:.6em;font-style:normal;text-align:center;"+
  " background:"+GOLD+";-webkit-background-clip:text;background-clip:text;color:transparent}"+
  "#nsf-rc .tm i.cl{width:.32em;animation:nsfRcBlink 1s steps(1) infinite}"+
  "#nsf-rc .rm{font-family:'Frank Ruhl Libre',serif;font-weight:700;font-size:9vmin;margin-top:2vmin;line-height:1.1;"+
  " background:"+GOLD+";-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 .4vmin .8vmin rgba(0,0,0,.6))}"+
  "#nsf-rc .sm{font-family:Bellefair,serif;color:#e9e1c8;font-size:4.6vmin;margin-top:1.4vmin;opacity:.95}"+
  "#nsf-rc .a{margin-top:2.6vmin;line-height:0;animation:nsfRcBounce 1.2s ease-in-out infinite}"+
  "#nsf-rc .a svg{width:15vmin;height:15vmin;filter:drop-shadow(0 .8vmin 1.4vmin rgba(0,0,0,.6)) drop-shadow(0 0 2.4vmin rgba(247,224,138,.45))}"+
  /* שלב "המניין הבא" (לא בשימוש כרגע) */
  "#nsf-rc .c.nx{background:radial-gradient(ellipse at 50% -10%,#22305a,#0d1630 60%,#08101f) padding-box,linear-gradient(135deg,#7d5d18,#f7e08a,#b8902f,#fff3b8,#9b7724) border-box}"+
  /* מסך לאורך (מעל דלת) — כרטיס גבוה יותר וטקסט גדול יותר */
  "@media (orientation:portrait){#nsf-rc .c{width:90vw;padding:11vmin 6vmin 10vmin}"+
  " #nsf-rc .p{font-size:15.5vmin}#nsf-rc .s{font-size:8.6vmin}#nsf-rc .tm{font-size:31vmin;margin-top:3vmin}"+
  " #nsf-rc .orn{margin:3vmin auto 2.4vmin}#nsf-rc .a svg{width:19vmin;height:19vmin}#nsf-rc .a{margin-top:4vmin}}"+
  "@keyframes nsfRcIn{0%{transform:scale(.86) translateY(3vh);opacity:0;filter:blur(6px)}100%{transform:none;opacity:1;filter:none}}"+
  "@keyframes nsfRcBeat{0%,100%{box-shadow:0 0 0 .6vmin rgba(0,0,0,.55),0 4vmin 10vmin rgba(0,0,0,.75),0 0 8vmin rgba(212,175,55,.3)}"+
  " 50%{box-shadow:0 0 0 .6vmin rgba(0,0,0,.55),0 4vmin 10vmin rgba(0,0,0,.75),0 0 15vmin rgba(240,205,100,.6),0 0 5vmin rgba(60,220,140,.35)}}"+
  "@keyframes nsfRcBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.8vh)}}"+
  "@keyframes nsfRcBlink{0%{opacity:1}50%{opacity:.35}}";
  document.head.appendChild(css);

  var box=null, hideT=null;
  /* הלוגו של הלקוח: מה שערכת העיצוב של המסך מציגה (--mkl, למשל
     "המרכז הרוחני"), אחרת תמונת לוגו שמופיעה בדף. בלי לוגו — לא מוצג. */
  function logoUrl(){
    try{
      var v=getComputedStyle(document.body).getPropertyValue("--mkl")||
            getComputedStyle(document.documentElement).getPropertyValue("--mkl")||"";
      var m=/url\(\s*["']?([^"')]+)["']?\s*\)/.exec(v);
      if(m) return m[1];
      var im=document.querySelector("img[id*=logo],img[class*=logo]");
      if(im && im.src && !/natisafe-logo/.test(im.src)) return im.src;
    }catch(e){}
    return "";
  }
  function build(){
    if(box) return;
    box=document.createElement("div"); box.id="nsf-rc";
    box.innerHTML='<div class="c"><img class="lg" alt="">'+
      '<div class="wm"></div><div class="wmg"></div><div class="sw"></div><div class="fr"></div>'+
      '<div class="in"><div class="p"></div>'+
      '<svg class="orn" viewBox="0 0 400 24" aria-hidden="true"><defs><linearGradient id="nsfRcG" x1="0" x2="1">'+
        '<stop offset="0" stop-color="#b8862a" stop-opacity="0"/><stop offset=".5" stop-color="#f7e08a"/><stop offset="1" stop-color="#b8862a" stop-opacity="0"/></linearGradient></defs>'+
        '<path d="M10 12 H170 M230 12 H390" stroke="url(#nsfRcG)" stroke-width="2"/>'+
        '<path d="M200 2 L210 12 L200 22 L190 12 Z" fill="#f3d77a"/><circle cx="178" cy="12" r="2.6" fill="#f3d77a"/><circle cx="222" cy="12" r="2.6" fill="#f3d77a"/></svg>'+
      '<div class="s"></div><div class="tm"></div><div class="rm"></div><div class="sm"></div>'+
      '<div class="a"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="nsfRcA" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0" stop-color="#fff6cf"/><stop offset=".45" stop-color="#f0cf6d"/><stop offset="1" stop-color="#b8862a"/></linearGradient></defs>'+
        '<path d="M50 92 L14 52 H36 V8 H64 V52 H86 Z" fill="url(#nsfRcA)" stroke="#fff3c4" stroke-width="2" stroke-linejoin="round"/>'+
      '</svg></div></div></div>';
    document.body.appendChild(box);
  }
  /* הלוגו של הלקוח — ברקע הכרטיס, ומוזהב כשפס האור עובר */
  function setLogo(src){
    if(!box) return;
    if(src){ box.style.setProperty("--rclg",'url("'+String(src).replace(/"/g,'%22')+'")'); box.classList.add("has-lg"); }
    else box.classList.remove("has-lg");
  }
  /* ספרות ברוחב קבוע — הספירה לא "קופצת" כשהמספרים מתחלפים */
  function setTm(t){
    var e=box.querySelector(".tm");
    if(!t){ e.innerHTML=""; e.style.display="none"; e.__t=""; return; }
    e.style.display="";
    if(e.__t===t) return; e.__t=t;
    e.innerHTML=String(t).split("").map(function(ch){ return ch===":" ? '<i class="cl">:</i>' : "<i>"+ch+"</i>"; }).join("");
  }
  function set(cls, txt){
    if(cls==="tm"){ setTm(txt); return; }
    var e=box.querySelector("."+cls); e.textContent=txt||""; e.style.display=txt?"":"none"; }
  function pop(){ var c=box.querySelector(".c"); c.style.animation="none"; void c.offsetWidth; c.style.animation=""; }
  function open(){
    var lg=box.querySelector(".lg"), src=logoUrl();
    setLogo(src);
    if(!box.classList.contains("on")){ box.style.display="flex"; void box.offsetWidth; box.classList.add("on"); }
  }
  function close(){
    if(!box) return;
    box.classList.remove("on");
    setTimeout(function(){ if(box && !box.classList.contains("on")) box.style.display="none"; },600);
  }
  function mmss(sec){ sec=Math.max(0,Math.ceil(sec)); var m=Math.floor(sec/60), x=sec%60; return m+":"+(x<10?"0":"")+x; }

  /* ---- רצף ההודעה ---- */
  var FLOW=null, flowT=null;
  /* ביטול: הגבאי לחץ לחיצה ארוכה או "ביטול" באפליקציה — ההודעה נעלמת מיד */
  function isCancel(d){ return !!(d && (d.cancel===true || d.cancel==="t" || d.prayer==="ביטול" || d.prayer==="cancel")); }
  function cancelFlow(){ FLOW=null; clearInterval(flowT); close(); }
  function flowActive(){ return !!(FLOW && (Date.now()-FLOW.t0)/1000 < TOTAL); }
  function startFlow(prayer, ageSec, roomName){
    build();
    FLOW={prayer:prayer, t0:Date.now()-Math.max(0,ageSec||0)*1000, phase:"", next:null, nextAsked:false, room:roomName||""};
    loadSched();                       /* מכינים מראש את "המניין הבא" */
    clearInterval(flowT); flowT=setInterval(step,250); step();
  }
  function step(){
    if(!FLOW){ clearInterval(flowT); return; }
    var e=(Date.now()-FLOW.t0)/1000, ph;
    if(e<PRE_SEC) ph="pre";
    else if(e<PRE_SEC+NOW_SEC) ph="now";
    else if(e<TOTAL) ph="next";
    else ph="end";
    if(ph==="next" && !FLOW.nextAsked){
      /* לוח המניינים עוד בטעינה — ממתינים לו עד 8 שניות לפני שמוותרים */
      if(!SCH && e<PRE_SEC+NOW_SEC+8){ ph=(FLOW.phase||"now"); }
      else { FLOW.nextAsked=true; FLOW.next=nextMinyan(FLOW.prayer); }
    }
    if(ph==="next" && !FLOW.next) ph="end";          /* אין מניין נוסף היום — מסיימים */
    if(ph==="end"){ FLOW=null; clearInterval(flowT); close(); return; }
    var c=box.querySelector(".c"), arrow=box.querySelector(".a");
    if(ph!==FLOW.phase){
      FLOW.phase=ph;
      c.classList.toggle("nx", ph==="next");
      c.classList.toggle("now", ph==="now");
      arrow.style.display=(ph==="next")?"none":"";
      if(ph==="pre"){
        set("p","תפילת "+FLOW.prayer); set("sm","");
        arrow.style.display="none";                                   /* החץ רק כשמתחילים */
        if(FLOW.room){ set("s","תתחיל בעוד"); set("rm","ב"+FLOW.room); }   /* המסך הראשי */
        else { set("s","תתחיל כאן בעוד"); set("rm",""); }                  /* מסך הדלת */
      }
      if(ph==="now"){
        set("p","תפילת "+FLOW.prayer); set("tm",""); set("sm","");
        if(FLOW.room){ set("s","מתחילה עכשיו"); set("rm","ב"+FLOW.room); arrow.style.display="none"; }   /* המסך הראשי */
        else { set("s","מתחילה כאן עכשיו"); set("rm",""); }                                              /* מסך הדלת */
      }
      if(ph==="next"){
        var n=FLOW.next;
        set("p","המניין הבא");
        set("s", n.rot ? ("תפילת "+n.prayer) : (n.prayer+" · "+n.time));
        set("tm","");
        set("rm",n.here ? "כאן, בחדר הזה" : (n.room ? "ב"+n.room : ""));
      }
      open(); pop();
    }
    if(ph==="pre") set("tm",mmss(PRE_SEC-e));
    /* הלוגו נטען לפעמים רק אחרי שערכת העיצוב הוחלה — בודקים שוב */
    if(!FLOW.lg){ var lg=box.querySelector(".lg"), src=logoUrl();
      if(src){ FLOW.lg=1; setLogo(src); } }
    if(ph==="next" && FLOW.next && FLOW.next.rot) set("sm","");
    else if(ph==="next" && FLOW.next){
      var d=new Date(), nowMin=d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
      var left=Math.round(FLOW.next.minutes-nowMin);
      set("sm", left>0 ? ("בעוד "+left+" דק'") : "מתחיל עכשיו");
    }
  }

  /* ---- "המניין הבא": כל המניינים של בית הכנסת, לפי אותו מנוע של המסכים ---- */
  var SCH=null, schAt=0, schP=null;
  var PR_HE={shacharit:"שחרית",mincha:"מנחה",arvit:"ערבית",maariv:"מעריב",mussaf:"מוסף",selichot:"סליחות"};
  function sfx(p){ return fetch(SUPA+"/rest/v1/"+p,{headers:{apikey:KEY,Authorization:"Bearer "+KEY},cache:"no-store"})
                     .then(function(r){ return r.ok?r.json():[]; }); }
  function loadSched(){
    if(SCH && Date.now()-schAt<10*60*1000) return Promise.resolve(SCH);
    if(schP) return schP;
    schP=sfx("screens?screen_id=eq."+encodeURIComponent(sid)+"&select=room_id")
    .then(function(r){
      var room=r&&r[0]&&r[0].room_id; if(!room) return null;
      return sfx("rooms?id=eq."+room+"&select=id,site_id").then(function(rr){
        var site=rr&&rr[0]&&rr[0].site_id; if(!site) return null;
        return Promise.all([
          sfx("sites?id=eq."+site+"&select=*"),
          sfx("rooms?site_id=eq."+site+"&select=*&active=eq.true&order=sort_order"),
          sfx("prayer_times?site_id=eq."+site+"&select=*&active=eq.true")
        ]).then(function(x){ SCH={room:room, site:x[0][0], rooms:x[1]||[], rows:x[2]||[]}; schAt=Date.now(); return SCH; });
      });
    }).catch(function(){ return null; }).then(function(v){ schP=null; return v; });
    return schP;
  }
  function nextMinyan(prayerHe){
    try{
      if(!SCH || !SCH.site || !window.NatiMinyan || !window.NatiZmanim) return null;
      var now=new Date(), S=SCH.site;
      var z=NatiZmanim.getZmanim(now,{lat:+S.lat,lng:+S.lng,elevation:+S.elevation,
            candleMinutes:+S.candle_offset||40,timeZone:S.timezone||"Asia/Jerusalem"});
      var list=NatiMinyan.resolve(SCH.rows,z,now);
      var nowMin=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
      var up=list.filter(function(x){ return x.minutes>nowMin+0.5; });
      var he=function(k){ var t=PR_HE[k]||k||""; if(t==="ערבית" && S.nusach==="ashkenaz") t="מעריב"; return t; };
      var isSame=function(x){ var t=he(x.prayer); return t===prayerHe || (t==="מעריב"&&prayerHe==="ערבית") || (t==="ערבית"&&prayerHe==="מעריב"); };
      var allSame=list.filter(isSame), same=up.filter(isSame);
      /* תפילה עם זמנים קבועים (למשל שחרית) — המניין הבא לפי הלוח, עם שעה */
      if(same.length){
        var n=same[0];
        var rm=null; SCH.rooms.forEach(function(r){ if(r.id===n.room_id) rm=r; });
        return { prayer:he(n.prayer), time:n.time, minutes:n.minutes,
                 room: rm ? (rm.display_name||rm.name) : "", here: (n.room_id && n.room_id===SCH.room) };
      }
      /* היו זמנים היום והם כבר עברו — אין "מניין הבא" */
      if(allSame.length) return null;
      /* תפילה בלי זמנים קבועים (מנחה, ערבית): הגבאי מסתובב ולוחץ איפה שמתחיל
         מניין. "המניין הבא" = השטיבל הבא בסבב, בלי שעה — שם הוא ילחץ שוב. */
      var shuls=SCH.rooms.filter(function(r){ return !r.kind || r.kind==="shul"; })
        .sort(function(a,b){ return (+a.sort_order||0)-(+b.sort_order||0); });
      if(shuls.length<2) return null;
      var i=-1; shuls.forEach(function(r,k){ if(r.id===SCH.room) i=k; });
      var nx=shuls[(i+1)%shuls.length];
      if(!nx || nx.id===SCH.room) return null;
      return { prayer:prayerHe, time:"", minutes:null, room:(nx.display_name||nx.name), here:false, rot:true };
    }catch(e){ return null; }
  }

  function rpc(fn,args){
    return fetch(SUPA+"/rest/v1/rpc/"+fn,{method:"POST",cache:"no-store",
      headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json"},
      body:JSON.stringify(args)}).then(function(r){ return r.ok?r.json():null; });
  }

  var timer=null;
  function poll(){
    rpc("nsf_room_poll",{p_screen:sid}).then(function(d){
      if(!d || !d.id || d.id===lastId) return;
      lastId=d.id; try{ localStorage.setItem("nsf_rc_last_"+sid,String(d.id)); }catch(e){}
      var age=+d.age||0;
      if(isCancel(d)){ if(age<TOTAL) cancelFlow(); return; }
      /* לחיצה נוספת בזמן שההודעה כבר רצה — לא מתחילים מחדש ולא מאריכים */
      if(flowActive()) return;
      /* ספרדי = ערבית, אשכנזי = מעריב — לפי הגדרת בית הכנסת */
      var pr=d.prayer || nsfPrayerNow(new Date(), d.lat!=null?+d.lat:null, d.lng!=null?+d.lng:null);
      if(pr==="ערבית" && d.nusach==="ashkenaz") pr="מעריב";
      if(age < TOTAL-3) startFlow(pr, age);
    }).catch(function(){});
  }

  /* ---- המסך הראשי: לחיצות של כל החדרים באתר ----
     בודקים דרך מסכי הדלת של החדרים (אותה בדיקה שכל מסך דלת עושה),
     ולוקחים את הלחיצה האחרונה. אין צורך בשינוי בשרת. */
  var SITE_DOORS=[], lastSite=0;
  try{ lastSite=+localStorage.getItem("nsf_rc_site_"+sid)||0; }catch(e){}
  function loadDoors(site){
    return Promise.all([
      sfx("rooms?site_id=eq."+site+"&select=id,name,display_name"),
      sfx("screens?site_id=eq."+site+"&room_id=not.is.null&select=screen_id,room_id")
    ]).then(function(x){
      var rooms={}; (x[0]||[]).forEach(function(r){ rooms[r.id]=r.display_name||r.name; });
      var seen={}; SITE_DOORS=[];
      (x[1]||[]).forEach(function(s){ if(seen[s.room_id]) return; seen[s.room_id]=1;   /* מסך אחד לכל חדר מספיק */
        SITE_DOORS.push({screen:s.screen_id, room:rooms[s.room_id]||""}); });
    });
  }
  function pollSite(){
    if(!SITE_DOORS.length) return;
    Promise.all(SITE_DOORS.map(function(d){
      return rpc("nsf_room_poll",{p_screen:d.screen}).then(function(r){ return r&&r.id ? {d:d,r:r} : null; }).catch(function(){ return null; });
    })).then(function(all){
      var best=null;
      all.forEach(function(x){ if(x && (+x.r.age||0)<TOTAL-3 && (!best || +x.r.id>+best.r.id)) best=x; });
      if(!best || +best.r.id<=lastSite) return;
      lastSite=+best.r.id; try{ localStorage.setItem("nsf_rc_site_"+sid,String(lastSite)); }catch(e){}
      var d=best.r;
      /* ביטול בחדר שההודעה שלו מוצגת עכשיו — סוגרים */
      if(isCancel(d)){ if(FLOW && FLOW.room===(best.d.room||"בית הכנסת")) cancelFlow(); return; }
      /* אותו חדר לחץ שוב בזמן שההודעה שלו רצה — לא מתחילים מחדש */
      if(flowActive() && FLOW.room===(best.d.room||"בית הכנסת")) return;
      var pr=d.prayer || nsfPrayerNow(new Date(), d.lat!=null?+d.lat:null, d.lng!=null?+d.lng:null);
      if(pr==="ערבית" && d.nusach==="ashkenaz") pr="מעריב";
      startFlow(pr, +d.age||0, best.d.room||"בית הכנסת");
    });
  }

  /* מסך עם חדר — מצב דלת. מסך בלי חדר אבל עם אתר — מצב המסך הראשי.
     משייכים מחדש כל 10 דקות (אם שונה באדמין). */
  var mode="";
  /* משך ההצגה — מהגדרת בית הכנסת (ניהול / אדמין). נבדק כל 2 דקות. */
  function loadSec(row){
    var siteP = row.site_id ? Promise.resolve(row.site_id)
      : (row.room_id ? sfx("rooms?id=eq."+row.room_id+"&select=site_id").then(function(r){ return r&&r[0]&&r[0].site_id; }) : Promise.resolve(null));
    return siteP.then(function(site){
      if(!site) return;
      return sfx("sites?id=eq."+site+"&select=call_seconds").then(function(r){
        var v=r&&r[0]&&+r[0].call_seconds;
        if(v>=15 && v<=1800) NOW_SEC=v;
        TOTAL=PRE_SEC+NOW_SEC+NEXT_SEC;
      });
    }).catch(function(){});
  }
  function arm(){
    sfx("screens?screen_id=eq."+encodeURIComponent(sid)+"&select=room_id,site_id")
    .then(function(rows){
      var row=rows&&rows[0]||{};
      loadSec(row);
      var m=row.room_id ? "room" : (row.site_id ? "site" : "");
      if(m!==mode){ if(timer){ clearInterval(timer); timer=null; } mode=m; }
      if(mode==="room" && !timer){ poll(); timer=setInterval(poll,3000); }
      if(mode==="site"){
        loadDoors(row.site_id).then(function(){ if(!timer){ pollSite(); timer=setInterval(pollSite,4000); } });
      }
    }).catch(function(){});
  }
  function start(){
    /* בדיקה: ?roomtest=1 — כמו מסך דלת; ?roomtest=main — כמו המסך הראשי */
    var rt=qp.get("roomtest");
    if(rt==="1") startFlow(nsfPrayerNow(new Date()), 0);
    if(rt==="main") startFlow(nsfPrayerNow(new Date()), 0, "שטיבל א׳");   /* תצוגת המסך הראשי */
    arm(); setInterval(arm, 2*60*1000);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
