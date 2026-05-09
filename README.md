# טופס ביקור שמאי - גרסה מותאמת לכל פלטפורמה

## איך להשתמש
1. העלה את כל התיקייה ל־Vercel, Netlify או GitHub Pages.
2. שלח לחבר את הקישור ל־index.html בוואטסאפ.
3. באייפון: לפתוח בספארי ואז Share > Add to Home Screen.
4. באנדרואיד: לפתוח בכרום ואז Add to Home Screen.

## מה תוקן
- פיצול לקבצים: index.html, styles.css, app.js.
- הסרת onclick/onchange inline והחלפה ב־event listeners.
- התאמת כפתורי מספרים ל־touch/pointer events.
- החלפת שדות number לשדות numeric-friendly כדי למנוע בעיות Safari/iOS.
- תיקון באג כפילות const wordFileName ששבר JavaScript.
- מנגנון download/share מותאם יותר לאייפון באמצעות Web Share API כשזמין.
- הוספת manifest ו־service worker ל־PWA בסיסי.
- הוספת safe-area ו־viewport-fit עבור iPhone.

## הערה חשובה
פתיחה ישירה של index.html מהמחשב או מוואטסאפ תעבוד חלקית, אבל PWA ו־service worker עובדים רק דרך HTTPS hosting.
