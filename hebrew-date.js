/* =====================================================================
   נתי SAFE — תאריך עברי באותיות  ·  v1.3
   ---------------------------------------------------------------------
   Intl מחזיר "21 באלול 5786". בלוח עברי כותבים "כ״א באלול תשפ״ו".
   המודול הזה עושה את ההמרה, ומשמש את כל המסכים כדי שלא תהיה
   גרסה אחרת בכל קובץ.

   ההמרה עצמה נשענת על לוח השנה של Intl — מדויק ונתמך בכל דפדפן —
   ורק העיצוב לאותיות נעשה כאן.

   ---------------------------------------------------------------------
   שינויים ב-1.1 / 1.2 (משפיעים גם על דלתות בית הכנסת וגם על הבניינים):

   1. תיקון קפיצת יום במעבר שעון.
      1.0 חישב את "מחר" בתור date.getTime() + 86400000. בלילה של מעבר
      לשעון קיץ נעלמת שעה, ולכן 24 שעות אמיתיות שוות 25 שעות שעון
      והתאריך קפץ יומיים. נבדק: 25.3.27 23:30 הציג "אור לי״ח" במקום י״ז.
      עכשיו "מחר" מחושב בלוח שנה ומעוגן ב-12:00, בלי תלות בשעון.

   2. הגנה על יחידות shkiaMinutes.
      מנוע index.html מחזיר שעות עשרוניות, מנוע בית הכנסת מחזיר דקות.
      1.0 השווה את הערך ישירות לדקות מחצות בלי בדיקה — ערך עשרוני כמו
      18.9 גרם ל"אור ל..." להופיע כבר מ-00:19 ולהישאר כל היום, בשקט.
      שקיעה בדקות היא תמיד 900-1250 ולעולם לא מתחת ל-24, ולכן ערך קטן
      מ-24 מזוהה כשעות עשרוניות ומומר. אפשר גם למסור opts.shkiaHours
      במפורש. ערך לא חוקי מבוטל ונרשם ל-console.

   3. ה-Intl formatter נשמר במקום להיבנות מחדש בכל קריאה.
      נמדד: פי 20 מהיר יותר. רלוונטי למסך שרץ ברצף.

   4. opts.marcheshvan — "מרחשון" במקום "חשוון". כבוי כברירת מחדל:
      התצוגה היומית אומרת "חשוון", ורק הכרזת שבת מברכים והמולד
      אומרות "מרחשון". זהה להתנהגות ב-index.html.

   5. dayOnly נחשף ב-API (היה מוגדר ולא בשימוש).

   ה-API תואם אחורה במלואו.
   ===================================================================== */
(function (root) {
  'use strict';

  var ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  var TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  var HUND = ['', 'ק', 'ר', 'ש', 'ת'];

  /** מספר -> גימטריה. מטפל ב-15 ו-16 (טו/טז) ובמאות מעל 400. */
  function gematria(n, punctuate) {
    n = Math.floor(+n);
    if (!n || n < 0) return '';
    var s = '';
    while (n >= 400) { s += 'ת'; n -= 400; }
    if (n >= 100) { s += HUND[Math.floor(n / 100)]; n %= 100; }
    if (n === 15) s += 'טו';
    else if (n === 16) s += 'טז';
    else {
      if (n >= 10) { s += TENS[Math.floor(n / 10)]; n %= 10; }
      if (n > 0) s += ONES[n];
    }
    if (punctuate === false) return s;
    if (s.length === 1) return s + '\u05F3';               // גרש
    return s.slice(0, -1) + '\u05F4' + s.slice(-1);        // גרשיים
  }

  /* ---------- Intl formatter שמור ---------- */
  var _fmt = null;
  function formatter() {
    if (!_fmt) {
      _fmt = new Intl.DateTimeFormat('he-u-ca-hebrew',
        { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return _fmt;
  }

  /** חלקי התאריך העברי לפי Intl */
  function parts(date) {
    var o = {}, a = formatter().formatToParts(date || new Date());
    for (var i = 0; i < a.length; i++) o[a[i].type] = a[i].value;
    return {
      day:   parseInt(String(o.day).replace(/\D/g, ''), 10),
      month: o.month,
      year:  parseInt(String(o.year).replace(/\D/g, ''), 10)
    };
  }

  var DOW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  /* ---------- מחר, בלי תלות בשעון ----------
     מוסיפים יום בלוח השנה ומעגנים ב-12:00. שעה 12 רחוקה מספיק משני
     כיווני המעבר (02:00/03:00) כך שאף מעבר שעון לא מזיז את היום. */
  function nextDay(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
      12, 0, 0, 0
    );
  }

  /* ---------- נרמול שעת השקיעה לדקות מחצות ---------- */
  var _warned = {};
  function warnOnce(key, msg) {
    if (_warned[key]) return;
    _warned[key] = true;
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[NatiHebDate] ' + msg);
    }
  }

  function normalizeShkia(opts) {
    var v;

    if (opts.shkiaHours != null) {
      v = +opts.shkiaHours;
      if (!isFinite(v) || v < 0 || v >= 24) {
        warnOnce('hours', 'shkiaHours לא חוקי: ' + opts.shkiaHours + ' — התעלמות');
        return null;
      }
      return Math.round(v * 60);
    }

    if (opts.shkiaMinutes == null) return null;

    v = +opts.shkiaMinutes;
    if (!isFinite(v) || v < 0) {
      warnOnce('bad', 'shkiaMinutes לא חוקי: ' + opts.shkiaMinutes + ' — התעלמות');
      return null;
    }

    /* שקיעה בדקות מחצות היא תמיד הרבה מעל 24.
       ערך מתחת ל-24 הוא שעות עשרוניות שהגיעו מהמנוע השני. */
    if (v < 24) {
      warnOnce('unit', 'shkiaMinutes קיבל ' + v + ' — זוהה כשעות עשרוניות והומר ל-' +
                       Math.round(v * 60) + ' דקות. עדיף למסור shkiaHours במפורש.');
      return Math.round(v * 60);
    }

    if (v >= 1440) {
      warnOnce('range', 'shkiaMinutes מחוץ לטווח: ' + v + ' — התעלמות');
      return null;
    }

    return Math.round(v);
  }

  /* ---------- שם חודש ---------- */
  function monthName(raw, opts) {
    /* ברירת המחדל היא "חשוון", כמו בתצוגה היומית של המסכים.
       marcheshvan:true נותן "מרחשון" — לשימוש בהכרזת שבת מברכים
       ובנוסח המולד, שם כך נהוג לומר. */
    if (raw !== 'חשוון') return raw;
    return (opts && opts.marcheshvan === true) ? 'מרחשון' : raw;
  }

  /* שם היום בלבד, בלי שנה — לשימוש ב"אור ל..." */
  function dayOnly(date, sameMonth, opts) {
    var p = parts(date);
    var d = gematria(p.day);
    return sameMonth ? d : d + ' ' + 'ב' + monthName(p.month, opts);
  }

  /**
   * תאריך עברי מעוצב.
   * opts.weekday      — להוסיף "יום שני," בהתחלה          (ברירת מחדל: false)
   * opts.year         — להוסיף את השנה                     (ברירת מחדל: true)
   * opts.fullYear     — "ה׳תשפ״ז" במקום "תשפ״ז"           (ברירת מחדל: false)
   * opts.prefix       — "באלול" עם בי״ת                    (ברירת מחדל: true)
   * opts.shkiaMinutes — שעת השקיעה בדקות מחצות; מפעיל "אור ל..."
   * opts.shkiaHours   — אותו דבר בשעות עשרוניות (עדיף כשזה המקור)
   * opts.dual         — false כדי לבטל את "אור ל..."       (ברירת מחדל: true)
   * opts.marcheshvan  — true עבור "מרחשון" (שבת מברכים/מולד)  (ברירת מחדל: חשוון)
   */
  function format(date, opts) {
    date = date || new Date();
    opts = opts || {};

    /* היום העברי נכנס בשקיעה, אבל התצוגה מתחלפת בחצות.
       בין השקיעה לחצות מוצגים שניהם: "כ״א באלול · אור לכ״ב".
       אחרי חצות נשאר התאריך החדש בלבד. */
    var evening = false, tomorrow = null;
    if (opts.dual !== false) {
      var shkia = normalizeShkia(opts);
      if (shkia != null) {
        var nowMin = date.getHours() * 60 + date.getMinutes();
        if (nowMin >= shkia) {
          evening = true;
          tomorrow = nextDay(date);
        }
      }
    }

    var p = parts(date);
    var d = gematria(p.day);
    var m = monthName(p.month, opts);
    if (opts.prefix !== false) {
      // "אלול" -> "באלול" ; "אדר א׳" -> "באדר א׳" ; "תשרי" -> "בתשרי"
      m = 'ב' + m;
    }
    var s = d + ' ' + m;

    if (opts.year !== false) {
      var y = gematria(p.year % 1000);
      if (opts.fullYear) y = 'ה' + '\u05F3' + y;
      s += ' ' + y;
    }

    /* "אור ל..." — אם החודש זהה מציגים רק את היום */
    if (evening && tomorrow) {
      var pt = parts(tomorrow);
      var nxt = (pt.month === p.month)
        ? gematria(pt.day)
        : gematria(pt.day) + ' ' + 'ב' + monthName(pt.month, opts);
      s += ' \u00b7 ' + 'אור ל' + nxt;
    }

    if (opts.weekday) {
      var wd = date.getDay();
      s = (wd === 6 ? 'שבת קודש' : 'יום ' + DOW[wd]) + ', ' + s;
    }
    return s;
  }

  var API = {
    format: format,
    gematria: gematria,
    parts: parts,
    dayOnly: dayOnly,
    nextDay: nextDay,
    DOW: DOW,
    VERSION: '1.3'
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.NatiHebDate = API;
})(typeof window !== 'undefined' ? window : globalThis);
