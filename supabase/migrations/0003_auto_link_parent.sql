-- ============================================================
-- Migration 0003: קישור אוטומטי של הורה לתלמיד
-- ============================================================
-- במקום שהמורה תצטרך לחכות שההורה ייכנס ואז לקשר ידנית,
-- שומרים את המייל של ההורה על שורת התלמיד מראש. ברגע שההורה
-- ייכנס לראשונה (handle_new_user trigger) — הקישור קורה אוטומטית.

-- 1. עמודה חדשה לאחסון מייל ההורה הצפוי
alter table public.students
  add column if not exists parent_email text;

create index if not exists students_parent_email_idx
  on public.students (lower(parent_email))
  where parent_email is not null;

-- 2. עדכון handle_new_user: בנוסף ליצירת profile, מקשר אוטומטית
-- כל תלמיד שיש לו parent_email תואם למייל של המשתמש החדש.
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

  -- קישור אוטומטי: אם יש תלמידים שמחכים למייל הזה — נקשר אותם
  update public.students
     set parent_user_id = new.id,
         parent_email   = null
   where parent_user_id is null
     and parent_email is not null
     and lower(parent_email) = lower(new.email);

  return new;
end;
$$;

-- 3. עדכון link_parent_to_student_by_email:
-- אם ההורה כבר קיים → קישור מיידי (כמו עכשיו).
-- אם ההורה לא קיים עדיין → שומרים את המייל ב-parent_email
-- לקישור אוטומטי כשייכנס לראשונה.
create or replace function public.link_parent_to_student_by_email(
  p_student_id uuid,
  p_parent_email text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_id uuid;
  v_normalized_email text;
begin
  if not public.is_teacher() then
    return json_build_object('ok', false, 'error', 'אין הרשאה — רק מורה יכולה לקשר הורה לתלמיד');
  end if;

  v_normalized_email := lower(trim(p_parent_email));

  if v_normalized_email = '' or v_normalized_email not like '%@%' then
    return json_build_object('ok', false, 'error', 'מייל לא תקין');
  end if;

  select id into v_parent_id
  from auth.users
  where lower(email) = v_normalized_email
  limit 1;

  if v_parent_id is null then
    -- ההורה לא קיים עדיין → שומרים מייל לקישור עתידי
    update public.students
       set parent_email = v_normalized_email
     where id = p_student_id;

    if not found then
      return json_build_object('ok', false, 'error', 'התלמיד לא נמצא');
    end if;

    return json_build_object('ok', true, 'pending', true);
  end if;

  -- ההורה קיים → קישור מיידי
  update public.students
     set parent_user_id = v_parent_id,
         parent_email   = null
   where id = p_student_id;

  if not found then
    return json_build_object('ok', false, 'error', 'התלמיד לא נמצא');
  end if;

  return json_build_object('ok', true, 'parent_user_id', v_parent_id);
end;
$$;
