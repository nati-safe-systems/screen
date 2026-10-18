/* =====================================================================
   נתי SAFE — תצוגת קבצים (PDF שהומרו לתמונה / תמונות)  ·  NatiFiles v2.3 · 18.10.26
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
    ".nfz-cell > img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block;"+
    " border-radius:.5vh;box-shadow:0 .6vh 2vh rgba(0,0,0,.55);image-rendering:auto}"+
    ".nfz-track{position:absolute;top:0;bottom:0;left:0;display:flex;flex-direction:row;align-items:center;direction:ltr;"+
    " width:max-content;will-change:transform;backface-visibility:hidden;"+
    " animation:nfzMq var(--nfz-d,60s) linear infinite}"+
    "@keyframes nfzMq{from{transform:translate3d(var(--nfz-a),0,0)}to{transform:translate3d(var(--nfz-b),0,0)}}"+
    /* 2.3: מסגרת זהב דקה ומעוגלת — קו זהב עדין, פינות רכות וזוהר חלש */
    ".nfz-fr{position:relative;box-sizing:border-box;width:100%;height:100%;display:flex;align-items:center;justify-content:center;"+
    " padding:.3vh;border-radius:1.3vh;border:.2vh solid transparent;"+
    " background:linear-gradient(#0b0905,#0b0905) padding-box,"+
    "  linear-gradient(135deg,#8a6a1f 0%,#f7e08a 28%,#b8902f 52%,#fff3b8 74%,#9b7724 100%) border-box;"+
    " box-shadow:0 0 2.2vh rgba(232,199,102,.16),0 1.1vh 2.8vh rgba(0,0,0,.6)}"+
    ".nfz-fr img{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain;"+
    " border-radius:0!important;box-shadow:none!important;display:block}"+
    ".nfz-cell canvas.nfz-pdf,.nfz-fr canvas.nfz-pdf{display:block}"+
    ".nfz-diag{position:absolute;left:4px;bottom:4px;z-index:5;background:rgba(0,0,0,.8);color:#7ee787;font:700 12px Arial;padding:2px 6px;border-radius:4px;direction:rtl}"+
    "#nfz-scr{position:fixed;top:6px;left:6px;z-index:2147483000;background:rgba(0,0,0,.85);color:#ffcc00;font:700 14px Arial;padding:6px 10px;border-radius:6px;direction:rtl;line-height:1.5}"+
    ".nfz-in{animation:nfzIn .8s ease both}"+
    "@keyframes nfzIn{from{opacity:0}to{opacity:1}}";
  document.head.appendChild(css);

  var ASPECT={};   /* url -> רוחב/גובה */
  var SRC={};      /* url -> [רוחב, גובה] של קובץ המקור */

  /* ---------- 2.1: PDF מקורי — מצויר על המסך ברזולוציה המדויקת של המסך ----------
     קובץ PDF שהועלה נשמר גם כמקור. בכתובת התמונה מופיע:  ...jpg#pdf=<כתובת ה-PDF>&p=<עמוד>
     התמונה (JPG) מוצגת מיד; ברגע שה-PDF מוכן הוא מצויר מחדש בדיוק בגודל
     שבו הוא מוצג — טקסט חד לגמרי, בכל מסך (גם 4K). אם משהו נכשל — נשארת התמונה. */
  function parse(u){
    u=String(u||"");
    var h=u.indexOf("#"), base=h>-1?u.slice(0,h):u, frag=h>-1?u.slice(h+1):"";
    var m=frag.match(/(?:^|&)pdf=([^&]+)/), pm=frag.match(/(?:^|&)p=(\d+)/);
    if(m) return {img:base, pdf:decodeURIComponent(m[1]), page:pm?+pm[1]:1};
    if(/\.pdf(\?|$)/i.test(base)){ var pp=frag.match(/page=(\d+)/); return {img:null, pdf:base, page:pp?+pp[1]:1}; }
    return {img:base, pdf:null, page:1};
  }
  var PDFJS="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  var libP=null, DOCS={};
  function pdfLib(){
    if(root.pdfjsLib) return Promise.resolve(root.pdfjsLib);
    if(libP) return libP;
    libP=new Promise(function(res,rej){
      var sc=document.createElement("script"); sc.src=PDFJS+"pdf.min.js";
      sc.onload=function(){ root.pdfjsLib ? res(root.pdfjsLib) : rej(new Error("pdf.js")); };
      sc.onerror=function(){ libP=null; rej(new Error("pdf.js")); };
      document.head.appendChild(sc);
    });
    return libP;
  }
  function pdfDoc(url){
    if(DOCS[url]) return DOCS[url];
    DOCS[url]=pdfLib().then(function(L){
      L.GlobalWorkerOptions.workerSrc=PDFJS+"pdf.worker.min.js";
      return L.getDocument({url:url, cMapUrl:"https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/", cMapPacked:true,
        standardFontDataUrl:"https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/",
        disableFontFace:true, useSystemFonts:false}).promise;   /* מצייר את האותיות מהקובץ עצמו — עברית תקינה */
    });
    DOCS[url].catch(function(){ delete DOCS[url]; });
    return DOCS[url];
  }
  function pdfPage(url,n){ return pdfDoc(url).then(function(d){ return d.getPage(Math.min(Math.max(1,n||1), d.numPages)); }); }

  /* ציור ה-PDF בדיוק בגודל התצוגה (פיקסלים אמיתיים של המסך). נשמר בזיכרון לפי קובץ+גודל. */
  var RENDERED={}, RKEYS=[];
  function renderPdfTo(P, cw, ch){
    var dpr=Math.max(1, root.devicePixelRatio||1);
    var key=P.pdf+"|"+P.page+"|"+Math.round(cw)+"x"+Math.round(ch)+"|"+dpr;
    if(RENDERED[key]) return RENDERED[key];
    RENDERED[key]=pdfPage(P.pdf,P.page).then(function(pg){
      var v=pg.getViewport({scale:1});
      var sc=Math.min(cw/v.width, ch/v.height)*dpr;
      /* לא חורגים מגבולות קנבס סבירים */
      sc=Math.min(sc, 4096/Math.max(v.width,v.height));
      var vp=pg.getViewport({scale:sc});
      var cv=document.createElement("canvas");
      cv.width=Math.round(vp.width); cv.height=Math.round(vp.height);
      var cx=cv.getContext("2d"); cx.fillStyle="#fff"; cx.fillRect(0,0,cv.width,cv.height);
      return pg.render({canvasContext:cx, viewport:vp}).promise.then(function(){ return cv; });
    });
    RENDERED[key].catch(function(){ delete RENDERED[key]; });
    RKEYS.push(key); while(RKEYS.length>40){ delete RENDERED[RKEYS.shift()]; }
    return RENDERED[key];
  }
  /* אחרי הציור: כל קובץ שיש לו PDF מקורי מוחלף בציור חד בגודל המדויק */
  function sharpen(host, sig){
    var imgs=host.querySelectorAll("img[data-u]");
    Array.prototype.forEach.call(imgs, function(im){
      var P=parse(im.getAttribute("data-u"));
      if(!P.pdf) return;
      var cell=im.parentNode, cs=getComputedStyle(cell);
      var cw=cell.clientWidth-(parseFloat(cs.paddingLeft)||0)-(parseFloat(cs.paddingRight)||0),
          ch=cell.clientHeight-(parseFloat(cs.paddingTop)||0)-(parseFloat(cs.paddingBottom)||0);
      if(!cw||!ch) return;
      renderPdfTo(P, cw, ch).then(function(src){
        if((sig!==null && host.__nfzSig!==sig) || !im.parentNode) return;
        var dpr=Math.max(1, root.devicePixelRatio||1);
        var cv=document.createElement("canvas"); cv.width=src.width; cv.height=src.height;
        cv.getContext("2d").drawImage(src,0,0);
        cv.className="nfz-pdf";
        cv.style.width=(src.width/dpr)+"px"; cv.style.height=(src.height/dpr)+"px";
        im.parentNode.replaceChild(cv, im);
        diagCell(cell, P, src, dpr, true);
      }).catch(function(){});
      diagCell(cell, P, null, 0, false, im);
    });
  }
  /* בדיקת איכות: הוסיפו ?diag=1 לכתובת המסך */
  var DIAG=false; try{ DIAG=/[?&]diag=1/.test(location.search); }catch(e){}
  function diagCell(cell, P, cv, dpr, isPdf, im){
    if(!DIAG || !cell) return;
    var d=cell.querySelector(".nfz-diag"); if(!d){ d=document.createElement("div"); d.className="nfz-diag"; cell.appendChild(d); }
    var dp=Math.max(1, root.devicePixelRatio||1);
    var shown=Math.round(cell.clientWidth*dp)+"×"+Math.round(cell.clientHeight*dp);
    var L=function(t){ return "\u2066"+t+"\u2069"; };
    shown=L(shown);
    if(isPdf) d.textContent="PDF מקורי ✓ · מצויר "+L(cv.width+"×"+cv.height)+" · תא "+shown;
    else {
      var s=im&&im.naturalWidth? L(im.naturalWidth+"×"+im.naturalHeight) : "?";
      d.textContent=(P.pdf?"ממתין ל-PDF · ":"תמונה בלבד · ")+"מקור "+s+" · תא "+shown;
    }
  }
  function loadAspects(urls){
    return Promise.all(urls.map(function(u){
      if(ASPECT[u]) return Promise.resolve();
      var P=parse(u);
      if(!P.img && P.pdf){
        return pdfPage(P.pdf,P.page).then(function(pg){ var v=pg.getViewport({scale:1}); ASPECT[u]=v.width/v.height; })
          .catch(function(){ ASPECT[u]=0.707; });
      }
      return new Promise(function(res){
        var im=new Image();
        im.onload=function(){ ASPECT[u]=(im.naturalWidth||707)/(im.naturalHeight||1000); SRC[u]=[im.naturalWidth,im.naturalHeight]; res(); };
        im.onerror=function(){ ASPECT[u]=0.707; res(); };
        im.src=P.img;
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
  function columns(urls, W, H, g, noPair){
    var out=[], pend=null;
    urls.forEach(function(u){
      var a=ASPECT[u]||0.707;
      if(a<LAND || noPair){ out.push({items:[u]}); }
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
               '<div class="nfz-fr">'+imgTag(u)+'</div></div>';
      }).join("")+'</div>';
  }
  function imgTag(u){
    var P=parse(u), q=function(x){ return String(x).replace(/"/g,"&quot;"); };
    /* PDF בלבד (בלי תמונה) — מקום ריק לבן עד שהציור מוכן */
    var src=P.img || "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
    return '<img src="'+q(src)+'" data-u="'+q(u)+'" alt="" decoding="async"'+(P.img?'':' style="width:100%;height:100%;background:#fff"')+'>';
  }
  function cell(u,w,h){ return '<div class="nfz-cell"><div class="nfz-fr"'+(w?' style="width:'+Math.floor(w)+'px;height:'+Math.floor(h)+'px"':'')+'>'+imgTag(u)+'</div></div>'; }

  function draw(host, urls, o){
    var W=host.clientWidth, H=host.clientHeight;
    if(!W||!H) return false;
    var g=Math.round(window.innerHeight*GAP_VH/100);
    var n=urls.length, html, moving=false;
    /* 2.1: יש מקום — כל קובץ לרוחב בגובה מלא (הכי גדול). אין מקום — שניים אחד מעל השני */
    var wOf=function(cs){ return cs.reduce(function(s,c){ return s+c.w; },0)+g*(cs.length-1); };
    var cols=columns(urls,W,H,g,true), wU=wOf(cols);
    if(wU>W+1){
      /* כמעט נכנס — מקטינים מעט את כולם ומשאירים כל קובץ בשורה אחת (גדול יותר משניים אחד מעל השני) */
      var k=(W-g*(cols.length-1))/(wU-g*(cols.length-1));
      if(k>=0.6) cols.forEach(function(c){ c.w*=k; c.h*=k; });
      else cols=columns(urls,W,H,g,false);
    }
    var totW=wOf(cols);
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
           'grid-template-rows:repeat('+G.r+','+Math.floor(G.ch)+'px);gap:'+g+'px">'+urls.map(function(u){ return cell(u,G.w,G.h); }).join("")+'</div>';
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
    try{ sharpen(host, host.__nfzSig); }catch(e){}
    if(DIAG) try{ diagScreen(); Array.prototype.forEach.call(host.querySelectorAll(".nfz-cell img[data-u]"),function(im){
      var f=function(){ diagCell(im.parentNode, parse(im.getAttribute("data-u")), null, 0, false, im); };
      if(im.complete) f(); else im.addEventListener("load",f,{once:true}); }); }catch(e){}
    return true;
  }

  function diagScreen(){
    var e=document.getElementById("nfz-scr"); if(!e){ e=document.createElement("div"); e.id="nfz-scr"; document.body.appendChild(e); }
    var dp=root.devicePixelRatio||1, sw=screen.width, sh=screen.height;
    var L=function(t){ return "\u2066"+t+"\u2069"; };
    e.innerHTML="בדיקת איכות · מסך "+L(sw+"×"+sh)+" · צפיפות "+dp+"<br>חלון "+L(innerWidth+"×"+innerHeight)+
      " · פיקסלים אמיתיים "+L(Math.round(innerWidth*dp)+"×"+Math.round(innerHeight*dp))+
      (Math.round(sw*dp)<1900 ? '<br><span style="color:#ff7b72">⚠ המחשב מוציא למסך פחות מ-Full HD — זו סיבת הטשטוש</span>' : "");
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
    host.__nfzSig=sig; host.__nfzUrls=urls; host.__nfzO=o; host.__nfzMixed=null;
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


  /* =====================================================================
     2.2: סרט נע אחד — קבצים ופרנסים בטקסט יחד, ברצף אחד שחוזר חלילה.
     NatiFiles.mixed(host, [urls], [{cat,name,ded,pr}], {speed, rows})
     קודם הקבצים (בגדול, במסגרת זהב), אחריהם הפרנסים בטקסט: פרנס בולט
     (עדיפות 1–2) בכרטיס בגובה מלא, השאר בעמודות של 3 כרטיסים.
     נכנס הכל — עומד במרכז. לא נכנס — נוסע בלי הפסקה ובלי קפיצה.
     ===================================================================== */
  (function(){ var l=document.createElement("link"); l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Bellefair&family=Suez+One&family=Frank+Ruhl+Libre:wght@500;700;900&display=swap";
    document.head.appendChild(l); })();
  var css2=document.createElement("style");
  css2.textContent=
    ".nfx-col{display:flex;flex-direction:column;justify-content:center;flex:0 0 auto}"+
    /* 2.3: כרטיסי טקסט — קו זהב דק, פינות מעוגלות, ושלוש דרגות בצבע ובגודל */
    ".nfx-card{position:relative;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;"+
    " text-align:center;direction:rtl;padding:1.4vh 1.2vw;border-radius:1.8vh;border:.18vh solid transparent;"+
    " background:radial-gradient(ellipse at 50% -10%,#1b4a33 0%,#0c2c1e 55%,#071b12 100%) padding-box,"+
    "  linear-gradient(135deg,#8a6a1f,#f7e08a 30%,#b8902f 55%,#fff3b8 78%,#9b7724) border-box;"+
    " box-shadow:0 1vh 2.4vh rgba(0,0,0,.55)}"+
    ".nfx-card::before{content:'';position:absolute;inset:.6vh;border-radius:1.3vh;border:1px solid rgba(247,224,138,.22);pointer-events:none}"+
    /* דרגה 1 — גדול: ברונזה-זהב חמה */
    ".nfx-card.t1{background:radial-gradient(ellipse at 50% -10%,#6e4f16 0%,#3c2a09 55%,#1d1404 100%) padding-box,"+
    "  linear-gradient(135deg,#8a6a1f,#fff3b8 30%,#c9a227 55%,#fff7d6 78%,#9b7724) border-box;"+
    " box-shadow:0 0 3vh rgba(240,200,90,.22),0 1vh 2.4vh rgba(0,0,0,.55)}"+
    /* דרגה 2 — בינוני: בורדו עמוק */
    ".nfx-card.t2{background:radial-gradient(ellipse at 50% -10%,#6a1426 0%,#3a0a15 55%,#1c050a 100%) padding-box,"+
    "  linear-gradient(135deg,#8a6a1f,#f7e08a 30%,#b8902f 55%,#fff3b8 78%,#9b7724) border-box}"+
    ".nfx-cat{font-family:Bellefair,'Frank Ruhl Libre',serif;color:#e9c96a;letter-spacing:.05em;line-height:1.1}"+
    ".nfx-nm{font-family:'Suez One','Frank Ruhl Libre',serif;font-weight:400;line-height:1.12;margin:.22em 0;letter-spacing:.01em;"+
    " background:linear-gradient(180deg,#fff8dc 0%,#f6dc86 34%,#d4a943 60%,#b8862a 74%,#f3dc92 100%);"+
    " -webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 .25vh .45vh rgba(0,0,0,.65))}"+
    ".nfx-dd{font-family:Bellefair,'Frank Ruhl Libre',serif;color:#f1e9d2;line-height:1.15;letter-spacing:.02em}"+
    ".nfx-orn{width:40%;height:1.1vh;margin:.2em auto;display:block}";
  document.head.appendChild(css2);
  var ORN='<svg class="nfx-orn" viewBox="0 0 200 12" aria-hidden="true"><path d="M5 6 H86 M114 6 H195" stroke="#d9b65a" stroke-width="1.4" opacity=".8"/>'+
          '<path d="M100 1 L106 6 L100 11 L94 6 Z" fill="#f3d77a"/></svg>';
  function esc(t){ return String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }
  function cardHtml(t, w, h){
    return '<div class="nfx-card t'+(t.tier||3)+'" style="width:'+Math.floor(w)+'px;height:'+Math.floor(h)+'px">'+
      (t.cat?'<div class="nfx-cat">'+esc(t.cat)+'</div>':'')+
      '<div class="nfx-nm">'+esc(t.name)+'</div>'+
      (t.ded?ORN+'<div class="nfx-dd">'+esc(t.ded)+'</div>':'')+'</div>';
  }
  /* מקטינים את הטקסט עד שהוא נכנס בכרטיס — אף פעם לא נחתך */
  function fitCards(host){
    var cards=host.querySelectorAll(".nfx-card"), n=cards.length/2|0;
    for(var i=0;i<(n||cards.length);i++){
      var c=cards[i], h=c.clientHeight, w=c.clientWidth, big=0;
      var nm=c.querySelector(".nfx-nm"), ct=c.querySelector(".nfx-cat"), dd=c.querySelector(".nfx-dd");
      var t1=c.classList.contains("t1"), t2=c.classList.contains("t2");
      var fs=t1?Math.min(h*0.17, w*0.15):(t2?Math.min(h*0.22, w*0.13):Math.min(h*0.24, w*0.11));
      for(var k=0;k<24;k++){
        nm.style.fontSize=fs+"px"; if(ct) ct.style.fontSize=(fs*0.48)+"px"; if(dd) dd.style.fontSize=(fs*0.5)+"px";
        if(c.scrollHeight<=h+1 && nm.scrollWidth<=nm.clientWidth+1 && c.scrollWidth<=w+1) break;
        fs*=0.92;
      }
      if(n && cards[i+n]){ var c2=cards[i+n];
        var q=function(sel){ return c2.querySelector(sel); };
        q(".nfx-nm").style.fontSize=nm.style.fontSize; if(ct&&q(".nfx-cat")) q(".nfx-cat").style.fontSize=ct.style.fontSize;
        if(dd&&q(".nfx-dd")) q(".nfx-dd").style.fontSize=dd.style.fontSize; }
    }
  }
  function drawMixed(host, urls, texts, o){
    var W=host.clientWidth, H=host.clientHeight;
    if(!W||!H) return false;
    var g=Math.round(window.innerHeight*GAP_VH/100), rows=Math.max(1,o.rows||3);
    var items=[];
    /* קבצים — אותה פריסה כמו בתצוגת הקבצים (לרוחב: שניים אחד מעל השני) */
    var fc=columns(urls,W,H,g,false);
    if(!texts.length){
      /* קבצים בלבד — כמו בתצוגת הקבצים: אם כמעט נכנס, כל קובץ בגובה (כמעט) מלא */
      var wOf=function(cs){ return cs.reduce(function(a,c){ return a+c.w; },0)+g*(cs.length-1); };
      var un=columns(urls,W,H,g,true), wU=wOf(un);
      if(wU<=W+1) fc=un;
      else { var k=(W-g*(un.length-1))/(wU-g*(un.length-1)); if(k>=0.6){ un.forEach(function(c){ c.w*=k; c.h*=k; }); fc=un; } }
    }
    fc.forEach(function(c){ items.push({w:c.w, html:colHtml(c,g)}); });
    /* טקסטים — שלוש דרגות: גדול (גובה מלא), בינוני (שניים בעמודה), רגיל (שלושה בעמודה) */
    var bigW=Math.min(W*0.42, H*1.05), midW=Math.min(W*0.36, H*0.98), smW=Math.min(W*0.3, H*0.9);
    var smH=(H-g*(rows-1))/rows, midH=(H-g)/2, buf=[], mbuf=[];
    function flush(){
      if(!buf.length) return;
      items.push({w:smW, html:'<div class="nfx-col" style="width:'+Math.floor(smW)+'px;height:'+H+'px;gap:'+g+'px">'+
        buf.map(function(t){ return cardHtml(t,smW,smH); }).join("")+'</div>'});
      buf=[];
    }
    function flushM(){
      if(!mbuf.length) return;
      items.push({w:midW, html:'<div class="nfx-col" style="width:'+Math.floor(midW)+'px;height:'+H+'px;gap:'+g+'px">'+
        mbuf.map(function(t){ return cardHtml(t,midW,midH); }).join("")+'</div>'});
      mbuf=[];
    }
    texts.forEach(function(t){
      if(t.tier===1){ flush(); flushM(); items.push({w:bigW, html:'<div class="nfx-col" style="width:'+Math.floor(bigW)+'px;height:'+H+'px">'+cardHtml(t,bigW,H)+'</div>'}); }
      else if(t.tier===2){ flush(); mbuf.push(t); if(mbuf.length>=2) flushM(); }
      else { flushM(); buf.push(t); if(buf.length>=rows) flush(); }
    });
    flushM();
    flush();
    if(!items.length){ host.innerHTML=""; host.__nfzCycle=0; return true; }
    var tot=items.reduce(function(a,x){ return a+x.w; },0)+g*(items.length-1), html;
    if(tot<=W+1){
      host.__nfzCycle=0;
      html='<div class="nfz-row" style="gap:'+g+'px">'+items.map(function(x){ return x.html; }).join("")+'</div>';
    }else{
      var rev=items.slice().reverse().map(function(x){ return x.html; }).join("");
      var C=tot+g, dur=Math.max(12, C/(o.speed||55));
      host.__nfzCycle=dur;
      html='<div class="nfz-track" style="gap:'+g+'px;padding-right:'+g+'px;--nfz-a:'+(W-2*C).toFixed(1)+'px;--nfz-b:'+(W-C).toFixed(1)+'px;--nfz-d:'+dur.toFixed(2)+'s">'+rev+rev+'</div>';
    }
    host.innerHTML='<div class="nfz nfz-in">'+html+'</div>';
    try{ fitCards(host); }catch(e){}
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ try{ fitCards(host); }catch(e){} });
    try{ sharpen(host, host.__nfzSig); }catch(e){}
    return true;
  }
  function mixed(host, urls, texts, o){
    if(!host) return;
    o=o||{}; urls=(urls||[]).filter(Boolean);
    texts=(texts||[]).filter(function(t){ return t && (t.name||"").trim(); }).map(function(t){
      var pr=+t.pr||3; return {cat:t.cat||"", name:t.name||"", ded:t.ded||"", tier:(pr<=1?1:(pr===2?2:3))}; });
    host.__nfzMixed={u:urls,t:texts,o:o};
    if(!host.__nfxRO && root.ResizeObserver){
      host.__nfxRO=new ResizeObserver(function(){
        clearTimeout(host.__nfxT);
        host.__nfxT=setTimeout(function(){
          if(host.clientWidth<40 || !host.__nfzMixed || String(host.__nfzSig).indexOf("M|")!==0) return;
          var k=host.clientWidth+"x"+host.clientHeight;
          if(k!==host.__nfzSize){ host.__nfzSize=k; var m=host.__nfzMixed; drawMixed(host,m.u,m.t,m.o); }
        },250);
      });
      host.__nfxRO.observe(host);
    }
    var sig="M|"+urls.join("|")+"#"+JSON.stringify(texts)+"#"+(o.speed||"");
    if(sig===host.__nfzSig) return;
    host.__nfzSig=sig; host.__nfzUrls=null;
    loadAspects(urls).then(function(){
      if(host.__nfzSig!==sig) return;
      var go=function(){ if(host.__nfzSig!==sig) return;
        if(drawMixed(host,urls,texts,o)) host.__nfzSize=host.clientWidth+"x"+host.clientHeight; else setTimeout(go,400); };
      go();
    });
  }

  root.NatiFiles={render:render, mixed:mixed, alternate:alternate, single:single, stop:stop, cycleSec:cycleSec, parse:parse, VERSION:"2.2"};
})(window);
