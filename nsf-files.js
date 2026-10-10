/* =====================================================================
   נתי SAFE — תצוגת קבצים (PDF שהומרו לתמונה / תמונות)  ·  NatiFiles v1.0 · 11.10.26
   ---------------------------------------------------------------------
   משמש את מסך הפרנסים, חדר הקפה ולוח ההודעות במסך הראשי.

   החלוקה אוטומטית:
     1–8 קבצים  — המסך מתחלק בדיוק לפי הכמות (1, 2, 3, 4 ... 8),
                  בפריסה שנותנת לכל קובץ את הגודל הגדול ביותר.
     9 ומעלה    — הקבצים נוסעים על המסך ברצף, באותו גודל של 8.

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
    ".nfz-cell{position:relative;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center}"+
    ".nfz-cell img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block;"+
    " border-radius:.6vh;box-shadow:0 .6vh 2vh rgba(0,0,0,.55)}"+
    ".nfz-track{position:absolute;top:0;bottom:0;right:auto;left:0;display:grid;grid-auto-flow:column;"+
    " align-content:center;direction:ltr;will-change:transform;animation:nfzMq var(--nfz-d,60s) linear infinite}"+
    "@keyframes nfzMq{from{transform:translateX(-50%)}to{transform:translateX(0)}}"+
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

  /* הפריסה שנותנת לכל קובץ את השטח הגדול ביותר */
  function best(n, W, H, a, g){
    var top=null;
    for(var r=1;r<=n;r++){
      var c=Math.ceil(n/r);
      var cw=(W-(c-1)*g)/c, ch=(H-(r-1)*g)/r;
      if(cw<=0||ch<=0) continue;
      var w=Math.min(cw, ch*a), h=w/a;
      var area=w*h;
      if(!top || area>top.area+0.5) top={r:r,c:c,w:w,h:h,cw:cw,ch:ch,area:area};
    }
    return top||{r:1,c:n,w:W/n,h:H,cw:W/n,ch:H,area:0};
  }

  function cell(u){ return '<div class="nfz-cell"><img src="'+String(u).replace(/"/g,"&quot;")+'" alt=""></div>'; }

  function draw(host, urls, o){
    var W=host.clientWidth, H=host.clientHeight;
    if(!W||!H) return false;
    var g=Math.round(window.innerHeight*GAP_VH/100);
    var a=median(urls.map(function(u){ return ASPECT[u]||0.707; }));
    var max=o.max||8, n=urls.length, html;
    if(n<=max){
      var L=best(n,W,H,a,g);
      html='<div class="nfz-grid" style="grid-template-columns:repeat('+L.c+','+Math.floor(L.cw)+'px);'+
           'grid-template-rows:repeat('+L.r+','+Math.floor(L.ch)+'px);gap:'+g+'px">'+urls.map(cell).join("")+'</div>';
    }else{
      /* יותר מ-8: אותו גודל כמו בחלוקה ל-8, והקבצים נוסעים ברצף */
      var L8=best(max,W,H,a,g);
      var r=L8.r, w=Math.floor(L8.w), h=Math.floor(L8.h);
      var cols=Math.ceil(n/r);
      var one=urls.map(cell).join("");
      var copyW=cols*(w+g);
      var dur=Math.max(20, copyW/(o.speed||60));
      html='<div class="nfz-track" style="--nfz-d:'+dur.toFixed(1)+'s;grid-template-rows:repeat('+r+','+h+'px);'+
           'grid-auto-columns:'+w+'px;gap:'+g+'px;column-gap:'+g+'px">'+one+
           /* ריווח בסוף כל סבב, כדי שהעותק השני יתחבר בלי קפיצה */
           (n%r? new Array(r-(n%r)+1).join('<div></div>') : '')+
           one+(n%r? new Array(r-(n%r)+1).join('<div></div>') : '')+'</div>';
    }
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
          var k=host.clientWidth+"x"+host.clientHeight;
          if(k!==host.__nfzSize && host.__nfzUrls){ host.__nfzSize=k; draw(host,host.__nfzUrls,host.__nfzO||{}); }
        },250);
      });
      host.__nfzRO.observe(host);
    }
    var sig=urls.join("|")+"#"+(o.max||8);
    if(sig===host.__nfzSig) return;           /* אין שינוי — לא נוגעים */
    host.__nfzSig=sig; host.__nfzUrls=urls; host.__nfzO=o;
    if(!urls.length){ host.innerHTML=""; return; }
    loadAspects(urls).then(function(){
      if(host.__nfzSig!==sig) return;
      if(draw(host,urls,o)) host.__nfzSize=host.clientWidth+"x"+host.clientHeight;
    });
  }

  /* החלפה בין שתי תצוגות (למשל פרנסים בטקסט ופרנסים בקבצים) */
  var ALT={};
  function show(el,on){ if(!el) return; if(on) el.style.removeProperty("display"); else el.style.setProperty("display","none","important"); if(on){ el.classList.remove("nfz-in"); void el.offsetWidth; el.classList.add("nfz-in"); } }
  function alternate(key, a, b, sec){
    var s=ALT[key];
    if(s && s.a===a && s.b===b) return;
    stop(key);
    s=ALT[key]={a:a,b:b,i:0};
    show(a,true); show(b,false);
    s.t=setInterval(function(){ s.i=1-s.i; show(s.i?b:a,true); show(s.i?a:b,false); }, Math.max(8,sec||20)*1000);
  }
  function single(key, el, other){
    var s=ALT[key]; if(s && s.single===el) return;     /* כבר במצב הזה */
    stop(key); ALT[key]={single:el}; show(el,true); if(other) show(other,false);
  }
  function stop(key){ var s=ALT[key]; if(s){ if(s.t) clearInterval(s.t); delete ALT[key]; } }

  root.NatiFiles={render:render, alternate:alternate, single:single, stop:stop, VERSION:"1.0"};
})(window);
