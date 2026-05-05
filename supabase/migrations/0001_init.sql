-- ============================================================
-- צליל שווה — Initial schema + Row Level Security
-- ============================================================
-- הפרדת ההרשאות בין מורה להורה היא הליבה של המערכת.
-- ה-RLS פה אוכף את ההפרדה ברמת ה-DB עצמו, כך שגם אם הקליינט
-- יישבר/יוחלף — הורה לא יוכל לראות נתונים שלא שייכים לילד שלו.

-- ===== Tables =====

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('teacher','parent')),
  full_name   text,
  created_at  timestamptz not null default now()
);

create table if not exists public.students (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  birth_date        date,
  parent_user_id    uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- טבלה נפרדת למידע רגיש שגלוי למורה בלבד.
-- אין למשתמש ההורה אפילו אפשרות לקרוא אותה דרך REST API ישיר.
create table if not exists public.student_private (
  student_id        uuid primary key references public.students(id) on delete cascade,
  background_notes  text,
  updated_at        timestamptz not null default now()
);

create table if not exists public.cards (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references public.students(id) on delete cascade,
  total_lessons      int  not null check (total_lessons in (5,10)),
  remaining_lessons  int  not null check (remaining_lessons >= 0),
  is_active          boolean not null default true,
  opened_at          timestamptz not null default now(),
  closed_at          timestamptz
);

-- כרטיסייה פעילה אחת לכל תלמיד
create unique index if not exists one_active_card_per_student
  on public.cards(student_id) where is_active;

create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students(id) on delete cascade,
  card_id       uuid references public.cards(id) on delete set null,
  lesson_date   date not null,
  summary_html  text not null,
  created_at    timestamptz not null default now()
);

create index if not exists lessons_student_date_idx
  on public.lessons(student_id, lesson_date desc);

-- ===== RLS =====

alter table public.profiles        enable row level security;
alter table public.students        enable row level security;
alter table public.student_private enable row level security;
alter table public.cards           enable row level security;
alter table public.lessons         enable row level security;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- מורה: גישה מלאה
drop policy if exists teacher_all_profiles on public.profiles;
create policy teacher_all_profiles on public.profiles
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists teacher_all_students on public.students;
create policy teacher_all_students on public.students
  for all using (public.is_teacher()) with check (public.is_teacher());

-- student_private: מורה בלבד, אין policy אחר → הורה לא יוכל בכלל לראות
drop policy if exists teacher_only_private on public.student_private;
create policy teacher_only_private on public.student_private
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists teacher_all_cards on public.cards;
create policy teacher_all_cards on public.cards
  for all using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists teacher_all_lessons on public.lessons;
create policy teacher_all_lessons on public.lessons
  for all using (public.is_teacher()) with check (public.is_teacher());

-- הורה: רואה רק את הפרופיל שלו
drop policy if exists parent_own_profile on public.profiles;
create policy parent_own_profile on public.profiles
  for select using (id = auth.uid());

-- הורה: רואה רק את הילד שלו
drop policy if exists parent_see_own_child on public.students;
create policy parent_see_own_child on public.students
  for select using (parent_user_id = auth.uid());

-- הורה: רואה את כרטיסיות הילד שלו
drop policy if exists parent_see_child_cards on public.cards;
create policy parent_see_child_cards on public.cards
  for select using (
    exists(
      select 1 from public.students s
      where s.id = cards.student_id and s.parent_user_id = auth.uid()
    )
  );

-- הורה: רואה את סיכומי השיעורים של הילד שלו
drop policy if exists parent_see_child_lessons on public.lessons;
create policy parent_see_child_lessons on public.lessons
  for select using (
    exists(
      select 1 from public.students s
      where s.id = lessons.student_id and s.parent_user_id = auth.uid()
    )
  );

-- ===== VIEW לקריאת ההורה =====
-- ה-VIEW משמש לקליינט של ההורה. הוא לא חושף parent_user_id (לא נדרש לתצוגה).
-- background_notes כבר לא חי כאן בכלל — הוא בטבלה נפרדת שההורה אין לו policy אליה.

drop view if exists public.parent_student_safe;
create view public.parent_student_safe
with (security_invoker = on)
as
  select id, full_name from public.students;

grant select on public.parent_student_safe to authenticated;

-- ===== Triggers =====

-- יצירת profile אוטומטית בעת הרשמת משתמש חדש.
-- התפקיד נקבע לפי מייל המורה המוטמע (security definer מבטיח שזה רץ עם הרשאות הפונקציה).
-- כדי לשנות את המייל בעתיד — מריצים מחדש את הפונקציה עם הערך החדש.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  teacher_email constant text := 'yuditk678@gmail.com';
begin
  insert into public.profiles(id, role, full_name)
  values (
    new.id,
    case
      when lower(new.email) = lower(teacher_email)
        then 'teacher'
      else 'parent'
    end,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- יצירת שיעור → הורדה אוטומטית מהכרטיסייה הפעילה
create or replace function public.decrement_card_on_lesson()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.card_id is not null then
    update public.cards
       set remaining_lessons = greatest(remaining_lessons - 1, 0)
     where id = new.card_id;
  end if;
  return new;
end;
$$;

drop trigger if exists lesson_decrements_card on public.lessons;
create trigger lesson_decrements_card
  after insert on public.lessons
  for each row execute function public.decrement_card_on_lesson();

-- ===== הערות הגדרה =====
-- 1) המייל של המורה מוטמע בפונקציה handle_new_user למעלה (כ-constant).
--    בכל הרשמה חדשה — אם המייל תואם, המשתמש מסומן כ-teacher; אחרת parent.
-- 2) לשנות את המייל: להריץ מחדש את ה-CREATE OR REPLACE FUNCTION עם הערך החדש.
