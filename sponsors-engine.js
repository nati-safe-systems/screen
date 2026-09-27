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
              ratio:2.1, gap:1.1, fadeMs:900, marqueeSpeed:22,
              /* רצועת המובילים: מי נכנס אליה, כמה, ואיזה חלק מהגובה */
              heroMaxTier:1, heroMax:3, heroVh1:34, heroVhN:28,
              /* y = גלילה כלפי מעלה, x = נסיעה כמו רצועת חדשות */
              marqueeDir:"y" };

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

  function cardHtml(s, isHero){
    var tier=Math.min(5,Math.max(1,+s.priority||3));
    return '<div class="sc t'+tier+(isHero?' nsp-h':'')+'">'+
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
      /* בנסיעה אופקית הרצועה רחבה מהמסך, ולכן right משוחרר */
      '.nsp-track.x{right:auto;top:0;bottom:0}',
      '.nsp-hero{z-index:2}',
      '.sc.nsp-h .nm{font-size:1.45em}',
      '.sc.nsp-h .cat{font-size:1.15em}',
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

    /* ---- חלוקה לפי חשיבות ----
       פרנס בעדיפות גבוהה מקבל שטח גדול יותר, לא רק צבע אחר.
       הוא יושב ברצועה קבועה בראש המסך ואינו משתתף בהחלפת העמודים,
       כך שהוא נראה כל הזמן. השאר מתחלקים לרשת מתחתיו. */
    function split(arr){
      var hero=[], rest=[];
      arr.forEach(function(s){
        var p=Math.min(5,Math.max(1,+s.priority||3));
        if(p<=O.heroMaxTier && hero.length<O.heroMax) hero.push(s); else rest.push(s);
      });
      return {hero:hero, rest:rest};
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
      if(W<40||H<40){ setTimeout(render,180); return; }

      var gapPx=px(O.gap);
      var sp=split(arr);

      /* הרצועה העליונה תופסת חלק מהגובה, והשאר לרשת */
      var heroH=0, restH=H;
      if(sp.hero.length){
        heroH = H * (sp.hero.length===1 ? O.heroVh1 : O.heroVhN) / 100;
        heroH = Math.min(heroH, H*0.5);
        restH = H - heroH - gapPx;
      }

      if(sp.hero.length){
        var hg=bestGrid(sp.hero.length, W, heroH, gapPx,
                        heroH*0.6, O.ratio*1.4, Math.min(sp.hero.length,3));
        var hb=document.createElement("div");
        hb.className="nsp-hero";
        hb.setAttribute("style",
          "position:absolute;left:0;right:0;top:0;height:"+heroH+"px;"+
          "display:grid;grid-template-columns:repeat("+hg.cols+",minmax(0,1fr));"+
          "grid-auto-rows:minmax(0,1fr);gap:"+gapPx+"px;");
        hb.innerHTML=sp.hero.map(function(x){ return cardHtml(x,true); }).join("");
        host.appendChild(hb);
      }

      if(!sp.rest.length) return;

      /* אזור הרשת */
      var area=document.createElement("div");
      area.className="nsp-area";
      area.setAttribute("style",
        "position:absolute;left:0;right:0;bottom:0;height:"+restH+"px;overflow:hidden;");
      host.appendChild(area);

      var minH=px(O.minCardVh), minW=W*O.minCardVw/100;
      var cap=capacity(W,restH,gapPx,minH,minW,O.maxCols,O.maxPerPage);
      var m=sp.rest.length;

      var mode=O.mode;
      /* ברירת המחדל כשלא הכל נכנס היא גלילה ולא עמודים.
         עמוד מתחלף דורש מהצופה לדעת שיש המשך ולהמתין לו, ורוב
         האנשים לא ימתינו. תנועה רציפה תופסת את העין מעצמה —
         עומדים ומסתכלים עד שהשם שלהם עובר. */
      if(mode==="auto") mode = (m<=cap) ? "fit" : "marquee";

      /* רשת אחת לכל העמודים.
         קודם כל עמוד חישב רשת משלו, ולכן עמוד אחרון עם שלושה
         פרנסים ניפח אותם לכל המסך בעוד בעמוד הראשון היו קטנים.
         עכשיו הגודל אחיד, והעמוד האחרון פשוט מלא פחות. */
      var gridN = (mode==="fit") ? m : Math.min(cap,m);
      var g=bestGrid(gridN, W, restH, gapPx, minH, O.ratio, O.maxCols);
      var gs="grid-template-columns:repeat("+g.cols+",minmax(0,1fr));"+
             "grid-auto-rows:minmax(0,1fr);gap:"+gapPx+"px;";

      if(mode==="fit" || m<=cap){
        var p0=document.createElement("div");
        p0.className="nsp-page solo on";
        p0.setAttribute("style", gs);
        p0.innerHTML=sp.rest.map(function(x){ return cardHtml(x,false); }).join("");
        area.appendChild(p0);
        return;
      }

      if(mode==="marquee"){
        var horiz = (O.marqueeDir==="x");
        var track=document.createElement("div");
        track.className="nsp-track"+(horiz?" x":"");
        var one=sp.rest.map(function(x){ return cardHtml(x,false); }).join("");

        if(horiz){
          /* נסיעה מימין לשמאל: שורה אחת, כל קובייה ברוחב קבוע */
          var rowsX=Math.max(1,Math.min(g.rows,2));
          var cwX=(W-gapPx*(O.maxCols-1))/O.maxCols;
          track.setAttribute("style",
            "grid-auto-flow:column;grid-auto-columns:"+cwX+"px;"+
            "grid-template-rows:repeat("+rowsX+",minmax(0,1fr));"+
            "gap:"+gapPx+"px;height:"+restH+"px;width:max-content;");
        }else{
          track.setAttribute("style", gs);
        }
        track.innerHTML=one+one;
        area.appendChild(track);

        /* הרשימה מוכפלת, ולכן החזרה להתחלה אינה נראית כקפיצה */
        var cycle = horiz ? track.scrollWidth/2 : track.scrollHeight/2;
        var pos=0, last=0;
        var pps=Math.max(10, cycle/Math.max(10, m*O.marqueeSpeed/10));
        function step(ts){
          if(!last) last=ts;
          pos+=pps*((ts-last)/1000); last=ts;
          if(pos>=cycle) pos-=cycle;
          track.style.transform = horiz
            ? "translateX("+pos+"px)"      /* עברית — נע ימינה */
            : "translateY("+(-pos)+"px)";
          raf=requestAnimationFrame(step);
        }
        raf=requestAnimationFrame(step);
        return;
      }

      pages=[];
      for(var i2=0;i2<m;i2+=cap) pages.push(sp.rest.slice(i2,i2+cap));
      pages.forEach(function(list,i3){
        var el=document.createElement("div");
        el.className="nsp-page"+(i3===0?" on":"");
        el.setAttribute("style", gs+"align-content:start;");
        el.innerHTML=list.map(function(x){ return cardHtml(x,false); }).join("");
        area.appendChild(el);
      });

      if(pages.length>1){
        var dots=document.createElement("div");
        dots.className="nsp-dots";
        dots.innerHTML=pages.map(function(_,i4){return '<i'+(i4?'':' class="on"')+'></i>';}).join("");
        host.appendChild(dots);
        idx=0;
        timer=setInterval(function(){
          var els=area.querySelectorAll(".nsp-page");
          var ds=host.querySelectorAll(".nsp-dots i");
          els[idx].classList.remove("on"); if(ds[idx]) ds[idx].classList.remove("on");
          idx=(idx+1)%els.length;
          els[idx].classList.add("on"); if(ds[idx]) ds[idx].classList.add("on");
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
