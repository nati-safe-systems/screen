/* =====================================================================
   נתי SAFE — תאריך עברי באותיות  ·  v1.0
   ---------------------------------------------------------------------
   Intl מחזיר "21 באלול 5786". בלוח עברי כותבים "כ״א באלול תשפ״ו".
   המודול הזה עושה את ההמרה, ומשמש את כל המסכים כדי שלא תהיה
   גרסה אחרת בכל קובץ.

   ההמרה עצמה נשענת על לוח השנה של Intl — מדויק ונתמך בכל דפדפן —
   ורק העיצוב לאותיות נעשה כאן.
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

  /** חלקי התאריך העברי לפי Intl */
  function parts(date) {
    var f = new Intl.DateTimeFormat('he-u-ca-hebrew',
      { day: 'numeric', month: 'long', year: 'numeric' });
    var o = {}, a = f.formatToParts(date || new Date());
    for (var i = 0; i < a.length; i++) o[a[i].type] = a[i].value;
    return {
      day:   parseInt(String(o.day).replace(/\D/g, ''), 10),
      month: o.month,
      year:  parseInt(String(o.year).replace(/\D/g, ''), 10)
    };
  }

  var DOW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  /**
   * תאריך עברי מעוצב.
   * opts.weekday  — להוסיף "יום שני," בהתחלה     (ברירת מחדל: false)
   * opts.year     — להוסיף את השנה                (ברירת מחדל: true)
   * opts.fullYear — "ה׳תשפ״ו" במקום "תשפ״ו"       (ברירת מחדל: false)
   * opts.prefix   — "באלול" עם בי״ת              (ברירת מחדל: true)
   */
  function format(date, opts) {
    date = date || new Date();
    opts = opts || {};
    /* היום העברי מתחיל בשקיעה. אם נמסרה שעת שקיעה ועברנו אותה —
       מציגים כבר את התאריך של מחר, כמו בלוח. */
    if (opts.shkiaMinutes != null) {
      var nowMin = date.getHours() * 60 + date.getMinutes();
      if (nowMin >= opts.shkiaMinutes) date = new Date(date.getTime() + 86400000);
    }
    var p = parts(date);
    var d = gematria(p.day);
    var m = p.month;
    if (opts.prefix !== false) {
      // "אלול" -> "באלול" ; "אדר א׳" -> "באדר א׳" ; "תשרי" -> "בתשרי"
      m = 'ב' + m;
    }
    var s = d + ' ' + m;

    if (opts.year !== false) {
      var y = gematria(p.year % 1000);
      if (opts.fullYear) y = 'ה' + '\u05F3' + gematria(p.year % 1000);
      s += ' ' + y;
    }
    if (opts.weekday) {
      var wd = date.getDay();
      if (opts.shkiaMinutes != null) wd = date.getDay();
      s = (wd === 6 ? 'שבת קודש' : 'יום ' + DOW[wd]) + ', ' + s;
    }
    return s;
  }

  var API = { format: format, gematria: gematria, parts: parts, DOW: DOW, VERSION: '1.0' };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.NatiHebDate = API;
})(typeof window !== 'undefined' ? window : globalThis);
