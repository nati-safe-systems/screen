/* =====================================================================
   נתי SAFE — בחירת זמני היום שמוצגים במסך · NatiZmSel v1.0 · 18.10.26
   ---------------------------------------------------------------------
   כל זמני הלוח. באדמין (ובפאנל הלקוח, אם ניתנה הרשאה) מסמנים לכל מסך
   אילו זמנים יוצגו — נשמר ב-display_config.zm_show (רשימת מפתחות).
   בלי בחירה — כל מסך מציג את מה שהציג עד היום.
   NatiZmSel.fit(el) מקטין את הטקסט עד שהכל נכנס, בלי חיתוך.
   ===================================================================== */
(function(root){
  var ALL=[
    {k:"alot",    l:"עלות השחר",        z:"alotHashachar",   f:"alot"},
    {k:"mish",    l:"משיכיר",            z:"misheyakir",      f:"alot"},
    {k:"netz",    l:"נץ החמה",           z:"netz",            f:"sunrise"},
    {k:"szM",     l:'סו"ז ק"ש מג"א',     z:"sofZmanShmaMGA",  f:"szM", crit:1},
    {k:"szG",     l:'סו"ז ק"ש גר"א',     z:"sofZmanShmaGRA",  f:"szG", crit:1},
    {k:"tfM",     l:'סו"ז תפילה מג"א',   z:"sofZmanTfilaMGA", f:"tfG", crit:1},
    {k:"tfG",     l:'סו"ז תפילה גר"א',   z:"sofZmanTfilaGRA", f:"tfG", crit:1},
    {k:"chatzot", l:"חצות היום",         z:"chatzot",         f:"noon", crit:1},
    {k:"mg",      l:"מנחה גדולה",        z:"minchaGedola",    f:"mincha"},
    {k:"mk",      l:"מנחה קטנה",         z:"minchaKetana",    f:"mincha"},
    {k:"plag",    l:"פלג המנחה",         z:"plagHamincha",    f:"plag"},
    {k:"shkia",   l:"שקיעה",             z:"shkia",           f:"shkia", crit:1},
    {k:"tz",      l:"צאת הכוכבים",       z:"tzeitHakochavim", f:"tz", crit:1},
    {k:"rt",      l:"רבינו תם",          z:"tzeitRT",         f:"rt"},
    {k:"chl",     l:"חצות הלילה",        z:"chatzotLayla",    f:"szG", crit:1}
  ];
  var DEF={
    main:   ["alot","netz","szM","szG","tfG","chatzot","mg","plag","shkia","tz","rt"],
    cafe:   ["szM","szG","tfG","chatzot","shkia","tz"],
    mikveh: ["szM","szG","tfG","chatzot","shkia","tz"],
    building:["alot","netz","szM","szG","chatzot","mg","shkia","tz","rt"]
  };
  function keys(def){
    var s=root.NSF_ZM_SHOW;
    if(Array.isArray(s) && s.length){
      /* תמיד בסדר הלוח, לא בסדר הסימון */
      return ALL.map(function(x){ return x.k; }).filter(function(k){ return s.indexOf(k)>-1; });
    }
    return (DEF[def]||def||DEF.main).slice();
  }
  /* מחזיר [תווית, ערך בדקות, מפתח עיגול, מפתח, קריטי] לפי מנוע הזמנים של בתי הכנסת */
  function fromZ(Z, def){
    var by={}; ALL.forEach(function(x){ by[x.k]=x; });
    return keys(def).map(function(k){
      var d=by[k]; if(!d) return null;
      var v=Z ? Z[d.z] : NaN;
      return (typeof v==="number" && isFinite(v)) ? [d.l, v, d.f, k, !!d.crit] : null;
    }).filter(Boolean);
  }
  /* הקטנת הטקסט עד שהכל נכנס. משתמשים ב-var(--zms) ב-CSS של המסך. */
  function fit(el, axis, min){
    if(!el) return;
    var over=function(){ return axis==="x" ? el.scrollWidth>el.clientWidth+1 : el.scrollHeight>el.clientHeight+1; };
    var key=el.children.length+"|"+el.clientWidth+"x"+el.clientHeight;
    if(el.__zmk!==key){ el.__zmk=key; el.__zms=1; }
    var s=el.__zms||1, n=0;
    el.style.setProperty("--zms", s);
    while(over() && s>(min||0.45) && n++<16){ s=Math.round((s-0.05)*100)/100; el.style.setProperty("--zms", s); }
    el.__zms=s;
  }
  /* קורא את הבחירה מהגדרות המסך */
  function setFrom(dc){ try{ root.NSF_ZM_SHOW = (dc && Array.isArray(dc.zm_show) && dc.zm_show.length) ? dc.zm_show.slice() : null; }catch(e){} }
  root.NatiZmSel={ALL:ALL, DEF:DEF, keys:keys, fromZ:fromZ, fit:fit, setFrom:setFrom, VERSION:"1.0"};
})(window);
