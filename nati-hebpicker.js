/* =====================================================================
   נתי SAFE — בורר תאריך עברי-לועזי  ·  NatiHebPicker v1.0
   ---------------------------------------------------------------------
   כל שדה תאריך במערכת הציג תאריך לועזי בלבד. מי שמזמין מודעה לשבת
   מברכים או לחול המועד חושב בתאריך עברי, והיה צריך להמיר בראש.

   המודול נצמד לכל <input type="date"> קיים, בלי לשנות את הערך שהוא
   שומר: הטופס ממשיך לקבל yyyy-mm-dd בדיוק כמו קודם. מה שמתווסף הוא
   תווית עברית מתחת לשדה, ולוח שמציג את שני התאריכים יחד.

   שימוש:
     NatiHebPicker.attach(document.getElementById("aq-from"));
     NatiHebPicker.attachAll();          // כל שדות התאריך בדף
     NatiHebPicker.toHeb("2026-09-28");  // "י״ז בתשרי תשפ״ז"

   מנוע הלוח הוא אותו מנוע שרץ במסכים ואומת מול לוח מודפס —
   לא נכתב כאן חישוב שני.
   ===================================================================== */
(function (root) {
  'use strict';

function hc_mod(a,n){return ((a%n)+n)%n;}
function hc_q(a,n){return Math.floor(a/n);}
function hc_gregLeap(y){return (y%4===0)&&(y%100!==0||y%400===0);}
function hc_gregToRD(y,m,d){
  var n=365*(y-1)+hc_q(y-1,4)-hc_q(y-1,100)+hc_q(y-1,400);
  var md=[31,(hc_gregLeap(y)?29:28),31,30,31,30,31,31,30,31,30,31];
  for(var i=0;i<m-1;i++)n+=md[i];
  return n+d;
}
function hc_wd(rd){return hc_mod(rd,7);} /* 0=ראשון */
var HC_EPOCH=-1373427;
function hc_leap(y){return hc_mod(7*y+1,19)<7;}
function hc_monthsInYear(y){return hc_leap(y)?13:12;}
function hc_elapsedDays(year){
  var me=hc_q(235*year-234,19);
  var pe=12084+13753*me;
  var day=29*me+hc_q(pe,25920);
  if(hc_mod(3*(day+1),7)<3)day+=1;
  return day;
}
function hc_nyDelay(year){
  var a=hc_elapsedDays(year-1),b=hc_elapsedDays(year),c=hc_elapsedDays(year+1);
  if(c-b===356)return 2; if(b-a===382)return 1; return 0;
}
function hc_newYear(year){return HC_EPOCH+hc_elapsedDays(year)+hc_nyDelay(year);}
function hc_daysInYear(year){return hc_newYear(year+1)-hc_newYear(year);}
function hc_longChesh(y){return hc_daysInYear(y)%10===5;}
function hc_shortKis(y){return hc_daysInYear(y)%10===3;}
function hc_monthLen(year,month){
  if([2,4,6,10,13].indexOf(month)>=0)return 29;
  if(month===12&&!hc_leap(year))return 29;
  if(month===8&&!hc_longChesh(year))return 29;
  if(month===9&&hc_shortKis(year))return 29;
  return 30;
}
function hc_order(y){var a=[],m;for(m=7;m<=hc_monthsInYear(y);m++)a.push(m);for(m=1;m<=6;m++)a.push(m);return a;}
function hc_toRD(year,month,day){
  var rd=hc_newYear(year)-1, ord=hc_order(year), i;
  for(i=0;i<ord.length;i++){ if(ord[i]===month)break; rd+=hc_monthLen(year,ord[i]); }
  return rd+day;
}
function hc_fromRD(rd){
  var year=Math.floor((rd-HC_EPOCH)/366)+1;
  while(hc_newYear(year+1)<=rd)year++;
  while(hc_newYear(year)>rd)year--;
  var ord=hc_order(year), cur=hc_newYear(year), month=7, i;
  for(i=0;i<ord.length;i++){ var ml=hc_monthLen(year,ord[i]); if(rd<cur+ml){month=ord[i];break;} cur+=ml; }
  return {year:year,month:month,day:rd-cur+1};
}
function hc_monthName(year,month){
  if(hc_leap(year)){ if(month===12)return 'אדר א׳'; if(month===13)return 'אדר ב׳'; }
  return ['','ניסן','אייר','סיוון','תמוז','אב','אלול','תשרי','חשוון','כסלו','טבת','שבט','אדר'][month];
}
function hc_nextMonth(year,month){
  var mim=hc_monthsInYear(year);
  if(month===6)return {year:year+1,month:7};
  if(month===mim)return {year:year,month:1};
  var ord=hc_order(year); return {year:year,month:ord[ord.indexOf(month)+1]};
}
/* מולד: מחזיר יום-בשבוע אזרחי, שעה, דקות, חלקים */
function hc_molad(year,month){
  var mt=hc_q(235*year-234,19), ord=hc_order(year), off=ord.indexOf(month);
  var M=mt+off;
  var total=31524 + M*765433;
  var pos=hc_mod(total,181440);
  var dayIdx=hc_q(pos,25920);
  var within=pos-dayIdx*25920;
  var minsAfter6=Math.floor(within/18);
  var chalakim=within-minsAfter6*18;
  var civilMin=hc_mod(18*60+minsAfter6,24*60);
  var h24=Math.floor(civilMin/60), min=civilMin%60;
  var civWk=hc_mod(dayIdx-1,7);
  if(civilMin< 18*60) civWk=hc_mod(civWk+1,7);
  return {civWk:civWk,h24:h24,min:min,chalakim:chalakim};
}
var HC_DOW=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
function hc_partOfDay(h){ if(h>=5&&h<12)return 'בבוקר'; if(h>=12&&h<18)return 'אחר הצהריים'; if(h>=18&&h<22)return 'בערב'; return 'בלילה'; }
/* מידע שבת מברכים עבור תאריך נתון (מסתכל על השבת הקרובה/נוכחית) */
function hc_mevarchim(gy,gm,gd){
  var rd=hc_gregToRD(gy,gm,gd), wd=hc_wd(rd);
  var satRD=(wd===6)?rd:rd+(6-wd);
  var sh=hc_fromRD(satRD);
  var nm=hc_nextMonth(sh.year,sh.month);
  if(nm.month===7)return null; /* אין מברכים לפני תשרי */
  var firstNext=hc_toRD(nm.year,nm.month,1);
  var outLen=hc_monthLen(sh.year,sh.month);
  var rcFirst=(outLen===30)?firstNext-1:firstNext;
  var gap=rcFirst-satRD;
  if(gap<1||gap>7)return null;
  var rcDays=(outLen===30)?[hc_wd(rcFirst),hc_wd(rcFirst+1)]:[hc_wd(firstNext)];
  /* "מרחשון" רק בהכרזת שבת מברכים ובמולד — כך נהוג לומר.
     בתצוגת התאריך היומי ובראש חודש נשאר "חשוון". */
  var mn=hc_monthName(nm.year,nm.month);
  if(mn==='חשוון') mn='מרחשון';
  return {monthName:mn,rcWeekdays:rcDays,molad:hc_molad(nm.year,nm.month)};
}
/* טקסטים מעוצבים */
function hc_mevTitle(){ return 'השבת שבת מברכים'; }
function hc_mevRosh(info){
  var days=info.rcWeekdays.map(function(w){return 'יום '+HC_DOW[w];});
  var when=(days.length>1)?('בימים '+info.rcWeekdays.map(function(w){return HC_DOW[w];}).join(' ו')):('ביום '+HC_DOW[info.rcWeekdays[0]]);
  return 'ראש חודש '+info.monthName+' יחול '+when;
}
function hc_mevMolad(info){
  var m=info.molad;
  return 'המולד: יום '+HC_DOW[m.civWk]+', '+m.h24+':'+String(m.min).padStart(2,'0')+' '+hc_partOfDay(m.h24)+' ו-'+m.chalakim+' חלקים';
}
/* האם היום ראש חודש? מחזיר טקסט להצגה, או '' אם לא */

  /* ---- מספרים עבריים ---- */
  var ONES=['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  var TENS=['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  var HUND=['','ק','ר','ש','ת'];

  function heNum(n){
    if(n<=0) return '';
    var s='';
    while(n>=400){ s+='ת'; n-=400; }
    if(n>=100){ s+=HUND[Math.floor(n/100)]; n%=100; }
    if(n===15) return s+'ט״ו';
    if(n===16) return s+'ט״ז';
    if(n>=10){ s+=TENS[Math.floor(n/10)]; n%=10; }
    if(n>0) s+=ONES[n];
    if(s.length===1) return s+'׳';
    return s.slice(0,-1)+'״'+s.slice(-1);
  }

  function heYear(y){
    var t=y%1000;                 /* 5787 -> 787, מוצג בלי האלף */
    return heNum(t);
  }

  /* ---- המרות ---- */
  function parseISO(v){
    if(!v) return null;
    var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    if(!m) return null;
    return {y:+m[1], m:+m[2], d:+m[3]};
  }
  function iso(y,m,d){
    return y+'-'+(m<10?'0':'')+m+'-'+(d<10?'0':'')+d;
  }

  /* תאריך עברי מלא כטקסט */
  function toHeb(v){
    var g=parseISO(v); if(!g) return '';
    var h=hc_fromRD(hc_gregToRD(g.y,g.m,g.d));
    return heNum(h.day)+' ב'+hc_monthName(h.year,h.month)+' '+heYear(h.year);
  }
  function hebParts(y,m,d){
    var h=hc_fromRD(hc_gregToRD(y,m,d));
    return {y:h.year, m:h.month, d:h.day,
            name:hc_monthName(h.year,h.month),
            dayHe:heNum(h.day), yearHe:heYear(h.year)};
  }

  var DOW=['א','ב','ג','ד','ה','ו','ש'];
  var GMON=['ינואר','פברואר','מרץ','אפריל','מאי','יוני',
            'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

  function css(){
    if(document.getElementById('nhp-css')) return;
    var st=document.createElement('style'); st.id='nhp-css';
    st.textContent=[
      '.nhp-lbl{font-size:12px;color:#8b949e;margin-top:4px;direction:rtl}',
      '.nhp-lbl b{color:#ffcc00;font-weight:700}',
      '.nhp-btn{background:#21262d;border:1px solid #30363d;color:#ffcc00;border-radius:6px;',
        'padding:4px 9px;font:700 12px Heebo,Assistant,Arial,sans-serif;cursor:pointer;margin-inline-start:6px}',
      '.nhp-pop{position:fixed;z-index:2147483200;background:#161b22;border:1px solid #30363d;',
        'border-radius:12px;padding:12px;direction:rtl;box-shadow:0 12px 40px rgba(0,0,0,.6);',
        'font-family:Heebo,Assistant,Arial,sans-serif;width:min(94vw,330px)}',
      '.nhp-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}',
      '.nhp-hd button{background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:6px;',
        'width:30px;height:30px;font-size:16px;cursor:pointer}',
      '.nhp-ttl{text-align:center;line-height:1.3}',
      '.nhp-ttl .g{font-weight:800;color:#e6edf3;font-size:14px}',
      '.nhp-ttl .h{color:#ffcc00;font-size:12px}',
      '.nhp-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}',
      '.nhp-dow{text-align:center;font-size:11px;color:#8b949e;padding:3px 0}',
      '.nhp-c{aspect-ratio:1;border:1px solid transparent;border-radius:7px;background:#0d1117;',
        'display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;line-height:1}',
      '.nhp-c:hover{border-color:#30363d}',
      '.nhp-c .g{font-size:13px;color:#e6edf3;font-weight:700}',
      '.nhp-c .h{font-size:9px;color:#8b949e;margin-top:1px}',
      '.nhp-c.sat{background:#121a2a}',
      '.nhp-c.today{border-color:#3fb950}',
      '.nhp-c.on{background:#ffcc00}.nhp-c.on .g{color:#161b22}.nhp-c.on .h{color:#5a4700}',
      '.nhp-c.out{opacity:.28;cursor:default}',
      '.nhp-ft{display:flex;gap:8px;margin-top:10px}',
      '.nhp-ft button{flex:1;background:#21262d;border:1px solid #30363d;color:#e6edf3;',
        'border-radius:7px;padding:7px;font:700 12px Heebo;cursor:pointer}'
    ].join('');
    document.head.appendChild(st);
  }

  function close(){
    var p=document.getElementById('nhp-pop');
    if(p) p.remove();
    document.removeEventListener('mousedown', outside, true);
  }
  function outside(e){
    var p=document.getElementById('nhp-pop');
    if(p && !p.contains(e.target)) close();
  }

  /* ---- ציור הלוח ---- */
  function draw(pop, input, vy, vm){
    var sel=parseISO(input.value);
    var t=new Date();
    var first=new Date(vy, vm-1, 1);
    var start=first.getDay();
    var dim=new Date(vy, vm, 0).getDate();
    var prevDim=new Date(vy, vm-1, 0).getDate();

    var hf=hebParts(vy,vm,1), hl=hebParts(vy,vm,dim);
    var hTtl = (hf.name===hl.name) ? (hf.name+' '+hf.yearHe)
                                   : (hf.name+' – '+hl.name+' '+hl.yearHe);

    var cells='';
    for(var i=0;i<start;i++){
      cells+='<div class="nhp-c out"><span class="g">'+(prevDim-start+i+1)+'</span></div>';
    }
    for(var d=1; d<=dim; d++){
      var h=hebParts(vy,vm,d);
      var dow=new Date(vy,vm-1,d).getDay();
      var cls='nhp-c'+(dow===6?' sat':'');
      if(t.getFullYear()===vy && t.getMonth()===vm-1 && t.getDate()===d) cls+=' today';
      if(sel && sel.y===vy && sel.m===vm && sel.d===d) cls+=' on';
      cells+='<div class="'+cls+'" data-d="'+d+'">'+
             '<span class="g">'+d+'</span><span class="h">'+h.dayHe+'</span></div>';
    }
    var tail=(7-((start+dim)%7))%7;
    for(var k=1;k<=tail;k++) cells+='<div class="nhp-c out"><span class="g">'+k+'</span></div>';

    pop.innerHTML=
      '<div class="nhp-hd">'+
        '<button data-nav="-1">‹</button>'+
        '<div class="nhp-ttl"><div class="g">'+GMON[vm-1]+' '+vy+'</div>'+
          '<div class="h">'+hTtl+'</div></div>'+
        '<button data-nav="1">›</button></div>'+
      '<div class="nhp-grid">'+
        DOW.map(function(x){return '<div class="nhp-dow">'+x+'</div>';}).join('')+
        cells+'</div>'+
      '<div class="nhp-ft"><button data-act="today">היום</button>'+
        '<button data-act="clear">נקה</button>'+
        '<button data-act="close">סגור</button></div>';

    pop.onclick=function(e){
      var nav=e.target.closest('[data-nav]');
      if(nav){
        var n=+nav.getAttribute('data-nav');
        var m2=vm+n, y2=vy;
        if(m2<1){ m2=12; y2--; } if(m2>12){ m2=1; y2++; }
        draw(pop, input, y2, m2); return;
      }
      var act=e.target.closest('[data-act]');
      if(act){
        var a=act.getAttribute('data-act');
        if(a==='close'){ close(); return; }
        if(a==='clear'){ input.value=''; fire(input); close(); return; }
        if(a==='today'){
          var n2=new Date();
          input.value=iso(n2.getFullYear(), n2.getMonth()+1, n2.getDate());
          fire(input); close(); return;
        }
      }
      var c=e.target.closest('.nhp-c[data-d]');
      if(c){
        input.value=iso(vy, vm, +c.getAttribute('data-d'));
        fire(input); close();
      }
    };
  }

  function fire(input){
    try{ input.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){}
    try{ input.dispatchEvent(new Event('input',{bubbles:true})); }catch(e){}
    refresh(input);
  }

  function open(input){
    css(); close();
    var pop=document.createElement('div');
    pop.className='nhp-pop'; pop.id='nhp-pop';
    document.body.appendChild(pop);

    var v=parseISO(input.value) || (function(){
      var n=new Date(); return {y:n.getFullYear(), m:n.getMonth()+1, d:n.getDate()};
    })();
    draw(pop, input, v.y, v.m);

    var r=input.getBoundingClientRect();
    var top=r.bottom+6, h=pop.offsetHeight;
    if(top+h > window.innerHeight-8) top=Math.max(8, r.top-h-6);
    var left=Math.min(Math.max(8, r.right-pop.offsetWidth), window.innerWidth-pop.offsetWidth-8);
    pop.style.top=top+'px'; pop.style.left=left+'px';

    setTimeout(function(){ document.addEventListener('mousedown', outside, true); }, 0);
  }

  /* התווית מתחת לשדה */
  function refresh(input){
    var lbl=input.__nhpLbl;
    if(!lbl) return;
    var h=toHeb(input.value);
    lbl.innerHTML = h ? ('<b>'+h+'</b>') : '';
  }

  function attach(input){
    if(!input || input.__nhp) return;
    input.__nhp=true;
    css();

    var lbl=document.createElement('div');
    lbl.className='nhp-lbl';
    input.__nhpLbl=lbl;

    var btn=document.createElement('button');
    btn.type='button'; btn.className='nhp-btn'; btn.textContent='לוח עברי';
    btn.onclick=function(e){ e.preventDefault(); e.stopPropagation(); open(input); };

    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;align-items:center;flex-wrap:wrap';
    input.parentNode.insertBefore(wrap, input.nextSibling);
    wrap.appendChild(btn);

    input.parentNode.insertBefore(lbl, wrap.nextSibling);
    input.addEventListener('change', function(){ refresh(input); });
    refresh(input);
  }

  function attachAll(rootEl){
    var r=rootEl||document;
    Array.prototype.forEach.call(r.querySelectorAll('input[type="date"]'), attach);
  }

  root.NatiHebPicker = {
    attach: attach,
    attachAll: attachAll,
    toHeb: toHeb,
    hebParts: hebParts,
    heNum: heNum,
    VERSION: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
