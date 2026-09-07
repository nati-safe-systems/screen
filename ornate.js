/* =====================================================================
   נתי SAFE — מסגרות יוקרה  ·  v1.0
   ---------------------------------------------------------------------
   מסגרת מגולפת סביב המסך כולו, ומסגרת קטנה יותר סביב כל אזור.
   הכל וקטורי — נשאר חד בכל רזולוציה, ולא נשען על תמונות חיצוניות.

   שימוש:  NatiOrnate.apply();
   כיבוי:  display_config.ornate = false
   ===================================================================== */
(function (root) {
  'use strict';

  var GOLD = '%23d9b451', GOLD2 = '%23f3dc9a';

  /* עיטור פינה — סליל בארוקי. מסובב ב-CSS לארבע הפינות. */
  var CORNER =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 140'>" +
    "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='#f7e6b0'/><stop offset='.5' stop-color='#d9b451'/>" +
      "<stop offset='1' stop-color='#8a6a1f'/></linearGradient></defs>" +
    "<g fill='none' stroke='url(%23g)' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M6 6 H74' stroke-width='3.2'/>" +
      "<path d='M6 6 V74' stroke-width='3.2'/>" +
      "<path d='M14 14 H54' stroke-width='1.4' opacity='.85'/>" +
      "<path d='M14 14 V54' stroke-width='1.4' opacity='.85'/>" +
      "<path d='M54 16 C54 34 34 34 34 52 C34 64 46 68 54 61' stroke-width='2.6'/>" +
      "<path d='M16 54 C34 54 34 34 52 34 C64 34 68 46 61 54' stroke-width='2.6'/>" +
      "<path d='M78 6 C96 6 104 14 104 26' stroke-width='2.2' opacity='.75'/>" +
      "<path d='M6 78 C6 96 14 104 26 104' stroke-width='2.2' opacity='.75'/>" +
      "<path d='M40 8 C46 8 48 12 48 16' stroke-width='1.2' opacity='.6'/>" +
      "<path d='M8 40 C8 46 12 48 16 48' stroke-width='1.2' opacity='.6'/>" +
    "</g>" +
    "<circle cx='34' cy='34' r='3.4' fill='url(%23g)'/>" +
    "<circle cx='63' cy='63' r='5' fill='none' stroke='url(%23g)' stroke-width='2'/>" +
    "<circle cx='63' cy='63' r='1.8' fill='url(%23g)'/>" +
    "</svg>");

  /* עיטור אמצע-קצה — פרח קטן שמפריד את הקווים */
  var EDGE =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 40'>" +
    "<defs><linearGradient id='e' x1='0' y1='0' x2='0' y2='1'>" +
      "<stop offset='0' stop-color='#f7e6b0'/><stop offset='1' stop-color='#a8802c'/>" +
    "</linearGradient></defs>" +
    "<g fill='none' stroke='url(%23e)' stroke-width='2' stroke-linecap='round'>" +
      "<path d='M4 20 H26'/><path d='M54 20 H76'/>" +
      "<path d='M40 8 C48 12 48 28 40 32 C32 28 32 12 40 8Z'/>" +
      "<path d='M28 20 C33 15 33 25 28 20Z'/><path d='M52 20 C47 15 47 25 52 20Z'/>" +
    "</g><circle cx='40' cy='20' r='2.6' fill='url(%23e)'/></svg>");

  var CSS = [
    /* ---- מסגרת המסך כולו ---- */
    '#nsf-frame{position:fixed;inset:0;z-index:8000;pointer-events:none}',
    '#nsf-frame .edge{position:absolute;background:',
      'linear-gradient(180deg,rgba(247,230,176,.95),rgba(217,180,81,.9) 45%,rgba(120,88,24,.9));',
      'box-shadow:0 0 1.2vh rgba(255,210,120,.35)}',
    '#nsf-frame .edge.t{top:0;left:0;right:0;height:.34vh}',
    '#nsf-frame .edge.b{bottom:0;left:0;right:0;height:.34vh}',
    '#nsf-frame .edge.l{left:0;top:0;bottom:0;width:.34vh}',
    '#nsf-frame .edge.r{right:0;top:0;bottom:0;width:.34vh}',
    '#nsf-frame .inner{position:absolute;inset:.9vh;border:.12vh solid rgba(217,180,81,.45);border-radius:.4vh}',

    /* ---- עיטורי פינה ---- */
    '.oc{position:absolute;background:no-repeat center/contain;pointer-events:none;z-index:3}',
    '.oc.tl{top:0;left:0}',
    '.oc.tr{top:0;right:0;transform:rotate(90deg)}',
    '.oc.br{bottom:0;right:0;transform:rotate(180deg)}',
    '.oc.bl{bottom:0;left:0;transform:rotate(270deg)}',

    /* ---- מסגרת לאזור ---- */
    '.orn{position:relative;border:.22vh solid transparent;border-radius:1.2vh;',
      'background-clip:padding-box;',
      'box-shadow:0 0 0 .1vh rgba(217,180,81,.55) inset,',
      '0 .1vh 0 rgba(255,240,200,.14) inset,',
      '0 .8vh 2.6vh rgba(0,0,0,.5)}',
    '.orn::before{content:"";position:absolute;inset:-.22vh;border-radius:1.3vh;padding:.22vh;',
      'background:linear-gradient(150deg,#f7e6b0 0%,#d9b451 28%,#7d5f18 52%,#d9b451 74%,#f7e6b0 100%);',
      '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
      '-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;z-index:2}',
    '.orn::after{content:"";position:absolute;inset:.55vh;border-radius:.8vh;',
      'border:.1vh solid rgba(217,180,81,.32);pointer-events:none;z-index:2}',

    /* ---- מרקם עדין ---- */
    '#nsf-tex{position:fixed;inset:0;z-index:7999;pointer-events:none;opacity:.05;',
      'background-image:radial-gradient(circle at 25% 25%,#fff 1px,transparent 1px),',
      'radial-gradient(circle at 75% 75%,#fff 1px,transparent 1px);background-size:26px 26px}'
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

  function apply(opt) {
    opt = opt || {};
    if (document.getElementById('nsf-orn-css')) return;

    var st = document.createElement('style');
    st.id = 'nsf-orn-css';
    st.textContent = CSS;
    document.head.appendChild(st);

    /* מסגרת חיצונית */
    var f = document.createElement('div');
    f.id = 'nsf-frame';
    f.innerHTML = '<span class="edge t"></span><span class="edge b"></span>' +
                  '<span class="edge l"></span><span class="edge r"></span>' +
                  '<span class="inner"></span>';
    document.body.appendChild(f);
    addCorners(f, opt.outer || 9);

    var tex = document.createElement('div');
    tex.id = 'nsf-tex';
    document.body.appendChild(tex);

    /* מסגרות לאזורים — נקבע לפי המסך */
    (opt.panels || []).forEach(function (sel) {
      var list = document.querySelectorAll(sel);
      for (var i = 0; i < list.length; i++) {
        list[i].classList.add('orn');
        addCorners(list[i], opt.panel || 4.2);
      }
    });

    /* אזורים שנבנים דינמית — מוסיפים להם מסגרת כשהם מופיעים */
    if (opt.watch && opt.watch.length) {
      setInterval(function () {
        opt.watch.forEach(function (sel) {
          var list = document.querySelectorAll(sel);
          for (var i = 0; i < list.length; i++) {
            if (!list[i].classList.contains('orn')) {
              list[i].classList.add('orn');
              addCorners(list[i], opt.panel || 4.2);
            }
          }
        });
      }, 2000);
    }
  }

  root.NatiOrnate = { apply: apply, CORNER: CORNER, EDGE: EDGE };
})(typeof window !== 'undefined' ? window : globalThis);
