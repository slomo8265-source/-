-- ============================================================
-- Migration 0002: קישור הורה לתלמיד לפי מייל (במקום UUID)
-- ============================================================
-- הפונקציה רצה כ-security definer כדי שתוכל לקרוא מ-auth.users,
-- אבל תחילה בודקת שהקורא הוא מורה — כך שהורה רגיל לא יוכל
-- "לדוג" כתובות מייל ממסד הנתונים.

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
  -- הרשאה: רק מורה יכול לקרוא לפונקציה הזו
  if not public.is_teacher() then
    return json_build_object(
      'ok', false,
      'error', 'אין הרשאה — רק מורה יכולה לקשר הורה לתלמיד'
    );
  end if;

  -- נורמליזציה של המייל (קטנות + ללא רווחים)
  v_normalized_email := lower(trim(p_parent_email));

  if v_normalized_email = '' or v_normalized_email not like '%@%' then
    return json_build_object(
      'ok', false,
      'error', 'מייל לא תקין'
    );
  end if;

  -- חיפוש ההורה ב-auth.users
  select id into v_parent_id
  from auth.users
  where lower(email) = v_normalized_email
  limit 1;

  if v_parent_id is null then
    return json_build_object(
      'ok', false,
      'error', 'ההורה עוד לא נרשם למערכת. בקשי ממנו להיכנס פעם אחת דרך הקישור שנשלח אליו במייל, ואז נסי שוב.'
    );
  end if;

  -- עדכון התלמיד
  update public.students
     set parent_user_id = v_parent_id
   where id = p_student_id;

  if not found then
    return json_build_object(
      'ok', false,
      'error', 'התלמיד לא נמצא'
    );
  end if;

  return json_build_object(
    'ok', true,
    'parent_user_id', v_parent_id
  );
end;
$$;

grant execute on function public.link_parent_to_student_by_email(uuid, text) to authenticated;
