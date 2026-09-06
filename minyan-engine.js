/* =====================================================================
   נתי SAFE — מנוע המניינים  ·  v1.0
   ---------------------------------------------------------------------
   ממיר את לוח המניינים שבמסד לשעות קונקרטיות ליום נתון.
   שלושה מצבים:
     fixed    — שעה קבועה
     interval — כל X דקות, בין שני עוגנים (שעה קבועה או זמן הלכתי)
     relative — יחסית לזמן הלכתי, עם היסט בדקות

   תלוי במנוע הזמנים (NatiZmanim / zmEngineTimes) לפתרון העוגנים.
   ===================================================================== */
(function (root) {
  'use strict';

  /* מיפוי שם עוגן -> מפתח במנוע הזמנים */
  var ZKEY = {
    alot: 'alotHashachar', netz: 'netz', szks: 'sofZmanShmaGRA',
    szt: 'sofZmanTfilaGRA', chatzot: 'chatzot', mincha_gedola: 'minchaGedola',
    mincha_ketana: 'minchaKetana', plag: 'plagHamincha', shkia: 'shkia',
    tzeit: 'tzeitHakochavim', rt: 'tzeitRT', candle: 'candleLighting',
    chatzot_layla: 'chatzotLayla'
  };

  function toMin(t) {                     /* "HH:MM[:SS]" -> דקות */
    if (t == null) return null;
    var p = String(t).split(':');
    return (+p[0]) * 60 + (+p[1] || 0) + (+p[2] || 0) / 60;
  }
  function fmt(m) {
    if (m == null || isNaN(m)) return '--:--';
    var h = Math.floor(m / 60) % 24, mi = Math.floor(m) % 60;
    if (h < 0) h += 24; if (mi < 0) mi += 60;
    return (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi;
  }

  /* פותר עוגן: שעה קבועה, או זמן הלכתי + היסט */
  function anchor(z, fixedTime, zmanKey, offset) {
    if (zmanKey) {
      var k = ZKEY[zmanKey];
      if (!k || z[k] == null || isNaN(z[k])) return null;
      return z[k] + (+offset || 0);
    }
    return toMin(fixedTime);
  }

  /* האם השורה חלה על היום הזה */
  function appliesToday(row, date, ctx) {
    if (row.active === false) return false;
    var dow = date.getDay();
    if (Array.isArray(row.days_of_week) && row.days_of_week.length &&
        row.days_of_week.indexOf(dow) === -1) return false;
    var iso = date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
    if (row.date_from && iso < row.date_from) return false;
    if (row.date_to   && iso > row.date_to)   return false;
    if (row.hebrew_only && ctx) {
      var o = row.hebrew_only;
      if (o === 'weekday'      && (ctx.isShabbat || ctx.isYomTov)) return false;
      if (o === 'shabbat'      && !ctx.isShabbat) return false;
      if (o === 'yomtov'       && !ctx.isYomTov)  return false;
      if (o === 'rosh_chodesh' && !ctx.isRoshChodesh) return false;
    }
    return true;
  }

  /**
   * ממיר שורות לוח לשעות בפועל.
   * rows  — שורות prayer_times
   * z     — תוצאת מנוע הזמנים ליום (בדקות מחצות)
   * date  — תאריך
   * ctx   — {isShabbat,isYomTov,isRoshChodesh}
   * מחזיר [{prayer,label,room_id,minutes,time,rolling}]
   */
  function resolve(rows, z, date, ctx) {
    var out = [];
    (rows || []).forEach(function (r) {
      if (!appliesToday(r, date, ctx)) return;

      if (r.mode === 'fixed') {
        var m = toMin(r.fixed_time);
        if (m != null) out.push(mk(r, m));

      } else if (r.mode === 'relative') {
        var v = anchor(z, null, r.rel_zman, r.rel_offset_min);
        if (v != null) out.push(mk(r, v));

      } else if (r.mode === 'interval') {
        var s = anchor(z, r.interval_start, r.interval_start_zman, r.interval_start_offset);
        var e = anchor(z, r.interval_end,   r.interval_end_zman,   r.interval_end_offset);
        var step = +r.interval_min || 0;
        if (s == null || e == null || step <= 0) return;
        /* חלון שחוצה את חצות הלילה — למשל מעריב מצאת הכוכבים עד חצות.
           בלי זה הסיום קטן מההתחלה והשורה נעלמת בשקט. */
        if (e <= s) e += 1440;
        if (e - s > 1440) return;
        /* rolling: המניינים רצופים ולא מוכרזים בשעה מדויקת.
           המסך יחליט אם להציג את הרשימה או רק "רצוף עד ..." */
        for (var t = s; t <= e + 0.01; t += step) {
          var row = mk(r, t); row.rolling = true; row.window = [s, e];
          out.push(row);
        }
      }
    });
    out.sort(function (a, b) { return a.minutes - b.minutes; });
    /* כפילויות: עוגן הלכתי ושעה קבועה יכולים ליפול על אותה דקה
       (למשל ערבית בצאת הכוכבים 20:30 ושורה קבועה 20:30 בקיץ).
       על המסך זה נראה כמו תקלה — משאירים אחת. */
    var seen = {}, uniq = [];
    out.forEach(function (x) {
      var k = (x.room_id || '-') + '|' + x.prayer + '|' + Math.round(x.minutes);
      if (seen[k]) return;
      seen[k] = 1; uniq.push(x);
    });
    return uniq;
  }

  function mk(r, m) {
    return {
      id: r.id, room_id: r.room_id, prayer: r.prayer,
      label: r.label || null, minutes: m, time: fmt(m),
      rolling: false, sort_order: r.sort_order || 0
    };
  }

  /** המניין הבא מרגע נתון (בדקות מחצות). מחזיר null אם הכל עבר. */
  function next(list, nowMin) {
    for (var i = 0; i < list.length; i++) if (list[i].minutes > nowMin) return list[i];
    return null;
  }

  /** קיבוץ לפי תפילה, לתצוגת רשימה */
  function byPrayer(list) {
    var g = {};
    list.forEach(function (x) { (g[x.prayer] = g[x.prayer] || []).push(x); });
    return g;
  }

  /** טקסט ספירה לאחור: "בעוד 7 דקות" / "בעוד 1:12 שעות" */
  function countdown(targetMin, nowMin) {
    var d = Math.round(targetMin - nowMin);
    if (d < 0) return null;
    if (d === 0) return 'עכשיו';
    if (d < 60) return 'בעוד ' + d + ' דק\'';
    var h = Math.floor(d / 60), m = d % 60;
    return 'בעוד ' + h + ':' + (m < 10 ? '0' : '') + m + ' שע\'';
  }

  var API = { resolve: resolve, next: next, byPrayer: byPrayer,
              countdown: countdown, fmt: fmt, toMin: toMin, ZKEY: ZKEY, VERSION: '1.0' };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.NatiMinyan = API;
})(typeof window !== 'undefined' ? window : globalThis);
