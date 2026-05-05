"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default function NewCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [size, setSize] = useState<5 | 10>(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();

    // 1) סגירת הכרטיסייה הפעילה (אם יש)
    const { error: closeErr } = await supabase
      .from("cards")
      .update({ is_active: false, closed_at: new Date().toISOString() })
      .eq("student_id", id)
      .eq("is_active", true);

    if (closeErr) {
      setError(closeErr.message);
      setSubmitting(false);
      return;
    }

    // 2) פתיחת חדשה
    const { error: openErr } = await supabase.from("cards").insert({
      student_id: id,
      total_lessons: size,
      remaining_lessons: size,
      is_active: true,
    });

    setSubmitting(false);

    if (openErr) {
      setError(openErr.message);
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
        <CardTitle className="mb-1">פתיחת כרטיסייה חדשה</CardTitle>
        <p className="mb-5 text-sm text-cocoa-500">
          אם קיימת כרטיסייה פעילה — היא תיסגר אוטומטית והחדשה תיפתח במקומה.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-cocoa-700">
              גודל הכרטיסייה
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[5, 10].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setSize(n as 5 | 10)}
                  className={cn(
                    "rounded-2xl border-2 p-6 text-center transition-all",
                    size === n
                      ? "border-rose-400 bg-rose-50 shadow-warm"
                      : "border-cocoa-100 bg-white/60 hover:border-rose-200",
                  )}
                >
                  <div className="text-3xl font-bold text-cocoa-800">{n}</div>
                  <div className="mt-1 text-sm text-cocoa-500">שיעורים</div>
                </button>
              ))}
            </div>
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
              {submitting ? "פותחים..." : `פתיחת כרטיסייה של ${size}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
