/* =====================================================================
   נתי SAFE — "תפילת ___ מתחילה כאן עכשיו"
   ---------------------------------------------------------------------
   גרסה 2.1 · 08.10.26
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
  var PRE_SEC=180;    // ספירה לאחור עד תחילת התפילה
  var NOW_SEC=120;    // "מתחילה עכשיו" + חץ
  var NEXT_SEC=180;   // "המניין הבא בשטיבל ..."
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

  var css=document.createElement("style");
  css.textContent=
  "#nsf-rc{position:fixed;inset:0;z-index:2147482500;display:none;align-items:center;justify-content:center;"+
  " background:radial-gradient(ellipse at center,rgba(0,60,25,.55),rgba(0,0,0,.82));direction:rtl;"+
  " font-family:Heebo,'Segoe UI',Arial,sans-serif;opacity:0;transition:opacity .5s}"+
  "#nsf-rc.on{display:flex;opacity:1}"+
  "#nsf-rc .c{position:relative;text-align:center;padding:5vh 6vw;border-radius:3vmin;max-width:92vw;"+
  " background:linear-gradient(160deg,#1fd15f,#0c9a3c 55%,#067a2d);border:.5vmin solid #b9ffcf;"+
  " box-shadow:0 0 6vmin rgba(46,255,120,.75),0 0 16vmin rgba(46,255,120,.45),inset 0 0 4vmin rgba(255,255,255,.25);"+
  " animation:nsfRcPop .9s cubic-bezier(.2,1.6,.4,1) both,nsfRcGlow 1.6s ease-in-out .9s infinite}"+
  "#nsf-rc .c::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;"+
  " background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);"+
  " background-size:250% 100%;animation:nsfRcShine 2.6s linear infinite}"+
  "#nsf-rc .p{color:#fff;font-weight:900;font-size:13vmin;line-height:1.05;text-shadow:0 .6vmin 2vmin rgba(0,0,0,.35)}"+
  "#nsf-rc .s{color:#eafff0;font-weight:800;font-size:7vmin;margin-top:2vh;text-shadow:0 .4vmin 1.4vmin rgba(0,0,0,.3)}"+
  "#nsf-rc .lg{display:block;margin:0 auto 2.6vh;max-height:17vh;max-width:56vw;object-fit:contain;"+
  " filter:drop-shadow(0 0 .8vmin rgba(255,214,90,.95)) drop-shadow(0 0 2.6vmin rgba(255,190,40,.55))}"+
  "#nsf-rc .a{margin-top:2.2vh;animation:nsfRcBounce 1s ease-in-out infinite;line-height:0}"+
  "#nsf-rc .a svg{width:15vmin;height:15vmin;filter:drop-shadow(0 .6vmin 1.4vmin rgba(0,0,0,.35))}"+
  "#nsf-rc .tm{color:#fff;font-weight:900;font-size:22vmin;line-height:1;margin-top:1.2vh;"+
  " font-variant-numeric:tabular-nums;font-family:Rubik,Heebo,Arial,sans-serif;direction:ltr;"+
  " text-shadow:0 .8vmin 2.4vmin rgba(0,0,0,.35)}"+
  "#nsf-rc .rm{color:#fff3c4;font-weight:900;font-size:9vmin;margin-top:1.6vh;line-height:1.1}"+
  "#nsf-rc .sm{color:#eafff0;font-weight:700;font-size:4.6vmin;margin-top:1.4vh;opacity:.95}"+
  /* שלב "המניין הבא" — כרטיס כהה עם זהב, כדי שיהיה ברור שזה מידע אחר */
  "#nsf-rc .c.nx{background:linear-gradient(160deg,#18233f,#0d1630 60%,#08101f);border-color:#e8c766;"+
  " box-shadow:0 0 5vmin rgba(232,199,102,.45),0 0 14vmin rgba(232,199,102,.25),inset 0 0 4vmin rgba(255,255,255,.08);"+
  " animation:nsfRcPop .9s cubic-bezier(.2,1.6,.4,1) both}"+
  "#nsf-rc .c.nx .p{color:#ffd769}"+
  "#nsf-rc .c.nx .s{color:#fff}"+
  "#nsf-rc .c.nx .sm{color:#cfd8e8}"+
  "@keyframes nsfRcPop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}"+
  "@keyframes nsfRcGlow{0%,100%{transform:scale(1)}50%{transform:scale(1.04);"+
  " box-shadow:0 0 9vmin rgba(46,255,120,.95),0 0 22vmin rgba(46,255,120,.6),inset 0 0 4vmin rgba(255,255,255,.3)}}"+
  "@keyframes nsfRcShine{0%{background-position:150% 0}100%{background-position:-100% 0}}"+
  "@keyframes nsfRcBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5vh)}}";
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
    box.innerHTML='<div class="c"><img class="lg" alt="" style="display:none">'+
      '<div class="p"></div><div class="s"></div><div class="tm"></div><div class="rm"></div><div class="sm"></div>'+
      '<div class="a"><svg viewBox="0 0 100 100" aria-hidden="true">'+
        '<path d="M50 92 L14 52 H36 V8 H64 V52 H86 Z" fill="#ffffff" stroke="#e9ffef" stroke-width="3" stroke-linejoin="round"/>'+
      '</svg></div></div>';
    document.body.appendChild(box);
  }
  function set(cls, txt){ var e=box.querySelector("."+cls); e.textContent=txt||""; e.style.display=txt?"":"none"; }
  function pop(){ var c=box.querySelector(".c"); c.style.animation="none"; void c.offsetWidth; c.style.animation=""; }
  function open(){
    var lg=box.querySelector(".lg"), src=logoUrl();
    if(src){ if(lg.getAttribute("src")!==src) lg.src=src; lg.style.display="block"; lg.onerror=function(){ lg.style.display="none"; }; }
    else lg.style.display="none";
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
  function startFlow(prayer, ageSec){
    build();
    FLOW={prayer:prayer, t0:Date.now()-Math.max(0,ageSec||0)*1000, phase:"", next:null, nextAsked:false};
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
      arrow.style.display=(ph==="next")?"none":"";
      if(ph==="pre"){ set("p","תפילת "+FLOW.prayer); set("s","תתחיל כאן בעוד"); set("rm",""); set("sm",""); }
      if(ph==="now"){ set("p","תפילת "+FLOW.prayer); set("s","מתחילה כאן עכשיו"); set("tm",""); set("rm",""); set("sm",""); }
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
      if(src){ FLOW.lg=1; if(lg.getAttribute("src")!==src) lg.src=src; lg.style.display="block"; } }
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
      /* ספרדי = ערבית, אשכנזי = מעריב — לפי הגדרת בית הכנסת */
      var pr=d.prayer || nsfPrayerNow(new Date(), d.lat!=null?+d.lat:null, d.lng!=null?+d.lng:null);
      if(pr==="ערבית" && d.nusach==="ashkenaz") pr="מעריב";
      if(age < TOTAL-3) startFlow(pr, age);
    }).catch(function(){});
  }

  /* רק מסך שמשויך לחדר בודק; משייכים מחדש כל 10 דקות (אם שונה באדמין) */
  function arm(){
    fetch(SUPA+"/rest/v1/screens?screen_id=eq."+encodeURIComponent(sid)+"&select=room_id",
      {headers:{apikey:KEY,Authorization:"Bearer "+KEY},cache:"no-store"})
    .then(function(r){ return r.json(); })
    .then(function(rows){
      var has=!!(rows && rows[0] && rows[0].room_id);
      if(has && !timer){ poll(); timer=setInterval(poll,3000); }
      if(!has && timer){ clearInterval(timer); timer=null; }
    }).catch(function(){});
  }
  function start(){
    /* בדיקה: ?roomtest=1 — הרצף המלא; ?roomtest=now / next — קפיצה לשלב */
    var rt=qp.get("roomtest");
    if(rt==="1") startFlow(nsfPrayerNow(new Date()), 0);
    if(rt==="now") startFlow(nsfPrayerNow(new Date()), PRE_SEC);
    if(rt==="next") startFlow(nsfPrayerNow(new Date()), PRE_SEC+NOW_SEC);
    arm(); setInterval(arm, 10*60*1000);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
