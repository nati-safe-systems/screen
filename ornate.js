/* =====================================================================
   נתי SAFE — מסגרות יוקרה  ·  v2.0
   ---------------------------------------------------------------------
   מסגרת מגולפת רחבה סביב המסך, עיטורי פינה גדולים, עיטורי אמצע-קצה,
   רקע דמאסק עדין, ברק זהב שנע לאט, ווינייטה שמעמיקה את הפינות.
   הכל וקטורי — חד בכל רזולוציה, בלי תמונות חיצוניות.
   ===================================================================== */
(function (root) {
  'use strict';

  function svg(s){ return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); }

  var GRAD =
    "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='#fff4cf'/><stop offset='.28' stop-color='#e8c86a'/>" +
      "<stop offset='.55' stop-color='#a37f2a'/><stop offset='.78' stop-color='#e8c86a'/>" +
      "<stop offset='1' stop-color='#fff4cf'/></linearGradient>" +
      "<radialGradient id='j'><stop offset='0' stop-color='#fff8e2'/>" +
      "<stop offset='1' stop-color='#c9a13c'/></radialGradient></defs>";

  var CORNER = svg(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>" + GRAD +
    "<g fill='none' stroke='url(#g)' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M8 8 H120' stroke-width='5'/><path d='M8 8 V120' stroke-width='5'/>" +
      "<path d='M20 20 H92' stroke-width='2'/><path d='M20 20 V92' stroke-width='2'/>" +
      "<path d='M30 30 H70' stroke-width='1.2' opacity='.7'/>" +
      "<path d='M30 30 V70' stroke-width='1.2' opacity='.7'/>" +
      "<path d='M92 24 C92 54 56 56 56 88 C56 110 82 118 98 104' stroke-width='4'/>" +
      "<path d='M24 92 C54 92 56 56 88 56 C110 56 118 82 104 98' stroke-width='4'/>" +
      "<path d='M70 34 C86 34 92 44 90 56' stroke-width='2.2' opacity='.9'/>" +
      "<path d='M34 70 C34 86 44 92 56 90' stroke-width='2.2' opacity='.9'/>" +
      "<path d='M104 12 C136 12 150 26 150 52' stroke-width='3' opacity='.8'/>" +
      "<path d='M12 104 C12 136 26 150 52 150' stroke-width='3' opacity='.8'/>" +
      "<path d='M150 52 C162 52 168 58 168 66' stroke-width='2' opacity='.6'/>" +
      "<path d='M52 150 C52 162 58 168 66 168' stroke-width='2' opacity='.6'/>" +
      "<path d='M60 12 C66 12 68 16 68 20' stroke-width='1.4' opacity='.55'/>" +
      "<path d='M12 60 C12 66 16 68 20 68' stroke-width='1.4' opacity='.55'/>" +
    "</g>" +
    "<circle cx='56' cy='56' r='5.5' fill='url(#j)'/>" +
    "<circle cx='104' cy='104' r='9' fill='none' stroke='url(#g)' stroke-width='3'/>" +
    "<circle cx='104' cy='104' r='3.4' fill='url(#j)'/>" +
    "<circle cx='150' cy='52' r='3' fill='url(#j)'/>" +
    "<circle cx='52' cy='150' r='3' fill='url(#j)'/>" +
    "</svg>");

  var EDGE = svg(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 70'>" + GRAD +
    "<g fill='none' stroke='url(#g)' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M6 35 H74' stroke-width='3'/><path d='M166 35 H234' stroke-width='3'/>" +
      "<path d='M120 8 C144 18 144 52 120 62 C96 52 96 18 120 8Z' stroke-width='3.2'/>" +
      "<path d='M120 20 C132 26 132 44 120 50 C108 44 108 26 120 20Z' stroke-width='1.6' opacity='.75'/>" +
      "<path d='M74 35 C88 20 96 28 100 35 C96 42 88 50 74 35Z' stroke-width='2.4'/>" +
      "<path d='M166 35 C152 20 144 28 140 35 C144 42 152 50 166 35Z' stroke-width='2.4'/>" +
    "</g>" +
    "<circle cx='120' cy='35' r='4.2' fill='url(#j)'/>" +
    "<circle cx='84' cy='35' r='2.4' fill='url(#j)'/>" +
    "<circle cx='156' cy='35' r='2.4' fill='url(#j)'/>" +
    "</svg>");

  var DIV = svg(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 26'>" + GRAD +
    "<g fill='none' stroke='url(#g)' stroke-width='2' stroke-linecap='round'>" +
      "<path d='M10 13 H120'/><path d='M180 13 H290'/>" +
      "<path d='M150 4 C161 8 161 18 150 22 C139 18 139 8 150 4Z'/>" +
      "<path d='M120 13 C130 5 136 9 139 13 C136 17 130 21 120 13Z'/>" +
      "<path d='M180 13 C170 5 164 9 161 13 C164 17 170 21 180 13Z'/>" +
    "</g><circle cx='150' cy='13' r='2.6' fill='url(#j)'/></svg>");

  var DAMASK = svg(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>" +
    "<g fill='none' stroke='#d9b451' stroke-width='1.1' opacity='.5'>" +
      "<path d='M60 12 C80 30 80 50 60 60 C40 50 40 30 60 12Z'/>" +
      "<path d='M60 60 C80 70 80 90 60 108 C40 90 40 70 60 60Z'/>" +
      "<path d='M12 60 C30 40 50 40 60 60 C50 80 30 80 12 60Z'/>" +
      "<path d='M60 60 C70 40 90 40 108 60 C90 80 70 80 60 60Z'/>" +
      "<circle cx='60' cy='60' r='4'/>" +
    "</g></svg>");

  var CSS = [
    '#nsf-frame{position:fixed;inset:0;z-index:8000;pointer-events:none}',
    '#nsf-frame .band{position:absolute;inset:0;border:1.9vh solid transparent;',
      'border-image:linear-gradient(140deg,#fff4cf 0%,#e8c86a 16%,#8f6f22 34%,#e8c86a 52%,',
      '#fff4cf 62%,#a37f2a 80%,#e8c86a 92%,#fff4cf 100%) 1;',
      'box-shadow:inset 0 0 0 .18vh rgba(255,244,207,.55),',
      'inset 0 0 2.6vh rgba(0,0,0,.75), 0 0 3vh rgba(233,200,106,.28)}',
    '#nsf-frame .band2{position:absolute;inset:2.3vh;border:.24vh solid rgba(233,200,106,.75);',
      'border-radius:.3vh;box-shadow:inset 0 0 0 .1vh rgba(0,0,0,.5),0 0 1.6vh rgba(233,200,106,.2)}',
    '#nsf-frame .band3{position:absolute;inset:3.1vh;border:.1vh solid rgba(233,200,106,.35)}',
    '#nsf-frame .shine{position:absolute;inset:0;overflow:hidden;opacity:.5}',
    '#nsf-frame .shine::before{content:"";position:absolute;top:-60%;left:-30%;width:22%;height:220%;',
      'background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);',
      'transform:rotate(18deg);animation:nsfShine 9s linear infinite}',
    '@keyframes nsfShine{0%{left:-30%}100%{left:130%}}',
    '#nsf-frame .em{position:absolute;background:no-repeat center/contain}',
    '#nsf-frame .em.t{top:-.5vh;left:50%;transform:translateX(-50%);width:26vh;height:7vh}',
    '#nsf-frame .em.b{bottom:-.5vh;left:50%;transform:translateX(-50%) rotate(180deg);width:26vh;height:7vh}',
    '#nsf-frame .em.l{left:-9.5vh;top:50%;transform:translateY(-50%) rotate(-90deg);width:26vh;height:7vh}',
    '#nsf-frame .em.r{right:-9.5vh;top:50%;transform:translateY(-50%) rotate(90deg);width:26vh;height:7vh}',

    '.oc{position:absolute;background:no-repeat center/contain;pointer-events:none;z-index:3;',
      'filter:drop-shadow(0 .2vh .5vh rgba(0,0,0,.6))}',
    '.oc.tl{top:0;left:0}.oc.tr{top:0;right:0;transform:rotate(90deg)}',
    '.oc.br{bottom:0;right:0;transform:rotate(180deg)}.oc.bl{bottom:0;left:0;transform:rotate(270deg)}',

    '.orn{position:relative;border-radius:1.6vh;',
      'background-image:linear-gradient(160deg,rgba(10,16,32,.72),rgba(4,8,18,.86));',
      'box-shadow:0 0 0 .28vh rgba(163,127,42,.95),',
      '0 0 0 .42vh rgba(255,244,207,.35),',
      'inset 0 .12vh 0 rgba(255,240,200,.16),',
      'inset 0 0 4vh rgba(0,0,0,.55),',
      '0 1.2vh 3.6vh rgba(0,0,0,.62)}',
    '.orn::before{content:"";position:absolute;inset:-.42vh;border-radius:1.9vh;padding:.42vh;',
      'background:linear-gradient(150deg,#fff4cf 0%,#e8c86a 22%,#7d5f18 48%,#e8c86a 72%,#fff4cf 100%);',
      '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
      '-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;z-index:2}',
    '.orn::after{content:"";position:absolute;inset:.95vh;border-radius:.9vh;',
      'border:.13vh solid rgba(233,200,106,.4);pointer-events:none;z-index:2}',

    '#nsf-tex{position:fixed;inset:0;z-index:7998;pointer-events:none;opacity:.075;',
      'background-repeat:repeat;background-size:15vh 15vh}',
    '#nsf-vig{position:fixed;inset:0;z-index:7999;pointer-events:none;',
      'background:radial-gradient(ellipse at 50% 45%,transparent 42%,rgba(0,0,0,.55) 100%)}',
    '.orn-div{height:2.4vh;background:no-repeat center/contain;margin:.3vh 0 .6vh;opacity:.9}'
  ].join('');

  function addCorners(el, sizeVh) {
    if (!el || el.querySelector(':scope > .oc')) return;
    ['tl','tr','br','bl'].forEach(function (p) {
      var d = document.createElement('span');
      d.className = 'oc ' + p;
      d.style.width = sizeVh + 'vh';
      d.style.height = sizeVh + 'vh';
      d.style.backgroundImage = 'url("' + CORNER + '")';
      el.appendChild(d);
    });
  }

  function decorate(el, size) {
    if (!el || el.classList.contains('orn')) return;
    el.classList.add('orn');
    addCorners(el, size);
  }

  function apply(opt) {
    opt = opt || {};
    if (document.getElementById('nsf-orn-css')) return;

    var st = document.createElement('style');
    st.id = 'nsf-orn-css'; st.textContent = CSS;
    document.head.appendChild(st);

    var f = document.createElement('div');
    f.id = 'nsf-frame';
    f.innerHTML =
      '<span class="band"></span><span class="shine"></span>' +
      '<span class="band2"></span><span class="band3"></span>' +
      '<span class="em t"></span><span class="em b"></span>' +
      '<span class="em l"></span><span class="em r"></span>';
    document.body.appendChild(f);
    ['t','b','l','r'].forEach(function (p) {
      f.querySelector('.em.' + p).style.backgroundImage = 'url("' + EDGE + '")';
    });
    addCorners(f, opt.outer || 15);

    var vig = document.createElement('div'); vig.id = 'nsf-vig';
    document.body.appendChild(vig);

    var tex = document.createElement('div'); tex.id = 'nsf-tex';
    tex.style.backgroundImage = 'url("' + DAMASK + '")';
    document.body.appendChild(tex);

    (opt.panels || []).forEach(function (sel) {
      var l = document.querySelectorAll(sel);
      for (var i = 0; i < l.length; i++) decorate(l[i], opt.panel || 6);
    });

    (opt.titles || []).forEach(function (sel) {
      var l = document.querySelectorAll(sel);
      for (var i = 0; i < l.length; i++) {
        if (l[i].nextSibling && l[i].nextSibling.className === 'orn-div') continue;
        var d = document.createElement('div');
        d.className = 'orn-div';
        d.style.backgroundImage = 'url("' + DIV + '")';
        l[i].parentNode.insertBefore(d, l[i].nextSibling);
      }
    });

    if (opt.watch && opt.watch.length) {
      setInterval(function () {
        opt.watch.forEach(function (sel) {
          var l = document.querySelectorAll(sel);
          for (var i = 0; i < l.length; i++) decorate(l[i], opt.panel || 6);
        });
      }, 2000);
    }
  }

  root.NatiOrnate = { apply: apply, decorate: decorate };
})(typeof window !== 'undefined' ? window : globalThis);
