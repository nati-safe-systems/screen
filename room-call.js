/* =====================================================================
   נתי SAFE — "תפילת ___ מתחילה כאן עכשיו"
   ---------------------------------------------------------------------
   נטען במסך דלת של חדר (door.html). המסך בודק כל 3 שניות אם הגבאי
   לחץ על החדר שלו — בשלט או באפליקציה — ואם כן, מקפיץ הודעה ירוקה
   בוהקת על כל המסך ל-45 שניות.

   מסך שלא משויך לחדר (באדמין: אתר + חדר) — הסקריפט פשוט לא פועל.
   ===================================================================== */
(function(){
  var SUPA="https://cxtrrejclkhqhkqbicmz.supabase.co";
  var KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dHJyZWpjbGtocWhrcWJpY216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTk3MDksImV4cCI6MjA5NTU3NTcwOX0._7wB4YwrYEnK6hWuR6YqcFxRb05OLnWvOelIC-ahIEQ";
  var SHOW_SEC=45;

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
  "#nsf-rc .a{font-size:9vmin;margin-top:1.5vh;animation:nsfRcBounce 1s ease-in-out infinite}"+
  "@keyframes nsfRcPop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}"+
  "@keyframes nsfRcGlow{0%,100%{transform:scale(1)}50%{transform:scale(1.04);"+
  " box-shadow:0 0 9vmin rgba(46,255,120,.95),0 0 22vmin rgba(46,255,120,.6),inset 0 0 4vmin rgba(255,255,255,.3)}}"+
  "@keyframes nsfRcShine{0%{background-position:150% 0}100%{background-position:-100% 0}}"+
  "@keyframes nsfRcBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5vh)}}";
  document.head.appendChild(css);

  var box=null, hideT=null;
  function show(prayer, secLeft){
    if(!box){
      box=document.createElement("div"); box.id="nsf-rc";
      box.innerHTML='<div class="c"><div class="p"></div><div class="s">מתחילה כאן עכשיו</div><div class="a">⬇</div></div>';
      document.body.appendChild(box);
    }
    box.querySelector(".p").textContent="תפילת "+prayer;
    var c=box.querySelector(".c"); c.style.animation="none"; void c.offsetWidth; c.style.animation="";
    box.style.display="flex"; void box.offsetWidth; box.classList.add("on");
    clearTimeout(hideT);
    hideT=setTimeout(function(){
      box.classList.remove("on");
      setTimeout(function(){ if(!box.classList.contains("on")) box.style.display="none"; },600);
    }, Math.max(5, secLeft)*1000);
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
      var left=SHOW_SEC-(d.age||0);
      if(left>3) show(d.prayer || nsfPrayerNow(new Date()), left);
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
    if(qp.get("roomtest")==="1") show(nsfPrayerNow(new Date()), 20);
    arm(); setInterval(arm, 10*60*1000);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start); else start();
})();
