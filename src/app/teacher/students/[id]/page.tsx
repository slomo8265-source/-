import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Plus, BookOpen, CreditCard } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CardBalanceMeter } from "@/components/CardBalanceMeter";
import { LessonFeed } from "@/components/LessonFeed";
import { LinkParentForm } from "./LinkParentForm";
import { BackgroundNotesEditor } from "./BackgroundNotesEditor";
import { formatDateIL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, birth_date, parent_user_id, created_at")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const { data: privateData } = await supabase
    .from("student_private")
    .select("background_notes")
    .eq("student_id", id)
    .maybeSingle();
  const backgroundNotes = privateData?.background_notes ?? null;

  const { data: cards } = await supabase
    .from("cards")
    .select("id, total_lessons, remaining_lessons, is_active, opened_at, closed_at")
    .eq("student_id", id)
    .order("opened_at", { ascending: false });

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, lesson_date, summary_html, created_at")
    .eq("student_id", id)
    .order("lesson_date", { ascending: false });

  const activeCard = cards?.find((c) => c.is_active);
  const lessonsCount = lessons?.length ?? 0;

  return (
    <div className="space-y-5">
      <Link
        href="/teacher"
        className="inline-flex items-center gap-1 text-sm text-cocoa-500 hover:text-cocoa-700"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לרשימה
      </Link>

      {/* פרטים אישיים — רגיש: מורה בלבד */}
      <Card>
        <h1 className="text-2xl font-bold text-cocoa-800">{student.full_name}</h1>
        <dl className="mt-3 space-y-1 text-sm text-cocoa-600">
          {student.birth_date && (
            <div>
              <dt className="inline font-medium">תאריך לידה: </dt>
              <dd className="inline">{formatDateIL(student.birth_date)}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium">בסטודיו מאז: </dt>
            <dd className="inline">{formatDateIL(student.created_at)}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl bg-cream-200 p-4">
          <h3 className="mb-1 text-sm font-semibold text-cocoa-700">
            הערות רקע (גלוי לך בלבד)
          </h3>
          <BackgroundNotesEditor
            studentId={student.id}
            initialValue={backgroundNotes ?? ""}
          />
        </div>

        {!student.parent_user_id && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-cocoa-700">
              קישור הורה לתלמיד
            </h3>
            <p className="mb-3 text-sm text-cocoa-600">
              ההורה עוד לא משויך. כדי לאפשר לו לראות את הסיכומים, יש לקשר את
              חשבון ההורה (אחרי שנרשם דרך magic link).
            </p>
            <LinkParentForm studentId={student.id} />
          </div>
        )}
      </Card>

      {/* כרטיסייה */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cocoa-600" />
            כרטיסייה
          </CardTitle>
          {activeCard && activeCard.remaining_lessons > 0 && (
            <span className="text-sm text-cocoa-500">פעילה</span>
          )}
        </div>

        {activeCard ? (
          <>
            <CardBalanceMeter
              remaining={activeCard.remaining_lessons}
              total={activeCard.total_lessons}
              size="lg"
            />
            {activeCard.remaining_lessons === 0 && (
              <div className="mt-4 rounded-xl bg-rose-50 p-4 text-center">
                <p className="mb-3 text-cocoa-700">
                  הכרטיסייה הסתיימה. רוצה לפתוח חדשה?
                </p>
                <Link href={`/teacher/students/${id}/cards/new`}>
                  <Button>
                    <Plus className="h-4 w-4" />
                    פתיחת כרטיסייה חדשה
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="mb-3 text-cocoa-600">אין כרטיסייה פעילה</p>
            <Link href={`/teacher/students/${id}/cards/new`}>
              <Button>
                <Plus className="h-4 w-4" />
                פתיחת כרטיסייה ראשונה
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* כפתור CTA לתיעוד שיעור */}
      {activeCard && activeCard.remaining_lessons > 0 && (
        <Link href={`/teacher/students/${id}/lessons/new`}>
          <Button size="xl" className="w-full">
            <Plus className="h-6 w-6" />
            הוספת תיעוד שיעור
          </Button>
        </Link>
      )}

      {/* פיד שיעורים */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cocoa-600" />
          <h2 className="text-xl font-bold text-cocoa-800">
            סיכומי שיעורים
          </h2>
          <span className="text-sm text-cocoa-400">({lessonsCount})</span>
        </div>
        <LessonFeed lessons={lessons ?? []} />
      </section>
    </div>
  );
}
