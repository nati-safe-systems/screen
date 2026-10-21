/* =====================================================================
   נתי SAFE — נגן ספריות מוזיקה · NatiMusic v1.0 · 21.10.26
   ---------------------------------------------------------------------
   כל ספריה היא תיקיה בגוגל דרייב (בתוך "נתי SAFE מוזיקה").
   באדמין בוחרים לכל מסך מאילו ספריות לנגן — נשמר ב-display_config:
     audio_enabled   מוזיקה פועלת
     audio_libs      ["קלאסי","חסידי"]  — שמות התיקיות
     audio_gas       כתובת סקריפט המוזיקה (מוגדרת באדמין)
     audio_volume    0–100
     audio_shuffle   ערבוב (ברירת מחדל: כן)

   - הרשימה נבדקת מחדש כל 10 דקות: שיר שנוסף לתיקיה נכנס לבד,
     שיר שנמחק יוצא לבד.
   - ערבוב בלי חזרות: כל שיר מתנגן פעם אחת עד שכל הספריה התנגנה.
     המיקום בסבב נשמר במכשיר — רענון לא מתחיל מחדש.
   - כל שיר נטען במלואו לזיכרון לפני שמתנגן, והבא בתור נטען מראש
     ברקע — בלי עצירות באמצע ובלי שקט בין שירים.
   - שבת, חג וימי אבלות — מושתק (כמו במסך הבניין).

   שימוש:
     מסך הבניין:  NatiMusic.apply(DC, {muted: isMusicMuted})  — בכל עדכון הגדרות
     מסכי בית הכנסת: NatiMusic.auto({sb, sk, id})  — טוען את הגדרות המסך לבד
   ===================================================================== */
(function(root){
  if(root.NatiMusic) return;
  var LS = (function(){ try{ var s=root.localStorage; s.setItem("_t","1"); s.removeItem("_t"); return s; }catch(e){ return null; } })();
  function lsGet(k){ try{ return LS ? JSON.parse(LS.getItem(k)||"null") : null; }catch(e){ return null; } }
  function lsSet(k,v){ try{ if(LS) LS.setItem(k, JSON.stringify(v)); }catch(e){} }

  var CFG=null, OPT={}, GAS="", LIBS=[], TRACKS=[], LIST_AT=0, LIST_BUSY=false, LIST_KEY="";
  var Q=null;          /* {key, order:[ids], i} */
  var au=null, curId="", state="", nextTry=0, fading=false;
  var blobs={}, busy={}, fail={};

  function setState(s){ state=s; }
  function vol(){ var v=CFG && +CFG.audio_volume; return Math.max(0, Math.min(100, isFinite(v)&&v>=0 ? v : 40))/100; }
  function libsOf(c){ return (c && Array.isArray(c.audio_libs)) ? c.audio_libs.filter(function(x){ return x && String(x).trim(); }) : []; }

  /* ---------------- השתקה: שבת, חג ואבלות (למסכי בית הכנסת) ---------------- */
  function heb(d){
    var f=new Intl.DateTimeFormat("he-u-ca-hebrew",{day:"numeric",month:"long"}), o={};
    f.formatToParts(d).forEach(function(p){ o[p.type]=p.value; });
    return {d:parseInt(String(o.day).replace(/\D/g,""),10), m:String(o.month||"").trim()};
  }
  function isM(h,name){ return h.m.indexOf(name)===0; }
  function ytDay(h){
    return (isM(h,"תשרי") && [1,2,10,15,22].indexOf(h.d)>-1) ||
           (isM(h,"ניסן") && [15,21].indexOf(h.d)>-1) ||
           ((isM(h,"סיון")||isM(h,"סיוון")) && h.d===6);
  }
  function mourning(h, d){
    var c=CFG||{};
    var mz=c.metzarim_custom||"tammuz17";
    if(mz!=="none"){
      if(mz==="rosh-av"){ if(isM(h,"אב") && h.d<=9) return true; }
      else if((isM(h,"תמוז") && h.d>=17) || (isM(h,"אב") && h.d<=9)) return true;
      if(isM(h,"אב") && h.d===10 && new Date(d.getFullYear(),d.getMonth(),d.getDate()-1).getDay()===6) return true;
    }
    var oc=c.omer_custom||"pesach-lag";
    if(oc!=="none"){
      if(oc==="rc-iyar"){ if(isM(h,"אייר")) return true; if((isM(h,"סיון")||isM(h,"סיוון")) && h.d<=5) return true; }
      else { if(isM(h,"ניסן") && h.d>=16) return true; if(isM(h,"אייר") && h.d<=17) return true; }
    }
    return false;
  }
  function defaultMuted(now){
    try{
      now=now||new Date();
      var hT=heb(now), hN=heb(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,12));
      if(mourning(hT, now)) return true;
      var dow=now.getDay();
      var todayRest=(dow===6)||ytDay(hT), tomRest=(dow===5)||ytDay(hN);
      if(!todayRest && !tomRest) return false;
      var S=root.SITE, Z=null;
      if(S && root.NatiZmanim && S.lat!=null){
        try{ Z=root.NatiZmanim.getZmanim(now,{lat:+S.lat,lng:+S.lng,elevation:+S.elevation||0,
              candleMinutes:+S.candle_offset||40,timeZone:S.timezone||"Asia/Jerusalem"}); }catch(e){}
      }
      var nm=now.getHours()*60+now.getMinutes();
      var candle=Z&&isFinite(Z.candleLighting)?Z.candleLighting:(Z&&isFinite(Z.shkia)?Z.shkia-40:null);
      var rt=Z&&isFinite(Z.tzeitRT)?Z.tzeitRT:null;
      if(candle==null||rt==null){                    /* בלי זמנים — עדיף שקט */
        if(todayRest) return true;
        return tomRest && now.getHours()>=14;
      }
      if(tomRest && nm>=candle-10) return true;      /* עשר דקות ביטחון לפני הדלקת נרות */
      if(todayRest && nm<rt) return true;
      return false;
    }catch(e){ return false; }
  }

  /* ---------------- רשימת השירים מהדרייב ---------------- */
  function loadList(force){
    if(!GAS || LIST_BUSY) return;
    if(!force && TRACKS.length && Date.now()-LIST_AT < 10*60000) return;
    LIST_BUSY=true;
    fetch(GAS+(GAS.indexOf("?")>-1?"&":"?")+"action=libs",{cache:"no-store"})
      .then(function(r){ return r.json(); })
      .then(function(d){
        LIST_BUSY=false; LIST_AT=Date.now();
        if(!d || !d.ok){ setState("שגיאה בספריות: "+((d&&d.error)||"")); return; }
        LIBS=d.libs||[]; lsSet("nsf_mus_libs",{gas:GAS,libs:LIBS,at:LIST_AT});
        build(); tick();
      })
      .catch(function(){
        LIST_BUSY=false; LIST_AT=Date.now()-8*60000;   /* ננסה שוב בעוד 2 דקות */
        if(!LIBS.length){ var c=lsGet("nsf_mus_libs"); if(c && c.gas===GAS){ LIBS=c.libs||[]; build(); tick(); } }
        if(!TRACKS.length) setState("אין חיבור לספריות המוזיקה");
      });
  }
  function build(){
    var want=libsOf(CFG), seen={}, t=[];
    LIBS.forEach(function(l){
      if(want.indexOf(l.name)<0) return;
      (l.files||[]).forEach(function(f){ if(!seen[f.id]){ seen[f.id]=1; t.push({id:f.id,n:f.n,s:f.s,lib:l.name}); } });
    });
    TRACKS=t;
    var ids=t.map(function(x){ return x.id; });
    var key=want.join("|")+"#"+(CFG&&CFG.audio_shuffle===false?"o":"s");
    var sv=lsGet("nsf_mus_q");
    if(!Q){ Q=(sv && sv.key===key && Array.isArray(sv.order)) ? sv : null; }
    if(!Q || Q.key!==key){ Q={key:key, order:makeOrder(ids), i:0}; }
    else{
      /* שירים שנמחקו יוצאים; שירים חדשים נכנסים למקום אקראי בהמשך הסבב */
      var have={}; ids.forEach(function(id){ have[id]=1; });
      var played=Q.order.slice(0,Q.i).filter(function(id){ return have[id]; });
      var rest=Q.order.slice(Q.i).filter(function(id){ return have[id]; });
      var inQ={}; Q.order.forEach(function(id){ inQ[id]=1; });
      ids.forEach(function(id){ if(!inQ[id]){
        if(CFG&&CFG.audio_shuffle===false) rest.push(id);
        else rest.splice(Math.floor(Math.random()*(rest.length+1)),0,id); } });
      Q.order=played.concat(rest); Q.i=played.length;
      if(Q.i>=Q.order.length){ Q.order=makeOrder(ids); Q.i=0; }
    }
    LIST_KEY=key; saveQ();
  }
  function makeOrder(ids){
    var a=ids.slice();
    if(!(CFG&&CFG.audio_shuffle===false)){
      for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), x=a[i]; a[i]=a[j]; a[j]=x; }
      /* שהשיר האחרון בסבב הקודם לא יפתח את הסבב החדש */
      if(a.length>1 && a[0]===curId){ var y=a[0]; a[0]=a[1]; a[1]=y; }
    }
    return a;
  }
  function saveQ(){ if(Q) lsSet("nsf_mus_q",Q); }
  function trackOf(id){ for(var i=0;i<TRACKS.length;i++) if(TRACKS[i].id===id) return TRACKS[i]; return null; }
  function curQid(){ return Q && Q.order.length ? Q.order[Q.i % Q.order.length] : ""; }
  function advance(){
    if(!Q || !Q.order.length) return;
    Q.i++;
    if(Q.i>=Q.order.length){ Q.order=makeOrder(Q.order); Q.i=0; }
    saveQ();
  }
  function peekNext(){ if(!Q||Q.order.length<2) return ""; var j=Q.i+1; return j<Q.order.length ? Q.order[j] : ""; }

  /* ---------------- טעינת שיר לזיכרון ---------------- */
  function fetchTrack(id){
    if(blobs[id]) return Promise.resolve(blobs[id]);
    if(busy[id]) return busy[id];
    var ctl=root.AbortController?new AbortController():null, to=setTimeout(function(){ try{ ctl&&ctl.abort(); }catch(e){} },120000);
    var p=fetch(GAS+(GAS.indexOf("?")>-1?"&":"?")+"action=file&id="+encodeURIComponent(id),{cache:"no-store",signal:ctl?ctl.signal:undefined})
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(!d || !d.ok || !d.b64) throw new Error(d&&d.big?"big":"bad");
        return fetch("data:"+(d.mime||"audio/mpeg")+";base64,"+d.b64).then(function(r){ return r.blob(); });
      })
      .then(function(b){
        clearTimeout(to); delete busy[id];
        var u=URL.createObjectURL(b); blobs[id]=u; trim(id); return u;
      })
      .catch(function(e){
        clearTimeout(to); delete busy[id];
        fail[id]={at:Date.now(), big:(e&&e.message)==="big"}; return null;
      });
    busy[id]=p; return p;
  }
  /* בזיכרון: רק השיר שמתנגן והבא בתור */
  function trim(keep){
    var nx=peekNext();
    Object.keys(blobs).forEach(function(k){
      if(k===keep || k===curId || k===nx) return;
      try{ URL.revokeObjectURL(blobs[k]); }catch(e){} delete blobs[k];
    });
  }
  function failed(id){ var f=fail[id]; return !!(f && Date.now()-f.at < (f.big?6*3600000:30*60000)); }

  /* ---------------- הנגן ---------------- */
  function ensureAu(){
    if(au) return au;
    au=document.createElement("audio"); au.preload="auto"; au.style.display="none";
    au.setAttribute("data-nsf","music");
    au.onended=function(){ advance(); curId=""; tick(); };
    au.onerror=function(){ if(curId){ fail[curId]={at:Date.now()}; try{ URL.revokeObjectURL(blobs[curId]); }catch(e){} delete blobs[curId]; }
      advance(); curId=""; setTimeout(tick, 1500); };
    au.ontimeupdate=function(){ if(au && curId && Math.floor(au.currentTime)%5===0) savePos(); };
    document.body.appendChild(au);
    return au;
  }
  function stop(why){
    if(au){ try{ au.pause(); }catch(e){} try{ au.removeAttribute("src"); au.load(); }catch(e){} }
    curId=""; setState(why||"כבוי");
  }
  function savePos(){ try{ if(au && curId && !au.paused) sessionStorage.setItem("nsf_mus_pos", JSON.stringify({id:curId, t:au.currentTime})); }catch(e){} }
  function fadeIn(v){
    if(!au) return; var a=au, s=0; a.volume=0; fading=true;
    var iv=setInterval(function(){ s++; try{ a.volume=Math.min(v, v*s/15); }catch(e){} if(s>=15){ clearInterval(iv); fading=false; } },100);
  }
  function play(id, url){
    var a=ensureAu(), v=vol(), pos=null;
    curId=id;
    try{ pos=JSON.parse(sessionStorage.getItem("nsf_mus_pos")||"null"); sessionStorage.removeItem("nsf_mus_pos"); }catch(e){}
    a.src=url;
    if(pos && pos.id===id && pos.t>2){
      a.addEventListener("loadedmetadata",function(){ try{ if(pos.t < a.duration-2) a.currentTime=pos.t; }catch(e){} },{once:true});
    }
    fadeIn(v);
    var t=trackOf(id);
    a.play().then(function(){ setState("מנגן · "+(t?t.lib+" · "+nice(t.n):"")); })
      .catch(function(){
        setState("הניגון נחסם — ממתין למגע במסך");
        var go=function(){ if(au) au.play().catch(function(){}); };
        document.addEventListener("click",go,{once:true}); document.addEventListener("touchstart",go,{once:true});
      });
    var nx=peekNext(); if(nx && !failed(nx)) setTimeout(function(){ fetchTrack(nx); }, 8000);
  }
  function nice(n){ return String(n||"").replace(/\.[a-z0-9]+$/i,"").replace(/[_]+/g," "); }

  var loading=false;
  function tick(){
    if(!CFG) return;
    var on=!!CFG.audio_enabled && libsOf(CFG).length && GAS;
    if(!on){ stop(!CFG.audio_enabled?"כבוי בהגדרות":(!GAS?"לא הוגדר סקריפט מוזיקה":"לא נבחרה ספריה")); return; }
    var m=OPT.muted ? !!OPT.muted(new Date()) : defaultMuted(new Date());
    if(m){ stop("מושתק — שבת, חג או ימי אבלות"); return; }
    loadList(false);
    if(!TRACKS.length){ if(!LIST_BUSY && LIBS.length) setState("הספריות שנבחרו ריקות"); else if(!state) setState("טוען ספריות..."); return; }
    if(LIST_KEY!==libsOf(CFG).join("|")+"#"+(CFG.audio_shuffle===false?"o":"s")) build();
    if(au && curId && !au.paused){                    /* מתנגן — רק עוצמה */
      var v=vol(); if(!fading && Math.abs(au.volume-v)>0.01) au.volume=v;
      return;
    }
    if(au && curId && au.paused && au.getAttribute("src")){ au.play().catch(function(){}); return; }
    if(loading || Date.now()<nextTry) return;
    /* מחפשים את השיר הבא שאפשר לנגן */
    var tries=0;
    while(tries<Q.order.length && failed(curQid())){ advance(); tries++; }
    if(tries>=Q.order.length && Q.order.length){ setState("לא ניתן לטעון אף שיר — בודק שוב בעוד דקה"); nextTry=Date.now()+60000; return; }
    var id=curQid(); if(!id) return;
    loading=true; var t=trackOf(id);
    setState("טוען: "+(t?nice(t.n):"")+"...");
    fetchTrack(id).then(function(u){
      loading=false;
      if(!CFG || !CFG.audio_enabled) return;
      if(!u){ advance(); setTimeout(tick, 500); return; }
      if(curQid()!==id){ tick(); return; }
      play(id,u);
    });
  }

  /* מסך הבניין: נקרא בכל פעם שההגדרות נטענות */
  function apply(cfg, opt){
    CFG=cfg||{}; OPT=opt||OPT||{};
    var g=String(CFG.audio_gas||"").trim();
    if(g!==GAS){ GAS=g; LIBS=[]; TRACKS=[]; LIST_AT=0; var c=lsGet("nsf_mus_libs"); if(c&&c.gas===GAS){ LIBS=c.libs||[]; build(); } }
    tick();
  }
  function active(cfg){ cfg=cfg||CFG; return !!(cfg && cfg.audio_enabled && libsOf(cfg).length); }

  /* מסכי בית הכנסת: טוענים את הגדרות המסך כל דקה */
  function auto(o){
    if(!o || !o.id || !o.sb || !o.sk) return;
    function load(){
      fetch(o.sb+"/rest/v1/screens?screen_id=eq."+encodeURIComponent(o.id)+"&select=display_config",
            {headers:{apikey:o.sk, Authorization:"Bearer "+o.sk}, cache:"no-store"})
        .then(function(r){ return r.json(); })
        .then(function(r){
          var dc=r&&r[0]&&r[0].display_config; if(typeof dc==="string"){ try{ dc=JSON.parse(dc); }catch(e){ dc=null; } }
          apply(dc||{}, {});
        }).catch(function(){});
    }
    load(); setInterval(load, 60000);
    /* זמני השבת מחושבים לפי נתוני בית הכנסת, שנטענים אחרי ההגדרות */
    [4000,9000].forEach(function(ms){ setTimeout(function(){ try{ tick(); }catch(e){} }, ms); });
  }

  setInterval(function(){ try{ tick(); }catch(e){} }, 20000);
  root.addEventListener("pagehide", savePos);
  root.addEventListener("beforeunload", savePos);

  root.NatiMusic={apply:apply, auto:auto, active:active, stop:stop,
    playing:function(){ return !!(au && curId && !au.paused); },
    state:function(){ return state; },
    now:function(){ var t=trackOf(curId); return t?{lib:t.lib,name:nice(t.n)}:null; },
    count:function(){ return TRACKS.length; },
    _muted:defaultMuted, VERSION:"1.0"};
})(window);
