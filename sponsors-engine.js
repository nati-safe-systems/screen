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
  /* staticMax — עד כמה פרנסים המסך עומד. מעבר לזה הוא נוסע.
     span   — כמה מקום תופסת קובייה לפי רמת החשיבות. זה מה שנותן
              לפרנס חשוב להיראות גדול, גם כשהמסך נוסע.
     dir    — y: עולה מלמטה למעלה. x: נוסע כמו רצועת חדשות. */
  var DEF = { staticMax:6, dir:"x", speed:70, gap:1.1, restSec:1.6,
              smallRows:3,   /* כמה פרנסים רגילים נערמים בעמודה */
              minCardVw:17, ratio:1.9, maxCols:4,
              /* speed = פיקסלים בשנייה. קבוע ואינו תלוי בכמות
                 הפרנסים, כך שהמהירות נשארת אותה מהירות תמיד. */
              span:{1:2.6, 2:1.35, 3:1.05, 4:1, 5:1},
              /* חלק הגובה שכל דרגה תופסת. דרגה 1 במלוא הגובה,
                 דרגה 2 נמוכה יותר וממורכזת — כך ההבדל בין הדרגות
                 נראה מיד, גם בלי להשוות רוחב. */
              hFrac:{1:1, 2:0.68, 3:1, 4:1, 5:1} };


  /* ---- בחירת הרשת ----
     עוברים על כל מספר עמודות אפשרי ומחשבים כמה שורות נדרשות.
     מנקדים לפי שטח הקובייה ולפי קרבה ליחס המועדף, ובוחרים
     את הציון הגבוה ביותר שעדיין עומד בגודל המינימלי. */

  /* כמה פריטים נכנסים בגודל שעדיין נקרא מרחוק.
     זה המספר שקובע אם צריך עמודים, וכמה יהיו. */

  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* גודל בסיס לפי ממדי הקובייה. הטקסט בפנים נמדד ממנו ב-em,
     ולכן קובייה גדולה מקבלת טקסט גדול בלי לגעת בכל כלל בנפרד. */
  function baseFs(w,h){
    if(!w||!h) return null;
    return Math.max(12, Math.min(h*0.30, w*0.115));
  }
  function cardHtml(s, big, style, fs){
    var tier=Math.min(5,Math.max(1,+s.priority||3));
    var st=(style||"")+(fs?("--fs:"+Math.round(fs)+"px;"):"");
    return '<div class="sc t'+tier+(big?' nsp-h':'')+'"'+
           (st?' style="'+st+'"':'')+'>'+
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
      '.nsp-track{position:absolute;left:0;top:0;will-change:transform}',
      '.nsp-track.x{right:auto;bottom:0}',
      '.nsp-track.y{right:0}',
      '.nsp-col{min-width:0;min-height:0}',
      '.nsp-hero{z-index:2}',
      /* גובר על גדלי ה-vh הקבועים שבקובץ המארח */
      '.sc{--fs:3.2vh}',
      '.sc .nm{font-size:var(--fs);line-height:1.12}',
      '.sc .cat{font-size:calc(var(--fs) * .40)}',
      '.sc .dd{font-size:calc(var(--fs) * .40);line-height:1.3}',
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

    function tierOf(x){ return Math.min(5,Math.max(1,+x.priority||3)); }
    function wOf(x){ return O.span[tierOf(x)] || 1; }

    /* מדידה אחרי הרינדור: החישוב הגיאומטרי הוא הערכה, ושם ארוך
       עדיין יכול לחרוג. כאן מכווצים רק את מי שבאמת חורג, פעם אחת
       בכל רינדור ולא בכל פריים. */
    function fitText(root){
      var cards=root.querySelectorAll(".sc");
      for(var i=0;i<cards.length;i++){
        var c=cards[i];
        var fs=parseFloat(getComputedStyle(c).getPropertyValue("--fs"))||0;
        if(!fs) continue;
        var guard=0;
        while(c.scrollHeight>c.clientHeight+1 && fs>10 && guard++<14){
          fs*=0.92;
          c.style.setProperty("--fs", Math.round(fs)+"px");
        }
      }
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

      /* ---------- מעט פרנסים: המסך עומד ----------
         רשת שבה קובייה חשובה תופסת יותר תאים. הכל נראה בבת אחת
         ואין צורך להמתין לדבר. */
      if(n<=O.staticMax){
        var cols = n<=2 ? n : (n<=4 ? 2 : 3);
        var cells=0;
        arr.forEach(function(x){
          var t=tierOf(x);
          cells += (t===1 ? 4 : (t===2 ? 2 : 1));
        });
        var rows=Math.max(1, Math.ceil(cells/cols));
        var p=document.createElement("div");
        p.className="nsp-page solo on";
        p.setAttribute("style",
          "position:absolute;inset:0;display:grid;grid-auto-flow:dense;"+
          "grid-template-columns:repeat("+cols+",minmax(0,1fr));"+
          "grid-template-rows:repeat("+rows+",minmax(0,1fr));gap:"+gapPx+"px;");
        p.innerHTML=arr.map(function(x){
          var t=tierOf(x), st="";
          if(t===1 && cols>=2) st="grid-column:span 2;grid-row:span 2;";
          else if(t===2 && cols>=2) st="grid-column:span 2;";
          var cw2=W/cols, ch2=H/rows;
          if(t===1&&cols>=2){ cw2*=2; ch2*=2; } else if(t===2&&cols>=2){ cw2*=2; }
          return cardHtml(x, t<=2, st, baseFs(cw2,ch2));
        }).join("");
        host.appendChild(p);
        fitText(p);
        return;
      }

      /* ---------- הרבה פרנסים: המסך נוסע ----------
         זרם אחד רציף. גודל הקובייה נגזר מרמת החשיבות, כך שפרנס
         חשוב בולט בתוך התנועה ולא צריך רצועה נפרדת.
         הרשימה מוכפלת כדי שהחזרה להתחלה לא תיראה כקפיצה. */
      var horiz = (O.dir!=="y");
      var track=document.createElement("div");
      track.className="nsp-track"+(horiz?" x":" y");

      var unit;
      if(horiz){
        /* יחידת הרוחב הבסיסית; קובייה חשובה מקבלת כפולה שלה */
        unit=Math.max(W*O.minCardVw/100, 150);
        track.setAttribute("style",
          "display:flex;flex-direction:row;align-items:stretch;"+
          "gap:"+gapPx+"px;height:100%;width:max-content;");
      }else{
        unit=Math.max(H*0.20, 110);
        track.setAttribute("style",
          "display:flex;flex-direction:column;align-items:stretch;"+
          "gap:"+gapPx+"px;width:100%;");
      }

      /* הרכב הזרם.
         דרגה 1 ו-2 מקבלות קובייה בודדת בגובה מלא — הן צריכות
         להיראות מרחוק. הדרגות הרגילות נערמות בעמודות של כמה
         קוביות, כך שהזרם נראה כטבלה נוסעת ולא כרכבת של יחידות. */
      function cell(x, st, w, h){ return cardHtml(x, tierOf(x)<=2, st, baseFs(w,h)); }

      function buildStream(list){
        var out=[], buf=[];
        function flush(){
          if(!buf.length) return;
          /* מספר השורות קבוע ואינו נגזר מכמה יש בעמודה.
             קודם עמודה אחרונה עם פרנס בודד קיבלה שורה אחת בגובה
             מלא, והוא נראה פתאום ענק. עכשיו הוא יושב בשורה העליונה
             בדיוק באותו גודל, והשאר נשאר ריק. */
          var rows=Math.max(1,+O.smallRows||3);
          var w = horiz ? (unit*1.0) : null;
          var st = horiz
            ? "flex:0 0 "+w+"px;height:100%;display:grid;"+
              "grid-template-rows:repeat("+rows+",minmax(0,1fr));gap:"+gapPx+"px;"
            : "flex:0 0 auto;width:100%;display:grid;"+
              "grid-template-columns:repeat("+rows+",minmax(0,1fr));gap:"+gapPx+"px;"+
              "height:"+(unit)+"px;";
          var cw = horiz ? unit : (W/rows);
          var chh= horiz ? ((H-gapPx*(rows-1))/rows) : unit;
          out.push('<div class="nsp-col" style="'+st+'">'+
                   buf.map(function(y){ return cell(y,"",cw,chh); }).join("")+'</div>');
          buf=[];
        }
        list.forEach(function(x){
          var t=tierOf(x);
          if(t<=2){
            flush();
            var w2=unit*(O.span[t]||1);
            var hf=O.hFrac[t]; if(hf==null) hf=1;
            /* פחות מגובה מלא -> ממורכז בציר השני */
            var st2, bw, bh;
            if(horiz){
              bw=w2; bh=H*hf;
              st2="flex:0 0 "+w2+"px;height:"+(hf>=1?"100%":(hf*100).toFixed(1)+"%")+";"+
                  (hf<1?"align-self:center;":"");
            }else{
              bw=W*hf; bh=w2;
              st2="flex:0 0 "+w2+"px;width:"+(hf>=1?"100%":(hf*100).toFixed(1)+"%")+";"+
                  (hf<1?"align-self:center;":"");
            }
            out.push(cell(x, st2, bw, bh));
          }else{
            buf.push(x);
            if(buf.length >= Math.max(1,+O.smallRows||3)) flush();
          }
        });
        flush();
        return out.join("");
      }
      track.innerHTML=buildStream(arr);
      host.appendChild(track);
      fitText(track);

      var CS   = horiz ? W : H;                                  /* גודל המסך */
      var TS   = horiz ? track.scrollWidth : track.scrollHeight;  /* אורך הרשימה */
      var span = CS + TS;                                         /* מסלול מלא */
      var pps  = Math.max(8, +O.speed || 70);                     /* פיקסלים בשנייה */
      var pos=0, last=0, restUntil=0;

      function place(){
        /* אופקי: off עולה מ-(-TS) ל-CS, כלומר הרשימה נכנסת מצד
           שמאל ויוצאת מימין. אנכי נשאר כניסה מלמטה ויציאה למעלה. */
        var off = -TS + pos;
        track.style.transform = horiz
          ? "translateX("+off+"px)"        /* נכנס משמאל, יוצא ימינה */
          : "translateY("+(CS-pos)+"px)";  /* אנכי: נכנס מלמטה, יוצא למעלה */
      }
      place();

      function step(ts){
        if(!last) last=ts;
        var dt=(ts-last)/1000; last=ts;
        if(restUntil){
          if(ts>=restUntil){ restUntil=0; pos=0; place(); }
        }else{
          pos+=pps*dt;
          if(pos>=span){                   /* הרשימה יצאה במלואה */
            restUntil = ts + Math.max(0,(+O.restSec||0))*1000;
            if(!restUntil){ pos=0; }
          }
          place();
        }
        raf=requestAnimationFrame(step);
      }
      raf=requestAnimationFrame(step);
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

  root.NatiSponsors = { mount:mount, VERSION:"2.2" };
})(typeof window !== "undefined" ? window : globalThis);
