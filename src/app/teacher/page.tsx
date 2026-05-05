import Link from "next/link";
import { Plus, ChevronLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CardBalanceMeter } from "@/components/CardBalanceMeter";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const supabase = await createSupabaseServerClient();

  const { data: students } = await supabase
    .from("students")
    .select(
      `id, full_name,
       cards!cards_student_id_fkey(id, total_lessons, remaining_lessons, is_active)`,
    )
    .order("created_at", { ascending: false });

  type StudentRow = {
    id: string;
    full_name: string;
    cards: { id: string; total_lessons: number; remaining_lessons: number; is_active: boolean }[];
  };

  const rows = (students ?? []) as StudentRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cocoa-800">שלום!</h1>
          <p className="text-sm text-cocoa-500">
            {rows.length} תלמידים בסטודיו
          </p>
        </div>
        <Link href="/teacher/students/new">
          <Button size="md">
            <Plus className="h-4 w-4" />
            תלמיד חדש
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="text-center text-cocoa-600">
          <CardTitle className="mb-2">עדיין אין תלמידים</CardTitle>
          <p className="mb-4">התחילי בהוספת התלמיד הראשון לסטודיו.</p>
          <Link href="/teacher/students/new">
            <Button>
              <Plus className="h-4 w-4" />
              הוספת תלמיד ראשון
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((s) => {
            const active = s.cards.find((c) => c.is_active);
            return (
              <Link
                key={s.id}
                href={`/teacher/students/${s.id}`}
                className="block"
              >
                <Card className="flex items-center justify-between gap-3 transition-shadow hover:shadow-warm">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-cocoa-800">
                      {s.full_name}
                    </h3>
                    <div className="mt-2 max-w-xs">
                      {active ? (
                        <CardBalanceMeter
                          remaining={active.remaining_lessons}
                          total={active.total_lessons}
                        />
                      ) : (
                        <p className="text-sm text-cocoa-400">
                          אין כרטיסייה פעילה
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-cocoa-400" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
