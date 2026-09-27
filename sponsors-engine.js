/* =====================================================================
   נתי SAFE — מנוע תצוגת פרנסים  ·  NatiSponsors v1.0
   ---------------------------------------------------------------------
   הבעיה שהוא פותר:
   עד כה כל הפרנסים רונדרו יחד על מסך אחד. עם ארבעה זה נראה טוב,
   עם חמישה עשר הקוביות נמעכו, ועם שלושים אי אפשר היה לקרוא דבר.
   בחג, כשיש הכי הרבה תורמים, המסך היה הכי פחות קריא.

   הגישה:
   1. מודדים את השטח הפנוי בפועל, בפיקסלים.
   2. מחשבים איזו רשת נותנת את הקוביות הגדולות ביותר שעדיין נכנסות,
      תוך שמירה על יחס גובה-רוחב נעים ועל גודל מינימלי קריא.
   3. אם הכל נכנס — עמוד אחד סטטי, והקוביות ממלאות את המסך.
   4. אם לא — או החלפת עמודים, או גלילה רצופה.

   הגודל המינימלי הוא העיקרון המרכזי: עדיף להציג שמונה פרנסים
   גדולים ולהחליף עמוד, מאשר שלושים זעירים שאיש אינו קורא.

   ---------------------------------------------------------------------
   שימוש:

     var ctl = NatiSponsors.mount(document.getElementById("sgrid"), {
       mode: "auto",        // auto | pages | marquee | fit
       pageSec: 12,         // שניות לעמוד
       minCardVh: 11,       // גובה קובייה מינימלי, באחוזי גובה מסך
       ratio: 1.9           // יחס רוחב-לגובה מועדף לקובייה
     });
     ctl.setItems(arr);     // נתונים חדשים; מרנדר רק אם באמת השתנו
     ctl.destroy();

   מצבים:
     fit       הכל על עמוד אחד, קטן ככל שנדרש. בלי תנועה.
     pages     עמודים מתחלפים בהצללה.
     marquee   גלילה אנכית רצופה ואיטית.
     auto      נכנס בעמוד אחד -> fit. אחרת -> pages.
               מעל 24 פריטים -> marquee, כי החלפת עמודים
               הופכת לתכופה מדי ומטרידה.
   ===================================================================== */
(function (root) {
  'use strict';

  /* minCardVh ו-minCardVw הם לב העניין: קובייה עם קטגוריה, שם
     והקדשה אינה קריאה מהצד השני של בית הכנסת מתחת לגדלים האלה.
     maxCols מוגבל כי שם בעברית זקוק לרוחב — שמונה עמודות היו
     מייצרות עמודות צרות שבהן כל שם נשבר לשלוש שורות. */
  var DEF = { mode:"auto", pageSec:12,
              minCardVh:19, minCardVw:20, maxCols:4, maxPerPage:12,
              ratio:2.1, gap:1.1, fadeMs:900, marqueeSpeed:22 };

  /* ---- בחירת הרשת ----
     עוברים על כל מספר עמודות אפשרי ומחשבים כמה שורות נדרשות.
     מנקדים לפי שטח הקובייה ולפי קרבה ליחס המועדף, ובוחרים
     את הציון הגבוה ביותר שעדיין עומד בגודל המינימלי. */
  function bestGrid(n, W, H, gapPx, minH, ratio, maxCols){
    if(n<=0) return {cols:1, rows:1, cw:W, ch:H, score:0};
    var best=null;
    for(var c=1;c<=Math.min(n, maxCols||4);c++){
      var r=Math.ceil(n/c);
      var cw=(W-gapPx*(c-1))/c;
      var ch=(H-gapPx*(r-1))/r;
      if(cw<=0||ch<=0) continue;
      var arOff=Math.abs((cw/ch)-ratio)/ratio;      /* 0 = יחס מושלם */
      var score=(cw*ch)*(1-Math.min(.6,arOff*.5));
      var cand={cols:c, rows:r, cw:cw, ch:ch, score:score, fits:ch>=minH};
      if(!best || (cand.fits&&!best.fits) ||
         (cand.fits===best.fits && cand.score>best.score)) best=cand;
    }
    return best||{cols:1, rows:n, cw:W, ch:H/n, score:0, fits:false};
  }

  /* כמה פריטים נכנסים בגודל שעדיין נקרא מרחוק.
     זה המספר שקובע אם צריך עמודים, וכמה יהיו. */
  function capacity(W, H, gapPx, minH, minW, maxCols, maxPer){
    var rows=Math.max(1, Math.floor((H+gapPx)/(minH+gapPx)));
    var cols=Math.max(1, Math.floor((W+gapPx)/(minW+gapPx)));
    cols=Math.min(cols, maxCols||4);
    return Math.max(1, Math.min(rows*cols, maxPer||12));
  }

  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function cardHtml(s){
    var tier=Math.min(5,Math.max(1,+s.priority||3));
    return '<div class="sc t'+tier+'">'+
             (s.category   ? '<div class="cat">'+esc(s.category)+'</div>' : '')+
             '<div class="nm">'+esc(s.name)+'</div>'+
             (s.dedication ? '<div class="dd">'+esc(s.dedication)+'</div>' : '')+
           '</div>';
  }

  function injectCss(){
    if(document.getElementById("nsf-spon-css")) return;
    var st=document.createElement("style");
    st.id="nsf-spon-css";
    st.textContent=[
      /* display:block מבטל grid או flex שהוגדרו על המיכל בקובץ המארח,
         אחרת השכבות היו הופכות לפריטי רשת ונדחסות. inset:0 נמדד
         מתיבת הריפוד, ולכן הריפוד של המיכל נשמר. */
      '.nsp-stage{position:relative;overflow:hidden;display:block!important}',
      '.nsp-page{position:absolute;inset:0;display:grid;align-content:stretch;',
        'opacity:0;transition:opacity var(--nsp-fade,900ms) ease}',
      '.nsp-page.on{opacity:1}',
      '.nsp-page.solo{opacity:1;transition:none}',
      /* גלילה רצופה — נעה בטרנספורם בלבד, בלי חישוב פריסה בכל פריים */
      '.nsp-track{position:absolute;left:0;right:0;top:0;display:grid;',
        'will-change:transform}',
      '.nsp-dots{position:absolute;bottom:.6vh;left:50%;transform:translateX(-50%);',
        'display:flex;gap:.7vh;z-index:5;pointer-events:none}',
      '.nsp-dots i{width:.85vh;height:.85vh;border-radius:50%;display:block;',
        'background:currentColor;opacity:.28;transition:opacity .4s}',
      '.nsp-dots i.on{opacity:.95}',
      '@media (prefers-reduced-motion:reduce){',
        '.nsp-page{transition:none}.nsp-track{animation:none!important}}'
    ].join("");
    document.head.appendChild(st);
  }

  function mount(host, opts){
    if(!host) return null;
    injectCss();
    var O={}; for(var k in DEF) O[k]=DEF[k];
    for(var k2 in (opts||{})) if(opts[k2]!=null) O[k2]=opts[k2];

    var items=[], sig="", pages=[], idx=0, timer=null, raf=null, stage=null;

    host.classList.add("nsp-stage");
    host.style.setProperty("--nsp-fade", O.fadeMs+"ms");

    function clearTimers(){
      if(timer){ clearInterval(timer); timer=null; }
      if(raf){ cancelAnimationFrame(raf); raf=null; }
    }

    function px(vh){ return host.clientHeight * vh / 100; }

    /* סידור לפי עדיפות, כדי שהבולטים יופיעו בעמוד הראשון */
    function ordered(){
      return items.slice().sort(function(a,b){
        var pa=+a.priority||3, pb=+b.priority||3;
        if(pa!==pb) return pa-pb;
        return String(a.name||"").localeCompare(String(b.name||""),"he");
      });
    }

    function gridStyle(g, gapPx){
      return "grid-template-columns:repeat("+g.cols+",minmax(0,1fr));"+
             "grid-auto-rows:minmax(0,1fr);gap:"+gapPx+"px;";
    }

    function render(){
      clearTimers();
      host.innerHTML="";
      var arr=ordered(), n=arr.length;
      if(!n){
        host.innerHTML='<div class="none" style="margin:auto">אין פרנסים להיום</div>';
        return;
      }

      var W=host.clientWidth, H=host.clientHeight;
      if(W<40||H<40){ setTimeout(render,180); return; }   /* טרם נמדד */

      var gapPx=px(O.gap), minH=px(O.minCardVh);
      var minW=host.clientWidth*O.minCardVw/100;
      var cap=capacity(W,H,gapPx,minH,minW,O.maxCols,O.maxPerPage);

      var mode=O.mode;
      if(mode==="auto") mode = (n<=cap) ? "fit" : (n>24 ? "marquee" : "pages");

      /* ---- הכל נכנס: עמוד אחד, הקוביות ממלאות את המסך ---- */
      if(mode==="fit" || n<=cap){
        var g=bestGrid(n,W,H,gapPx,minH,O.ratio,O.maxCols);
        var p=document.createElement("div");
        p.className="nsp-page solo on";
        p.setAttribute("style", gridStyle(g,gapPx));
        p.innerHTML=arr.map(cardHtml).join("");
        host.appendChild(p);
        return;
      }

      /* ---- גלילה רצופה ---- */
      if(mode==="marquee"){
        var gm=bestGrid(Math.min(n,cap),W,H,gapPx,minH,O.ratio,O.maxCols);
        var track=document.createElement("div");
        track.className="nsp-track";
        track.setAttribute("style", gridStyle(gm,gapPx));
        /* הרשימה מוכפלת כדי שהמעבר בסוף יהיה רציף ובלי קפיצה */
        track.innerHTML=arr.map(cardHtml).join("")+arr.map(cardHtml).join("");
        host.appendChild(track);

        var cycle = track.scrollHeight/2;
        var pos=0, last=0;
        var pxPerSec = Math.max(8, cycle / Math.max(8, n*O.marqueeSpeed/10));
        function step(ts){
          if(!last) last=ts;
          var dt=(ts-last)/1000; last=ts;
          pos+=pxPerSec*dt;
          if(pos>=cycle) pos-=cycle;
          track.style.transform="translateY("+(-pos)+"px)";
          raf=requestAnimationFrame(step);
        }
        raf=requestAnimationFrame(step);
        return;
      }

      /* ---- עמודים מתחלפים ---- */
      pages=[];
      for(var i=0;i<n;i+=cap) pages.push(arr.slice(i,i+cap));

      pages.forEach(function(list,i){
        var g2=bestGrid(list.length,W,H,gapPx,minH,O.ratio,O.maxCols);
        var el=document.createElement("div");
        el.className="nsp-page"+(i===0?" on":"");
        el.setAttribute("style", gridStyle(g2,gapPx));
        el.innerHTML=list.map(cardHtml).join("");
        host.appendChild(el);
      });

      if(pages.length>1){
        var dots=document.createElement("div");
        dots.className="nsp-dots";
        dots.innerHTML=pages.map(function(_,i){return '<i'+(i?'':' class="on"')+'></i>';}).join("");
        host.appendChild(dots);

        idx=0;
        timer=setInterval(function(){
          var els=host.querySelectorAll(".nsp-page");
          var ds=host.querySelectorAll(".nsp-dots i");
          els[idx].classList.remove("on");
          if(ds[idx]) ds[idx].classList.remove("on");
          idx=(idx+1)%els.length;
          els[idx].classList.add("on");
          if(ds[idx]) ds[idx].classList.add("on");
        }, Math.max(4,O.pageSec)*1000);
      }
    }

    /* חתימה על הנתונים: מרנדרים רק כשהתוכן באמת השתנה.
       רינדור מיותר גורם להבהוב ולקפיצה, ובמסך שרץ ברצף זה נראה רע. */
    function signature(arr){
      return arr.map(function(s){
        return [s.id,s.name,s.category,s.dedication,s.priority].join("\u0001");
      }).join("\u0002");
    }

    var ro=null;
    try{
      ro=new ResizeObserver(function(){
        clearTimeout(host.__nspRz);
        host.__nspRz=setTimeout(render,220);
      });
      ro.observe(host);
    }catch(e){
      window.addEventListener("resize",function(){
        clearTimeout(host.__nspRz);
        host.__nspRz=setTimeout(render,220);
      });
    }

    return {
      setItems:function(arr){
        arr=Array.isArray(arr)?arr:[];
        var s=signature(arr);
        if(s===sig) return false;      /* אין שינוי — לא נוגעים ב-DOM */
        sig=s; items=arr; render();
        return true;
      },
      setOptions:function(o){
        var ch=false;
        for(var k in (o||{})) if(o[k]!=null && O[k]!==o[k]){ O[k]=o[k]; ch=true; }
        if(ch){ host.style.setProperty("--nsp-fade",O.fadeMs+"ms"); render(); }
        return ch;
      },
      refresh:render,
      count:function(){ return items.length; },
      destroy:function(){
        clearTimers();
        try{ if(ro) ro.disconnect(); }catch(e){}
        host.innerHTML="";
        host.classList.remove("nsp-stage");
      }
    };
  }

  root.NatiSponsors = { mount:mount, VERSION:"1.0" };
})(typeof window !== "undefined" ? window : globalThis);
