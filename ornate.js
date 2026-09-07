/* =====================================================================
   נתי SAFE — ערכות עיצוב  ·  v3.0
   ---------------------------------------------------------------------
   עשר ערכות, מהעדינה ביותר ועד המפוארת ביותר.
   נבחרות מממשק הניהול:  display_config.theme
   הכל וקטורי — חד בכל רזולוציה, בלי תמונות חיצוניות.
   ===================================================================== */
(function (root) {
  'use strict';

  function svg(s){ return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); }

  /* ---------- עשר הערכות ----------
     c1/c2/c3 = בהיר / ביניים / כהה של המתכת
     bg1/bg2  = רקע הפאנלים
     orn      = 0 ללא עיטורים, 1 עדין, 2 מלא
     shine    = שניות לסיבוב הברק, 0 = כבוי
     band     = עובי המסגרת החיצונית ב-vh
     tex      = עוצמת הדמאסק ברקע                                   */
  var THEMES = {
    minimal:  { name:'מודרני נקי',      c1:'#e8eef6', c2:'#9fb3cc', c3:'#5b708c',
                bg1:'rgba(14,20,32,.62)', bg2:'rgba(6,10,18,.8)',  orn:0, shine:0,  band:.5,  tex:0,    vig:.28 },
    slim:     { name:'קו זהב עדין',     c1:'#fff4cf', c2:'#d9b451', c3:'#8a6a1f',
                bg1:'rgba(12,18,30,.6)',  bg2:'rgba(5,9,17,.82)',  orn:1, shine:0,  band:.7,  tex:.03,  vig:.34 },
    classic:  { name:'קלאסי זהב',       c1:'#fff4cf', c2:'#e8c86a', c3:'#a37f2a',
                bg1:'rgba(10,16,32,.7)',  bg2:'rgba(4,8,18,.86)',  orn:2, shine:14, band:1.2, tex:.05,  vig:.42 },
    royal:    { name:'זהב מלכותי',      c1:'#fff8e2', c2:'#f0cf72', c3:'#8f6f22',
                bg1:'rgba(12,10,30,.74)', bg2:'rgba(5,4,16,.9)',   orn:2, shine:11, band:1.9, tex:.08,  vig:.5  },
    jerusalem:{ name:'ירושלים',         c1:'#f6e7c8', c2:'#cbb083', c3:'#8b7448',
                bg1:'rgba(38,30,20,.66)', bg2:'rgba(20,15,9,.86)', orn:2, shine:16, band:1.3, tex:.07,  vig:.4  },
    sapphire: { name:'כחול מלכותי',     c1:'#dbe9ff', c2:'#7fa8e0', c3:'#2c4d86',
                bg1:'rgba(8,18,44,.74)',  bg2:'rgba(3,8,24,.9)',   orn:2, shine:13, band:1.4, tex:.06,  vig:.46 },
    burgundy: { name:'בורדו ויין',      c1:'#ffd9c9', c2:'#c9756a', c3:'#7a2a28',
                bg1:'rgba(38,8,12,.72)',  bg2:'rgba(18,3,6,.9)',   orn:2, shine:13, band:1.5, tex:.07,  vig:.48 },
    emerald:  { name:'ירוק אזמרגד',     c1:'#d8ffe9', c2:'#6fc79a', c3:'#1f6b4a',
                bg1:'rgba(4,30,22,.72)',  bg2:'rgba(2,14,10,.9)',  orn:2, shine:13, band:1.4, tex:.06,  vig:.46 },
    platinum: { name:'שחור ופלטינה',    c1:'#ffffff', c2:'#c9d2dc', c3:'#6d7a88',
                bg1:'rgba(10,10,12,.78)', bg2:'rgba(3,3,4,.92)',   orn:1, shine:18, band:1.1, tex:.04,  vig:.5  },
    festive:  { name:'חגיגי מפואר',     c1:'#fffbe8', c2:'#ffd76b', c3:'#a06f10',
                bg1:'rgba(26,8,34,.76)',  bg2:'rgba(10,2,16,.92)', orn:2, shine:8,  band:2.2, tex:.1,   vig:.55 }
  };

  var T = THEMES.classic;

  function grad(id){
    return "<defs><linearGradient id='"+id+"' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='"+T.c1+"'/><stop offset='.3' stop-color='"+T.c2+"'/>" +
      "<stop offset='.55' stop-color='"+T.c3+"'/><stop offset='.8' stop-color='"+T.c2+"'/>" +
      "<stop offset='1' stop-color='"+T.c1+"'/></linearGradient>" +
      "<radialGradient id='j'><stop offset='0' stop-color='"+T.c1+"'/>" +
      "<stop offset='1' stop-color='"+T.c2+"'/></radialGradient></defs>";
  }

  function cornerSVG(level){
    var g=grad('g'), core =
      "<path d='M8 8 H120' stroke-width='5'/><path d='M8 8 V120' stroke-width='5'/>" +
      "<path d='M20 20 H92' stroke-width='2'/><path d='M20 20 V92' stroke-width='2'/>";
    var rich =
      "<path d='M30 30 H70' stroke-width='1.2' opacity='.7'/>" +
      "<path d='M30 30 V70' stroke-width='1.2' opacity='.7'/>" +
      "<path d='M92 24 C92 54 56 56 56 88 C56 110 82 118 98 104' stroke-width='4'/>" +
      "<path d='M24 92 C54 92 56 56 88 56 C110 56 118 82 104 98' stroke-width='4'/>" +
      "<path d='M70 34 C86 34 92 44 90 56' stroke-width='2.2' opacity='.9'/>" +
      "<path d='M34 70 C34 86 44 92 56 90' stroke-width='2.2' opacity='.9'/>" +
      "<path d='M104 12 C136 12 150 26 150 52' stroke-width='3' opacity='.8'/>" +
      "<path d='M12 104 C12 136 26 150 52 150' stroke-width='3' opacity='.8'/>";
    var dots = level>1
      ? "<circle cx='56' cy='56' r='5.5' fill='url(#j)'/>" +
        "<circle cx='104' cy='104' r='9' fill='none' stroke='url(#g)' stroke-width='3'/>" +
        "<circle cx='104' cy='104' r='3.4' fill='url(#j)'/>"
      : "<circle cx='40' cy='40' r='3.2' fill='url(#j)'/>";
    return svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>"+g+
      "<g fill='none' stroke='url(#g)' stroke-linecap='round' stroke-linejoin='round'>"+
      core + (level>1?rich:"") + "</g>" + dots + "</svg>");
  }

  function edgeSVG(){
    return svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 70'>"+grad('g')+
      "<g fill='none' stroke='url(#g)' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M6 35 H74' stroke-width='3'/><path d='M166 35 H234' stroke-width='3'/>" +
      "<path d='M120 8 C144 18 144 52 120 62 C96 52 96 18 120 8Z' stroke-width='3.2'/>" +
      "<path d='M120 20 C132 26 132 44 120 50 C108 44 108 26 120 20Z' stroke-width='1.6' opacity='.75'/>" +
      "<path d='M74 35 C88 20 96 28 100 35 C96 42 88 50 74 35Z' stroke-width='2.4'/>" +
      "<path d='M166 35 C152 20 144 28 140 35 C144 42 152 50 166 35Z' stroke-width='2.4'/>" +
      "</g><circle cx='120' cy='35' r='4.2' fill='url(#j)'/></svg>");
  }

  function divSVG(){
    return svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 26'>"+grad('g')+
      "<g fill='none' stroke='url(#g)' stroke-width='2' stroke-linecap='round'>" +
      "<path d='M10 13 H120'/><path d='M180 13 H290'/>" +
      "<path d='M150 4 C161 8 161 18 150 22 C139 18 139 8 150 4Z'/>" +
      "<path d='M120 13 C130 5 136 9 139 13 C136 17 130 21 120 13Z'/>" +
      "<path d='M180 13 C170 5 164 9 161 13 C164 17 170 21 180 13Z'/>" +
      "</g><circle cx='150' cy='13' r='2.6' fill='url(#j)'/></svg>");
  }

  function damaskSVG(){
    return svg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>" +
      "<g fill='none' stroke='"+T.c2+"' stroke-width='1.1' opacity='.55'>" +
      "<path d='M60 12 C80 30 80 50 60 60 C40 50 40 30 60 12Z'/>" +
      "<path d='M60 60 C80 70 80 90 60 108 C40 90 40 70 60 60Z'/>" +
      "<path d='M12 60 C30 40 50 40 60 60 C50 80 30 80 12 60Z'/>" +
      "<path d='M60 60 C70 40 90 40 108 60 C90 80 70 80 60 60Z'/>" +
      "<circle cx='60' cy='60' r='4'/></g></svg>");
  }

  var HOST = '';   /* ריק = כל המסך. אחרת סלקטור של מיכל (לדמו) */
  function css(){
    var pad = (T.band + 2.6).toFixed(2);
    var unit = HOST ? '%' : 'vh';
    var padCss = HOST
      ? HOST+'{padding:'+(T.band*1.4).toFixed(2)+'vh !important;box-sizing:border-box;position:relative}'
      : 'body{padding:'+pad+'vh !important;box-sizing:border-box}';
    return [
      padCss,
      '#nsf-frame{position:'+(HOST?'absolute':'fixed')+';inset:0;z-index:8000;pointer-events:none}',
      '#nsf-frame .band{position:absolute;inset:0;border:'+T.band+'vh solid transparent;',
        'border-image:linear-gradient(140deg,'+T.c1+' 0%,'+T.c2+' 20%,'+T.c3+' 42%,'+T.c2+' 62%,'+T.c1+' 100%) 1;',
        'box-shadow:inset 0 0 0 .14vh rgba(255,255,255,.35),inset 0 0 2.4vh rgba(0,0,0,.7)}',
      '#nsf-frame .band2{position:absolute;inset:'+(T.band+.5)+'vh;',
        'border:.2vh solid '+T.c2+';opacity:.75}',
      '#nsf-frame .band3{position:absolute;inset:'+(T.band+1.1)+'vh;',
        'border:.1vh solid '+T.c2+';opacity:.35}',
      T.shine
        ? '#nsf-frame .shine{position:absolute;inset:0;overflow:hidden;opacity:.32}' +
          '#nsf-frame .shine::before{content:"";position:absolute;top:-60%;left:-30%;width:18%;height:220%;' +
          'background:linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent);' +
          'transform:rotate(18deg);animation:nsfShine '+T.shine+'s linear infinite}' +
          '@keyframes nsfShine{0%{left:-30%}100%{left:130%}}'
        : '#nsf-frame .shine{display:none}',
      T.orn>0
        ? '#nsf-frame .em{position:absolute;background:no-repeat center/contain}' +
          '#nsf-frame .em.t{top:-.4vh;left:50%;transform:translateX(-50%);width:24vh;height:6.4vh}' +
          '#nsf-frame .em.b{bottom:-.4vh;left:50%;transform:translateX(-50%) rotate(180deg);width:24vh;height:6.4vh}' +
          '#nsf-frame .em.l{left:-8.8vh;top:50%;transform:translateY(-50%) rotate(-90deg);width:24vh;height:6.4vh}' +
          '#nsf-frame .em.r{right:-8.8vh;top:50%;transform:translateY(-50%) rotate(90deg);width:24vh;height:6.4vh}'
        : '#nsf-frame .em{display:none}',
      '.oc{position:absolute;background:no-repeat center/contain;pointer-events:none;z-index:3;',
        'filter:drop-shadow(0 .15vh .4vh rgba(0,0,0,.55))}',
      '.oc.tl{top:0;left:0}.oc.tr{top:0;right:0;transform:rotate(90deg)}',
      '.oc.br{bottom:0;right:0;transform:rotate(180deg)}.oc.bl{bottom:0;left:0;transform:rotate(270deg)}',
      T.orn===0 ? '.oc{display:none}' : '',
      '.orn{position:relative;border-radius:0;',
        'background-image:linear-gradient(160deg,'+T.bg1+','+T.bg2+');',
        'box-shadow:0 0 0 .22vh '+T.c3+',0 0 0 .34vh rgba(255,255,255,.22),',
        'inset 0 .1vh 0 rgba(255,255,255,.12),inset 0 0 3.4vh rgba(0,0,0,.5),',
        '0 1vh 3vh rgba(0,0,0,.55)}',
      '.orn::before{content:"";position:absolute;inset:-.34vh;border-radius:0;padding:.34vh;',
        'background:linear-gradient(150deg,'+T.c1+' 0%,'+T.c2+' 26%,'+T.c3+' 50%,'+T.c2+' 74%,'+T.c1+' 100%);',
        '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
        '-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;z-index:2}',
      '.orn::after{content:"";position:absolute;inset:.85vh;border-radius:0;',
        'border:.11vh solid '+T.c2+';opacity:.35;pointer-events:none;z-index:2}',
      /* התוכן שבתוך פאנל לא נוגע במסגרת */
      '.orn>*:not(.oc){position:relative;z-index:4}',
      '#nsf-tex{position:'+(HOST?'absolute':'fixed')+';inset:0;z-index:7998;pointer-events:none;opacity:'+T.tex+';',
        'background-repeat:repeat;background-size:15vh 15vh}',
      '#nsf-vig{position:'+(HOST?'absolute':'fixed')+';inset:0;z-index:7999;pointer-events:none;',
        'background:radial-gradient(ellipse at 50% 45%,transparent 44%,rgba(0,0,0,'+T.vig+') 100%)}',
      '.orn-div{height:2.2vh;background:no-repeat center/contain;margin:.2vh 0 .5vh;opacity:.85}',
      '#nsf-ver{bottom:'+(T.band+0.5).toFixed(2)+'vh !important;right:'+(T.band+1.2).toFixed(2)+'vh !important;z-index:9500}',
      T.orn===0 ? '.orn-div{display:none}' : '',
      ''
    ].join('');
  }

  function addCorners(el, sizeVh) {
    if (!el || T.orn===0 || el.querySelector(':scope > .oc')) return;
    ['tl','tr','br','bl'].forEach(function (p) {
      var d = document.createElement('span');
      d.className = 'oc ' + p;
      d.style.width = sizeVh + 'vh'; d.style.height = sizeVh + 'vh';
      d.style.backgroundImage = 'url("' + cornerSVG(T.orn) + '")';
      el.appendChild(d);
    });
  }
  function decorate(el, size) {
    if (!el || el.classList.contains('orn')) return;
    el.classList.add('orn'); addCorners(el, size);
  }

  function apply(opt) {
    opt = opt || {};
    var name = opt.theme || 'classic';
    HOST = opt.container || '';
    /* החלפת ערכה בזמן ריצה — מנקים את הקודמת */
    var old = document.getElementById('nsf-frame');
    if (old && opt.replace) {
      old.remove();
      var ov=document.getElementById('nsf-vig'); if(ov) ov.remove();
      var ot=document.getElementById('nsf-tex'); if(ot) ot.remove();
      var oc=document.getElementById('nsf-orn-css'); if(oc) oc.remove();
      var l=document.querySelectorAll('.orn');
      for (var q=0;q<l.length;q++){
        l[q].classList.remove('orn');
        var cs=l[q].querySelectorAll(':scope > .oc');
        for (var w=0;w<cs.length;w++) cs[w].remove();
      }
      var dv=document.querySelectorAll('.orn-div');
      for (var d2=0;d2<dv.length;d2++) dv[d2].remove();
    }
    if (name === 'none') return;
    T = THEMES[name] || THEMES.classic;

    var st = document.getElementById('nsf-orn-css') || document.createElement('style');
    st.id = 'nsf-orn-css'; st.textContent = css();
    if (!st.parentNode) document.head.appendChild(st);

    var f = document.getElementById('nsf-frame');
    if (!f) {
      f = document.createElement('div'); f.id = 'nsf-frame';
      f.innerHTML = '<span class="band"></span><span class="shine"></span>' +
        '<span class="band2"></span><span class="band3"></span>' +
        '<span class="em t"></span><span class="em b"></span>' +
        '<span class="em l"></span><span class="em r"></span>';
      var host = HOST ? document.querySelector(HOST) : document.body;
      if (!host) host = document.body;
      host.appendChild(f);
      var v = document.createElement('div'); v.id='nsf-vig'; host.appendChild(v);
      var x = document.createElement('div'); x.id='nsf-tex'; host.appendChild(x);
    }
    ['t','b','l','r'].forEach(function (p) {
      var e=f.querySelector('.em.'+p); if(e) e.style.backgroundImage='url("'+edgeSVG()+'")';
    });
    document.getElementById('nsf-tex').style.backgroundImage='url("'+damaskSVG()+'")';

        (opt.panels||[]).forEach(function(sel){
      var l=document.querySelectorAll(sel);
      for (var i=0;i<l.length;i++) decorate(l[i], opt.panel||3.4);
    });
    (opt.titles||[]).forEach(function(sel){
      var l=document.querySelectorAll(sel);
      for (var i=0;i<l.length;i++){
        if (l[i].nextSibling && l[i].nextSibling.className==='orn-div') continue;
        var d=document.createElement('div'); d.className='orn-div';
        d.style.backgroundImage='url("'+divSVG()+'")';
        l[i].parentNode.insertBefore(d, l[i].nextSibling);
      }
    });
    if (opt.watch && opt.watch.length) {
      setInterval(function(){
        opt.watch.forEach(function(sel){
          var l=document.querySelectorAll(sel);
          for (var i=0;i<l.length;i++) decorate(l[i], opt.panel||3.4);
        });
      }, 2000);
    }
  }

  root.NatiOrnate = { apply: apply, decorate: decorate, THEMES: THEMES };
})(typeof window !== 'undefined' ? window : globalThis);
