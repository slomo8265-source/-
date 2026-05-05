import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { CardBalanceMeter } from "@/components/CardBalanceMeter";
import { LessonFeed } from "@/components/LessonFeed";
import { BookOpen, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const supabase = await createSupabaseServerClient();

  // הורה משתמש ב-VIEW המסונן (ללא background_notes) — הגנה נוספת מעל ה-RLS
  const { data: students } = await supabase
    .from("parent_student_safe")
    .select("id, full_name");

  const student = students?.[0];

  if (!student) {
    return (
      <Card className="text-center">
        <CardTitle>ברוכים הבאים</CardTitle>
        <CardDescription className="mt-2">
          המורה עוד לא קישרה את החשבון שלך לתלמיד. ברגע שזה ייעשה — תוכלי לראות
          כאן את ההתקדמות וכרטיסיית התשלומים.
        </CardDescription>
      </Card>
    );
  }

  const [{ data: cards }, { data: lessons }] = await Promise.all([
    supabase
      .from("cards")
      .select("id, total_lessons, remaining_lessons, is_active")
      .eq("student_id", student.id)
      .eq("is_active", true)
      .limit(1),
    supabase
      .from("lessons")
      .select("id, lesson_date, summary_html, created_at")
      .eq("student_id", student.id)
      .order("lesson_date", { ascending: false }),
  ]);

  const activeCard = cards?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cocoa-800">
          התקדמות — {student.full_name}
        </h1>
        <p className="text-sm text-cocoa-500">
          סקירה מלאה של השיעורים והתשלומים
        </p>
      </div>

      {/* יתרת כרטיסייה */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-cocoa-600" />
          <CardTitle>מצב הכרטיסייה</CardTitle>
        </div>
        {activeCard ? (
          <CardBalanceMeter
            remaining={activeCard.remaining_lessons}
            total={activeCard.total_lessons}
            size="lg"
          />
        ) : (
          <p className="text-cocoa-500">אין כרטיסייה פעילה כרגע.</p>
        )}
      </Card>

      {/* פיד שיעורים */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cocoa-600" />
          <h2 className="text-xl font-bold text-cocoa-800">
            סיכומי שיעורים
          </h2>
        </div>
        <LessonFeed lessons={lessons ?? []} />
      </section>
    </div>
  );
}
