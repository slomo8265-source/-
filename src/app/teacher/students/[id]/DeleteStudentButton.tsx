"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function DeleteStudentButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    const confirmed = window.confirm(
      `למחוק את "${studentName}"?\n\nכל הכרטיסיות, השיעורים וההערות יימחקו לצמיתות. פעולה זו לא ניתנת לביטול.`,
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: delErr } = await supabase
      .from("students")
      .delete()
      .eq("id", studentId);

    if (delErr) {
      setSubmitting(false);
      setError(delErr.message);
      return;
    }

    router.push("/teacher");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={onDelete}
        disabled={submitting}
      >
        <Trash2 className="h-4 w-4" />
        {submitting ? "מוחקים..." : "מחיקת תלמיד"}
      </Button>
      {error && (
        <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
