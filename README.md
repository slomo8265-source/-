# צליל שווה 🎵

אפליקציית ניהול לסטודיו פרטי למוזיקה ותרפיה רגשית לילדים, עם הפרדת הרשאות מוחלטת בין המורה לבין ההורים.

- **המורה** רואה את הכל: רשימת תלמידים, פרופיל מלא (כולל הערות רקע רגישות), כרטיסיות, ותיעוד שיעורים.
- **ההורה** רואה רק: שם הילד, יתרת כרטיסייה, וסיכומי שיעורים. ללא גישה לפרופיל או להערות.

האפליקציה היא **PWA** — ניתן להוסיף אותה למסך הבית בנייד וגם לפתוח מהדפדפן בדסקטופ.

---

## דרישות מקדימות

1. **Node.js 18.18 ומעלה** — הורידו מ-[nodejs.org](https://nodejs.org/) (LTS).
   בדיקה: `node --version` ו-`npm --version`.
2. **חשבון Supabase** (חינם) — [supabase.com](https://supabase.com).
3. **חשבון Vercel** (חינם) — לדיפלוי, [vercel.com](https://vercel.com).

---

## התקנה מקומית — שלב אחר שלב

### 1. התקנת תלויות

מתוך תיקיית הפרויקט בטרמינל:

```bash
npm install
```

### 2. יצירת פרויקט Supabase

1. נכנסים ל-[Supabase Dashboard](https://supabase.com/dashboard) → New Project.
2. שם: `tzlil-shaveh` (או כל שם), אזור: `Frankfurt` (הקרוב לישראל).
3. בוחרים סיסמה למסד הנתונים ושומרים.
4. ממתינים ~2 דקות עד שהפרויקט מוכן.

### 3. הגדרת מייל המורה ב-DB

לפני הרצת המיגרציה — נכנסים ל-**SQL Editor** ב-Supabase ומריצים:

```sql
alter database postgres set "app.teacher_email" = 'your-teacher-email@example.com';
```

(החליפו לכתובת המייל שלכם — זו שתשמש לכניסה כמורה.)

### 4. הרצת המיגרציה

ב-**SQL Editor**, מעתיקים את כל התוכן של `supabase/migrations/0001_init.sql` ומריצים.
זה יוצר את כל הטבלאות, ה-RLS, וה-triggers.

### 5. הגדרת קישורי Magic Link

ב-**Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (לפיתוח). אחרי דיפלוי — שנו ל-URL של Vercel.
- **Redirect URLs**: הוסיפו `http://localhost:3000/auth/callback` ואת ה-URL של Vercel + `/auth/callback`.

### 6. עיצוב תבנית מייל בעברית (אופציונלי אך מומלץ)

ב-**Authentication → Email Templates → Magic Link**, ערכו את התבנית כך:

```html
<h2>שלום מצליל שווה 🎵</h2>
<p>קישור הכניסה שלכם:</p>
<p><a href="{{ .ConfirmationURL }}">לחצו כאן להיכנס</a></p>
<p>הקישור תקף ל-60 דקות.</p>
```

### 7. משתני סביבה

מעתיקים את `.env.local.example` ל-`.env.local`:

```bash
cp .env.local.example .env.local
```

ממלאים בערכים מ-Supabase (Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
TEACHER_EMAIL=your-teacher-email@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 8. הרצה

```bash
npm run dev
```

נכנסים ל-[http://localhost:3000](http://localhost:3000) ומתחברים עם המייל של המורה — תקבלו קישור ב-email. אחרי לחיצה — תופיע רשימת התלמידים (ריקה בהתחלה).

---

## איך מקשרים הורה לתלמיד?

בגלל הרשאות אבטחה מהדורות, יצירת קישור הורה-תלמיד עובדת כך:

1. **המורה** מוסיפה תלמיד חדש (מסך `/teacher/students/new`).
2. אם הזינה את מייל ההורה — האפליקציה תשלח לו Magic Link אוטומטית.
3. **ההורה** לוחץ על הקישור → נכנס בפעם הראשונה → trigger ב-DB יוצר לו `profile` עם `role=parent`.
4. **המורה** ניגשת ל-Supabase → Authentication → Users → מעתיקה את ה-UUID של ההורה.
5. בתיק התלמיד (`/teacher/students/[id]`) — מדביקה את ה-UUID בטופס "קישור הורה".
6. מעכשיו ההורה רואה את התלמיד שלו במסך `/parent`.

> **שיפור עתידי:** ניתן להוסיף Edge Function ב-Supabase שמחפשת לפי מייל ומחזירה UUID, כך שלא צריך להעתיק ידנית.

---

## דיפלוי ל-Vercel

1. דחפו את הקוד ל-GitHub:
   ```bash
   git init
   git add .
   git commit -m "צליל שווה — initial"
   git remote add origin https://github.com/your-user/tzlil-shaveh.git
   git push -u origin main
   ```
2. ב-[vercel.com](https://vercel.com) → Add New → Project → ייבוא מ-GitHub.
3. בהגדרות: הוסיפו את משתני הסביבה (אותם של `.env.local`, רק שינו את `NEXT_PUBLIC_SITE_URL` ל-URL של Vercel).
4. Deploy.
5. חזרו ל-Supabase → Authentication → URL Configuration → עדכנו את Site URL ו-Redirect URLs ל-domain של Vercel.

---

## בדיקות אבטחה (חובה לפני שימוש בייצור)

### 1. בדיקת RLS — הורה לא יכול לראות נתונים זרים

נכנסים ל-Supabase Dashboard → Authentication → Users → בוחרים משתמש הורה → "Impersonate".
אז ב-SQL Editor מריצים:

```sql
-- צריך להחזיר רק את הילד של ההורה הזה (שם בלבד)
select * from parent_student_safe;

-- ניסיון לגשת לטבלת ההערות הרגישות → צריך להחזיר 0 שורות (RLS חוסם)
select * from student_private;

-- ניסיון לראות את כל התלמידים → רק הילד שלו (פלוס שדות לא רגישים)
select id, full_name from students;

-- צריך להחזיר רק את הפרופיל של ההורה הזה
select * from profiles;
```

> **הערה חשובה:** `background_notes` חי בטבלה `student_private` נפרדת עם RLS שמאפשר גישה אך ורק למורה (`is_teacher()`). ההורה לא יקבל שום שורה ממנה — גם לא של הילד שלו — גם בקריאת REST API ישירה.

### 2. בדיקת ניתוב

מתחברים כהורה ומנסים בדפדפן:
- `/teacher` → אמור להפנות ל-`/parent` (לא להציג כלום ממסך המורה).
- `/teacher/students/abc` → אותו דבר.

### 3. בדיקת trigger

מתחברים כמורה, מתעדים שיעור — היתרה צריכה לרדת ב-1 אוטומטית.

---

## מבנה הפרויקט

```
src/
├── middleware.ts              ניתוב לפי תפקיד
├── app/
│   ├── layout.tsx             RTL, פונט עברי, PWA register
│   ├── globals.css            עיצוב ורוד+חום
│   ├── login/                 Magic Link
│   ├── auth/callback/         exchange code → session
│   ├── teacher/               אזור מורה (גישה מלאה)
│   └── parent/                אזור הורה (קריאה בלבד)
├── components/
│   ├── ui/                    Button, Input, Card
│   ├── RichTextEditor.tsx     Tiptap עברי
│   ├── CardBalanceMeter.tsx   מד צבעוני
│   └── LessonFeed.tsx         פיד שיעורים
└── lib/supabase/              קליינטים: server, browser, middleware

supabase/migrations/
└── 0001_init.sql              סכמה + RLS — הליבה של ההפרדה
```

---

## תאימות לחוק הגנת הפרטיות

- **שמירת מידע רגיש** (הערות רקע על קטינים): בטבלה ייעודית `student_private` שמוגנת ב-RLS עם policy יחיד — `is_teacher()`. ההורה לא יראה אותה גם בקריאת REST API ישירה.
- **הפרדת הרשאות**: ה-RLS אוכף את ההפרדה ברמת ה-DB עצמו, גם אם הקליינט נפגע.
- **מחיקה**: כדי למחוק תלמיד והנתונים שלו לחלוטין, מוחקים את הרשומה מ-`students` — ה-cascade ימחק שיעורים, כרטיסיות, וגם את ה-`student_private` המקושרת.

---

## תמיכה / תיקונים

- **לא קיבלתי מייל magic link** → בדקי ספאם, או ב-Supabase: Authentication → Logs.
- **trigger לא רץ ב-signup** → ודאי שהרצת `alter database postgres set "app.teacher_email" = ...` *לפני* יצירת המשתמש הראשון, או הריצי ידנית: `update profiles set role='teacher' where id=(select id from auth.users where email='...');`
- **שגיאות RLS** → במקרה חירום ניתן לבטל RLS זמנית: `alter table students disable row level security;` (לא להשאיר כך!).

בהצלחה! 💖
