/* =====================================================================
   נתי SAFE — כותרת עיטורי זהב מעל המסגרת המרכזית · NatiGoldBand v1.0 · 18.10.26
   ---------------------------------------------------------------------
   אותו עיטור של המסך הראשי (סרגל זהב כפול, יהלומים וסלסול בקצוות,
   משני צדי הלוגו) — בכל מסך שיש בו חלל ריק מעל המסגרת המרכזית.
   המיקום נמדד מהמסך עצמו: בין הכותרת העליונה לבין ראש המסגרת,
   צמוד ללוגו שבראש המסגרת. נמדד מחדש בכל שינוי גודל.
   פועל רק בערכת "המרכז הרוחני" (body.merkaz). סטטי — בלי אנימציה.
   ===================================================================== */
(function(){
  if(window.NatiGoldBand) return;
  var css=document.createElement("style");
  css.textContent=
    "#nsf-gb{position:fixed;left:0;top:0;width:0;height:0;z-index:60;pointer-events:none;display:none}"+
    "body.merkaz #nsf-gb.on{display:block}"+
    "#nsf-gb .rule{position:absolute;height:1.6vh}"+
    "#nsf-gb .rule.r{transform:scaleX(-1)}"+
    "#nsf-gb .rule svg{width:100%;height:100%;display:block;overflow:visible}"+
    "#nsf-gb .gem{position:absolute;width:1.6vh;height:1.6vh;filter:drop-shadow(0 0 .6vh rgba(255,215,110,.45))}"+
    "#nsf-gb .gem svg{width:100%;height:100%;display:block}"+
    "#nsf-gb .vr{position:fixed;left:0;right:0;top:0;opacity:.55;"+
    " background:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 140' preserveAspectRatio='none'><g fill='none' stroke-linecap='round'>"+
    "<path d='M0 58 L78 40 L130 76 L216 36 L272 62' stroke='%23e8c766' stroke-width='2.6' opacity='.9'/><path d='M78 40 L92 8 M130 76 L142 108' stroke='%23c09433' stroke-width='1.6' opacity='.6'/>"+
    "<path d='M1600 58 L1522 40 L1470 76 L1384 36 L1328 62' stroke='%23e8c766' stroke-width='2.6' opacity='.9'/><path d='M1522 40 L1508 8 M1470 76 L1458 108' stroke='%23c09433' stroke-width='1.6' opacity='.6'/>"+
    "</g></svg>\") center/100% 100% no-repeat}";
  document.head.appendChild(css);

  var RULE='<svg viewBox="0 0 1000 40" preserveAspectRatio="none"><defs><linearGradient id="gbG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">'+
    '<stop offset="0" stop-color="#f3d778" stop-opacity="0"/><stop offset=".12" stop-color="#e8c766"/><stop offset=".55" stop-color="#fff1b8"/>'+
    '<stop offset=".85" stop-color="#c9a227"/><stop offset="1" stop-color="#c9a227" stop-opacity="0"/></linearGradient></defs>'+
    '<g fill="none" stroke="url(#gbG)"><path d="M0 14 H1000" stroke-width="2.2" vector-effect="non-scaling-stroke"/>'+
    '<path d="M60 26 H940" stroke-width="1" opacity=".75" vector-effect="non-scaling-stroke"/></g></svg>'+
    '<svg viewBox="0 0 60 40" style="position:absolute;left:-2.2vh;top:-1.1vh;width:4.2vh;height:2.8vh;overflow:visible">'+
    '<path d="M58 14 C40 14 30 16 22 22 C14 28 6 26 6 18 C6 11 14 8 19 13 C22 16 20 21 16 20" fill="none" stroke="#e8c766" stroke-width="2.2" stroke-linecap="round"/>'+
    '<circle cx="16" cy="20" r="2.4" fill="#fff1b8"/></svg>';
  var GEM='<svg viewBox="0 0 20 20"><path d="M10 1 L19 10 L10 19 L1 10 Z" fill="#e8c766" stroke="#fff1b8" stroke-width="1"/>'+
    '<path d="M10 5 L15 10 L10 15 L5 10 Z" fill="#8a6a1f"/></svg>';

  var box=null, sig="";
  function vis(e){ if(!e) return false; var s=getComputedStyle(e); return s.display!=="none" && s.visibility!=="hidden" && e.getClientRects().length>0; }
  function place(){
    if(!document.body || !document.body.classList.contains("merkaz")){ if(box) box.classList.remove("on"); return; }
    var W=innerWidth, H=innerHeight, vh=H/100, vw=W/100;
    /* הלוגו שבראש המסגרת המרכזית — הקרוב ביותר למרכז הרוחב */
    var cr=null, best=1e9;
    [].forEach.call(document.querySelectorAll(".mk-crown"),function(e){
      if(!vis(e)) return; var r=e.getBoundingClientRect(), d=Math.abs((r.left+r.right)/2-W/2);
      if(r.width>10 && d<best){ best=d; cr=e; }
    });
    if(!cr){ if(box) box.classList.remove("on"); return; }
    var C=cr.getBoundingClientRect(), F=cr.parentElement.getBoundingClientRect();
    /* תחתית הכותרת שמעל המסגרת (אם יש) */
    var gapTop=0;
    [].forEach.call(document.querySelectorAll("body > *, body > * > *, body > * > * > *"),function(e){
      if(e===box || (box && box.contains(e)) || e===cr || e.id==="mk-sweep") return;
      var r=e.getBoundingClientRect();
      if(r.height<12 || r.width<W*0.15 || r.height>H*0.6) return;
      if(r.bottom<=F.top+1 && r.bottom>gapTop && r.right>F.left && r.left<F.right && vis(e)) gapTop=r.bottom;
    });
    var gap=F.top-gapTop;
    if(gap<1.9*vh){ if(box) box.classList.remove("on"); return; }
    var hh=1.6*vh;
    var y=Math.max(gapTop+0.35*vh, Math.min(F.top-hh-0.5*vh, C.top+0.4*vh));
    var inner=C.left-1.2*vw, outer=Math.max(F.left+1.6*vw, inner-26*vw);
    var w=inner-outer;
    if(w<5*vw){ if(box) box.classList.remove("on"); return; }
    var k=[Math.round(y),Math.round(outer),Math.round(w),W,H,gapTop<2?1:0].join(",");
    if(!box){ box=document.createElement("div"); box.id="nsf-gb"; box.setAttribute("aria-hidden","true"); document.body.appendChild(box); }
    box.classList.add("on");
    if(k===sig) return; sig=k;
    var g=function(side,frac){ return '<div class="gem" style="'+side+':'+Math.round((side==="left"?outer:W-(C.right+1.2*vw)-w)+w*frac-0.8*vh)+'px;top:'+Math.round(y)+'px">'+GEM+'</div>'; };
    box.innerHTML=
      (gapTop<2 ? '<div class="vr" style="height:'+Math.round(Math.min(F.top, 14*vh))+'px"></div>' : '')+
      '<div class="rule l" style="left:'+Math.round(outer)+'px;top:'+Math.round(y)+'px;width:'+Math.round(w)+'px">'+RULE+'</div>'+
      '<div class="rule r" style="left:'+Math.round(C.right+1.2*vw)+'px;top:'+Math.round(y)+'px;width:'+Math.round(w)+'px">'+RULE+'</div>'+
      g("left",.30)+g("left",.62)+
      '<div class="gem" style="left:'+Math.round(C.right+1.2*vw+w*(1-.30)-0.8*vh)+'px;top:'+Math.round(y)+'px">'+GEM+'</div>'+
      '<div class="gem" style="left:'+Math.round(C.right+1.2*vw+w*(1-.62)-0.8*vh)+'px;top:'+Math.round(y)+'px">'+GEM+'</div>';
    /* העיטור הישן של המקווה (סרגל צמוד למסגרת) — מוסתר כשיש את החדש */
    var o2=document.getElementById("mk-orn2"); if(o2) o2.style.setProperty("display","none","important");
  }
  var t=null;
  function later(ms){ clearTimeout(t); t=setTimeout(place, ms||200); }
  window.addEventListener("resize",function(){ later(250); });
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){ later(600); }); else later(600);
  [1200,2500,4000,6000,9000,13000,20000].forEach(function(ms){ setTimeout(place,ms); });   /* ערכת העיצוב והנתונים נטענים בהדרגה */
  setInterval(place, 15000);   /* הפריסה משתנה כשהנתונים נטענים / ערכת העיצוב מוחלת */
  window.NatiGoldBand={place:place, VERSION:"1.0"};
})();
