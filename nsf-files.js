/* =====================================================================
   נתי SAFE — תצוגת קבצים (PDF שהומרו לתמונה / תמונות)  ·  NatiFiles v2.0 · 14.10.26
   ---------------------------------------------------------------------
   משמש את מסך הפרנסים, חדר הקפה ולוח ההודעות במסך הראשי.

   החלוקה אוטומטית (2.0):
     קובץ לאורך  — בגובה מלא, אחד ליד השני.
     קובץ לרוחב  — שניים אחד מעל השני.
     נכנס הכל    — עומד במרכז. לא נכנס — נוסע ברצף משמאל לימין, בגדול,
                   והקובץ הראשון מתחיל בצד ימין.

   שימוש:
     NatiFiles.render(hostEl, ["https://...jpg", ...], {max:8, speed:60});
     NatiFiles.alternate("key", elA, elB, 20)   // החלפה בין שתי תצוגות
     NatiFiles.single("key", el)                // רק תצוגה אחת
   ===================================================================== */
(function(root){
  "use strict";
  var GAP_VH=1.2;
  var css=document.createElement("style");
  css.textContent=
    ".nfz{position:absolute;inset:0;overflow:hidden}"+
    ".nfz-grid{position:absolute;inset:0;display:grid;justify-content:center;align-content:center}"+
    ".nfz-row{position:absolute;inset:0;display:flex;flex-direction:row;justify-content:center;align-items:center}"+
    ".nfz-col{display:flex;flex-direction:column;justify-content:center;align-items:center;flex:0 0 auto}"+
    ".nfz-cell{position:relative;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center}"+
    ".nfz-cell img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block;"+
    " border-radius:.5vh;box-shadow:0 .6vh 2vh rgba(0,0,0,.55);image-rendering:auto}"+
    ".nfz-track{position:absolute;top:0;bottom:0;left:0;display:flex;flex-direction:row;align-items:center;direction:ltr;"+
    " width:max-content;will-change:transform;backface-visibility:hidden;"+
    " animation:nfzMq var(--nfz-d,60s) linear infinite}"+
    "@keyframes nfzMq{from{transform:translate3d(var(--nfz-a),0,0)}to{transform:translate3d(var(--nfz-b),0,0)}}"+
    ".nfz-in{animation:nfzIn .8s ease both}"+
    "@keyframes nfzIn{from{opacity:0}to{opacity:1}}";
  document.head.appendChild(css);

  var ASPECT={};   /* url -> רוחב/גובה */
  function loadAspects(urls){
    return Promise.all(urls.map(function(u){
      if(ASPECT[u]) return Promise.resolve();
      return new Promise(function(res){
        var im=new Image();
        im.onload=function(){ ASPECT[u]=(im.naturalWidth||707)/(im.naturalHeight||1000); res(); };
        im.onerror=function(){ ASPECT[u]=0.707; res(); };
        im.src=u;
      });
    }));
  }
  function median(a){ var s=a.slice().sort(function(x,y){return x-y;}); return s.length?s[Math.floor(s.length/2)]:0.707; }

  /* רשת אחידה — רק כשכל הקבצים באותו כיוון */
  function best(n, W, H, a, g){
    var top=null;
    for(var r=1;r<=n;r++){
      var c=Math.ceil(n/r);
      var cw=(W-(c-1)*g)/c, ch=(H-(r-1)*g)/r;
      if(cw<=0||ch<=0) continue;
      var w=Math.min(cw, ch*a), h=w/a;
      if(!top || w*h>top.area+0.5) top={r:r,c:c,w:w,h:h,cw:cw,ch:ch,area:w*h};
    }
    return top;
  }

  /* 2.0: עמודות לפי כיוון הקובץ.
     קובץ לאורך  — עמודה בגובה מלא (הכי גדול שאפשר).
     קובץ לרוחב  — שניים אחד מעל השני באותה עמודה.
     אם הכל נכנס — עומד במרכז. אם לא — נוסע ברצף משמאל לימין. */
  var LAND=1.15;
  function columns(urls, W, H, g){
    var out=[], pend=null;
    urls.forEach(function(u){
      var a=ASPECT[u]||0.707;
      if(a<LAND){ out.push({items:[u]}); }
      else if(pend){ pend.items.push(u); pend=null; }
      else { pend={items:[u]}; out.push(pend); }
    });
    out.forEach(function(c){
      if(c.items.length===2){
        var h=(H-g)/2, a=Math.max(ASPECT[c.items[0]]||1.41, ASPECT[c.items[1]]||1.41);
        c.w=Math.min(W, h*a); c.h=h;
      }else{
        var a1=ASPECT[c.items[0]]||0.707;
        c.w=Math.min(W, H*a1); c.h=H;
      }
    });
    return out;
  }
  function colHtml(c, g){
    return '<div class="nfz-col" style="width:'+Math.floor(c.w)+'px;gap:'+g+'px">'+
      c.items.map(function(u){
        return '<div class="nfz-cell" style="width:'+Math.floor(c.w)+'px;height:'+Math.floor(c.h)+'px">'+
               '<img src="'+String(u).replace(/"/g,"&quot;")+'" alt="" decoding="async"></div>';
      }).join("")+'</div>';
  }
  function cell(u){ return '<div class="nfz-cell"><img src="'+String(u).replace(/"/g,"&quot;")+'" alt="" decoding="async"></div>'; }

  function draw(host, urls, o){
    var W=host.clientWidth, H=host.clientHeight;
    if(!W||!H) return false;
    var g=Math.round(window.innerHeight*GAP_VH/100);
    var n=urls.length, html, moving=false;
    var cols=columns(urls,W,H,g);
    var totW=cols.reduce(function(s,c){ return s+c.w; },0)+g*(cols.length-1);
    var area=cols.reduce(function(s,c){ return s+c.items.length*c.w*c.h; },0)/n;
    /* כל הקבצים באותו כיוון — בודקים גם רשת אחידה, ולוקחים את הגדולה מבין השתיים */
    var asp=urls.map(function(u){ return ASPECT[u]||0.707; });
    var same=asp.every(function(a){ return (a<LAND)===(asp[0]<LAND); });
    var G=(same && n<=(o.max||8)) ? best(n,W,H,median(asp),g) : null;
    var fits=(totW<=W+1);
    /* רשת אחידה רק אם היא באמת נותנת קבצים גדולים: כשהעמודות נכנסות — אם היא גדולה יותר;
       כשלא נכנסות — אם היא כמעט באותו גודל (אחרת עדיף שהקבצים ייסעו בגדול) */
    var useGrid = G && (fits ? (G.area>area*1.05) : (G.area>=area*0.75));
    if(useGrid){
      html='<div class="nfz-grid" style="grid-template-columns:repeat('+G.c+','+Math.floor(G.cw)+'px);'+
           'grid-template-rows:repeat('+G.r+','+Math.floor(G.ch)+'px);gap:'+g+'px">'+urls.map(cell).join("")+'</div>';
    }else if(fits){
      html='<div class="nfz-row" style="gap:'+g+'px">'+cols.map(function(c){ return colHtml(c,g); }).join("")+'</div>';
    }else{
      /* נוסע: הקובץ הראשון מתחיל בצד ימין, והבאים נכנסים משמאל לפי הסדר.
         שני עותקים צמודים — החזרה להתחלה לא נראית. */
      moving=true;
      var rev=cols.slice().reverse().map(function(c){ return colHtml(c,g); }).join("");
      var C=totW+g;                      /* אורך עותק אחד כולל הרווח שאחריו */
      var dur=Math.max(12, C/(o.speed||55));
      host.__nfzCycle=dur;
      html='<div class="nfz-track" style="gap:'+g+'px;padding-right:'+g+'px;--nfz-a:'+(W-2*C).toFixed(1)+'px;--nfz-b:'+(W-C).toFixed(1)+'px;--nfz-d:'+dur.toFixed(2)+'s">'+
           rev+rev+'</div>';
    }
    if(!moving) host.__nfzCycle=0;
    host.innerHTML='<div class="nfz nfz-in">'+html+'</div>';
    return true;
  }

  function render(host, urls, o){
    if(!host) return;
    o=o||{};
    urls=(urls||[]).filter(Boolean);
    if(!host.__nfzRO && root.ResizeObserver){
      host.__nfzRO=new ResizeObserver(function(){
        clearTimeout(host.__nfzT);
        host.__nfzT=setTimeout(function(){
          if(host.clientWidth<40) return;            /* מוסתר כרגע — לא מציירים */
          var k=host.clientWidth+"x"+host.clientHeight;
          if(k!==host.__nfzSize && host.__nfzUrls){ host.__nfzSize=k; draw(host,host.__nfzUrls,host.__nfzO||{}); }
        },250);
      });
      host.__nfzRO.observe(host);
    }
    var sig=urls.join("|")+"#"+(o.max||8)+"#"+(o.speed||"");
    if(sig===host.__nfzSig) return;           /* אין שינוי — לא נוגעים */
    host.__nfzSig=sig; host.__nfzUrls=urls; host.__nfzO=o;
    if(!urls.length){ host.innerHTML=""; host.__nfzCycle=0; return; }
    loadAspects(urls).then(function(){
      if(host.__nfzSig!==sig) return;
      var go=function(){
        if(host.__nfzSig!==sig) return;
        if(draw(host,urls,o)) host.__nfzSize=host.clientWidth+"x"+host.clientHeight;
        else setTimeout(go,400);              /* מוסתר — מציירים כשיופיע */
      };
      go();
    });
  }
  /* כמה שניות לוקח סבב נסיעה מלא (0 = לא נוסע) */
  function cycleSec(host){ return (host && host.__nfzCycle) || 0; }

  /* החלפה בין שתי תצוגות (למשל פרנסים בטקסט ופרנסים בקבצים).
     2.0: כל תצוגה נשארת עד שסיימה סבב נסיעה מלא — לא נקטעת באמצע.
     a / b: אלמנטים. secA/secB: פונקציה שמחזירה כמה שניות להציג (0 = ברירת מחדל).
     onA / onB: נקרא כשהתצוגה מופיעה (למשל כדי להתחיל את הנסיעה מההתחלה). */
  var ALT={};
  function show(el,on){ if(!el) return; if(on) el.style.removeProperty("display"); else el.style.setProperty("display","none","important"); if(on){ el.classList.remove("nfz-in"); void el.offsetWidth; el.classList.add("nfz-in"); } }
  function alternate(key, a, b, sec, x){
    x=x||{};
    var s=ALT[key];
    if(s && s.a===a && s.b===b){ s.sec=sec; s.x=x; return; }
    stop(key);
    s=ALT[key]={a:a,b:b,i:0,sec:sec,x:x};
    function dur(i){
      var d=0;
      try{ d=+(i? (s.x.secB&&s.x.secB()) : (s.x.secA&&s.x.secA()))||0; }catch(e){}
      if(!d) d=Math.max(8,s.sec||20);
      return Math.min(240, Math.max(8, d))*1000;
    }
    function go(){
      var el=s.i?b:a, other=s.i?a:b;
      show(el,true); show(other,false);
      try{ var f=s.i?s.x.onB:s.x.onA; if(f) f(); }catch(e){}
      /* המשך נמדד רגע אחרי ההופעה — אז כבר ידוע כמה זמן לוקח סבב הנסיעה */
      var waited=800;
      function measure(){
        if(ALT[key]!==s) return;
        /* קבצים שעוד נטענים — מחכים (עד 15 שניות) כדי לדעת את אורך הנסיעה האמיתי */
        if(el.__nfzSig && el.__nfzUrls && el.__nfzUrls.length && !el.querySelector(".nfz") && waited<15000){
          waited+=1000; s.t=setTimeout(measure,1000); return;
        }
        s.t=setTimeout(function(){ if(ALT[key]!==s) return; s.i=1-s.i; go(); }, Math.max(1000, dur(s.i)-(waited===800?800:500)));
      }
      s.t=setTimeout(measure, 800);
    }
    go();
  }
  function single(key, el, other){
    var s=ALT[key]; if(s && s.single===el) return;     /* כבר במצב הזה */
    stop(key); ALT[key]={single:el}; show(el,true); if(other) show(other,false);
  }
  function stop(key){ var s=ALT[key]; if(s){ if(s.t) clearTimeout(s.t); delete ALT[key]; } }

  root.NatiFiles={render:render, alternate:alternate, single:single, stop:stop, cycleSec:cycleSec, VERSION:"2.0"};
})(window);
