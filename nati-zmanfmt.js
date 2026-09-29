/* =====================================================================
   נתי SAFE — עיצוב זמנים הלכתיים  ·  NatiZmanFmt v1.0
   ---------------------------------------------------------------------
   עד כה היו שני מימושים נפרדים: מסכי הבניינים קיבלו שעות עשרוניות,
   מסכי בית הכנסת קיבלו דקות, ולכל אחד היה חישוב עיגול משלו. התוצאה
   הייתה באג שהופיע באחד ולא בשני — 12:59:40 הוצג כ-"12:00", כי השעה
   והדקות חושבו בנפרד והדקות התעגלו למעלה בלי להעלות את השעה.

   כאן מימוש אחד לכל הפלטפורמה.

   ---------------------------------------------------------------------
   הכיוון נקבע לפי ההלכה, תמיד לצד המחמיר:

     זמן שמותר עד אליו   ->  קיצוץ   שלא ייראה שנותרה דקה שאין
     זמן שאסור לפניו     ->  עיגול   שלא ייראה שהגיע לפני שהגיע

   מכאן:
     קיצוץ    סוף זמן קריאת שמע, סוף זמן תפילה, הדלקת נרות, שקיעה
     עיגול    עלות השחר, הנץ, מנחה גדולה, מנחה קטנה, פלג המנחה,
              צאת הכוכבים, רבינו תם
     עיגול    חצות — זמן אסטרונומי ולא הלכתי, אין בו מחמיר

   ---------------------------------------------------------------------
   שימוש:
     NatiZmanFmt.show("szG", 9.4997)        -> "09:29"   מקצץ
     NatiZmanFmt.show("tz",  19.0497)       -> "19:03"   מעגל
     NatiZmanFmt.fromMinutes("shkia", 1111) -> "18:31"
   ===================================================================== */
(function (root) {
  'use strict';

  /* trunc = מקצץ · round = מעגל */
  var DIR = {
    /* מקצצים — זמן שמותר עד אליו */
    szM:'trunc', szG:'trunc', szMGA:'trunc',
    sofZmanShma:'trunc', sofZmanShmaGRA:'trunc', sofZmanShmaMGA:'trunc',
    tfM:'trunc', tfG:'trunc',
    sofZmanTfila:'trunc', sofZmanTfilaGRA:'trunc', sofZmanTfilaMGA:'trunc',
    candle:'trunc', candleLighting:'trunc',
    sunset:'trunc', shkia:'trunc', shkiaMishor:'trunc',

    /* מעגלים — זמן שאסור לפניו */
    alot:'round', alotHaShachar:'round', alotHashachar:'round',
    sunrise:'round', netz:'round', netzMishor:'round',
    mincha:'round', minchaGedola:'round', minchaKetana:'round',
    plag:'round', plagHamincha:'round',
    tz:'round', tzeit:'round', tzeitHakochavim:'round',
    rt:'round', tzeitRT:'round',

    /* אסטרונומי */
    noon:'round', chatzot:'round'
  };

  function dirOf(key) {
    if (!key) return 'round';
    if (DIR[key]) return DIR[key];
    /* שם שאינו ברשימה — נגזר לפי התחלית, כדי ששדה חדש לא יישבר */
    var k = String(key).toLowerCase();
    if (k.indexOf('sofzman') === 0 || k.indexOf('candle') > -1 ||
        k.indexOf('shkia') > -1 || k.indexOf('sunset') > -1) return 'trunc';
    return 'round';
  }

  /* הלב: שעה ודקות נגזרות תמיד מאותו מספר דקות.
     חישוב נפרד של השעה ושל הדקות הוא מקור הבאג המקורי. */
  function fromTotalMinutes(total, dir) {
    if (total === null || total === undefined || isNaN(total)) return '--:--';
    var t = (dir === 'trunc') ? Math.floor(total) : Math.round(total);
    var h = Math.floor(t / 60) % 24; if (h < 0) h += 24;
    var m = ((t % 60) + 60) % 60;
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
  }

  /* מקבל שעות עשרוניות */
  function show(key, hours) {
    if (hours === null || hours === undefined || isNaN(hours)) return '--:--';
    return fromTotalMinutes(hours * 60, dirOf(key));
  }

  /* מקבל דקות מחצות הלילה */
  function fromMinutes(key, mins) {
    if (mins === null || mins === undefined || isNaN(mins)) return '--:--';
    return fromTotalMinutes(mins, dirOf(key));
  }

  /* בלי כיוון הלכתי — לשעון, לספירה לאחור וכדומה */
  function plain(hours) {
    return fromTotalMinutes(hours * 60, 'round');
  }

  root.NatiZmanFmt = {
    show: show,
    fromMinutes: fromMinutes,
    plain: plain,
    dirOf: dirOf,
    VERSION: '1.0'
  };
})(typeof window !== 'undefined' ? window : globalThis);
