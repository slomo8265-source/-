"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { RichTextEditor } from "@/components/RichTextEditor";
import { todayISO } from "@/lib/utils";

type CardRow = {
  id: string;
  total_lessons: number;
  remaining_lessons: number;
};

export default function NewLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<CardRow | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [lessonDate, setLessonDate] = useState(todayISO());
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const [{ data: student }, { data: cards }] = await Promise.all([
        supabase.from("students").select("full_name").eq("id", id).single(),
        supabase
          .from("cards")
          .select("id, total_lessons, remaining_lessons")
          .eq("student_id", id)
          .eq("is_active", true)
          .limit(1),
      ]);
      if (student) setStudentName(student.full_name);
      if (cards && cards.length > 0) setActiveCard(cards[0]);
    })();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim() || summary === "<p></p>") {
      setError("נא להוסיף תוכן לסיכום");
      return;
    }
    setError(null);
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error: insertErr } = await supabase.from("lessons").insert({
      student_id: id,
      card_id: activeCard?.id ?? null,
      lesson_date: lessonDate,
      summary_html: summary,
    });

    setSubmitting(false);
    if (insertErr) {
      setError(insertErr.message);
    } else {
      router.push(`/teacher/students/${id}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/teacher/students/${id}`}
        className="inline-flex items-center gap-1 text-sm text-cocoa-500 hover:text-cocoa-700"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לתיק
      </Link>

      <Card>
        <CardTitle className="mb-1">תיעוד שיעור חדש</CardTitle>
        {studentName && (
          <p className="mb-4 text-sm text-cocoa-500">{studentName}</p>
        )}

        {!activeCard && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            ⚠ אין כרטיסייה פעילה — השיעור יישמר אבל לא ירד מכרטיסייה.
            <Link
              href={`/teacher/students/${id}/cards/new`}
              className="mr-2 underline"
            >
              פתיחת כרטיסייה
            </Link>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="max-w-xs">
            <Label htmlFor="lessonDate">תאריך השיעור</Label>
            <Input
              id="lessonDate"
              type="date"
              required
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
            />
          </div>

          <div>
            <Label>סיכום השיעור</Label>
            <RichTextEditor
              value={summary}
              onChange={setSummary}
              placeholder="כתבי כאן: מה נלמד, איך הילד הרגיש, התקדמות, הצעות להמשך..."
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Link href={`/teacher/students/${id}`}>
              <Button type="button" variant="ghost">
                ביטול
              </Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "שומרים..."
                : activeCard
                  ? "שמירה והורדה מהכרטיסייה"
                  : "שמירה"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
