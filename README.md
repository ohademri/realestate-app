# Real Estate App

טופס ביקור שמאי עם Google Login דרך Firebase.

## משתמשים מורשים כרגע

- ohademri@gmail.com
- raberroee@gmail.com

## איך מוסיפים משתמש מורשה

פתח את הקובץ `firebase-auth.js`, מצא את הרשימה:

```js
const allowedUsers = [
  "ohademri@gmail.com",
  "raberroee@gmail.com"
];
```

הוסף מייל חדש, למשל:

```js
const allowedUsers = [
  "ohademri@gmail.com",
  "raberroee@gmail.com",
  "newuser@gmail.com"
];
```

אחר כך העלה את הקובץ ל-GitHub ועשה Commit. Vercel יעדכן את האתר אוטומטית.

## חשוב אחרי ההעלאה

ב-Firebase צריך לוודא שהדומיין של Vercel מורשה:

Authentication → Settings → Authorized domains

הוסף את הדומיין שלך, למשל:

```text
realestate-app-seven-theta.vercel.app
```

בלי `https://`.
