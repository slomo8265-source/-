"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type RpcResult = {
  ok: boolean;
  error?: string;
  parent_user_id?: string;
  pending?: boolean;
};

export function LinkParentForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail.includes("@")) {
      setError("יש להזין מייל תקין");
      setSubmitting(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    const { data, error: rpcErr } = await supabase.rpc(
      "link_parent_to_student_by_email",
      {
        p_student_id: studentId,
        p_parent_email: trimmedEmail,
      },
    );

    setSubmitting(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    const result = data as RpcResult | null;
    if (!result?.ok) {
      setError(result?.error ?? "שגיאה לא ידועה");
      return;
    }

    if (result.pending) {
      setMessage(
        "המייל נשמר. ברגע שההורה ייכנס דרך הקישור שנשלח אליו במייל — הקישור יושלם אוטומטית.",
      );
    } else {
      setMessage("הקישור בוצע! ההורה יוכל להיכנס ולראות את הסיכומים.");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        type="email"
        dir="ltr"
        className="text-left text-sm"
        placeholder="parent@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <p className="text-xs text-cocoa-500">
        המייל של ההורה (חייב להיות זה שאיתו הוא נכנס לאפליקציה לראשונה).
      </p>
      {error && (
        <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
          {message}
        </p>
      )}
      <Button type="submit" size="sm" disabled={submitting || !email.trim()}>
        {submitting ? "מקשרים..." : "קישור הורה"}
      </Button>
    </form>
  );
}
