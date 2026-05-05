"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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

    const supabase = createSupabaseBrowserClient();

    // RLS allows teacher to query profiles. We look up by joining via auth.users isn't available,
    // so we ask the teacher to enter the parent's email AFTER they've signed in once.
    // We query profiles → join requires a view. For simplicity, fetch all parent profiles
    // and match against full_name? No — we need the email. Solution: we store the parent's
    // email in their auth metadata, but RLS on profiles doesn't expose email directly.
    //
    // Practical approach: we store parent_email in students table after they first sign in,
    // OR the teacher uses the Supabase dashboard. For MVP: the teacher pastes the parent's
    // user UUID (they can find it in Supabase auth dashboard). This is documented in README.
    //
    // Better path: create an edge function. For now, accept the parent's UUID directly.

    // The UI accepts either an email or UUID. If it's an email, we try to find via auth admin
    // (requires service role). Since we don't have that client-side, we accept UUID only.

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        email.trim(),
      );

    if (!isUuid) {
      setError(
        "כרגע יש להזין את ה-UUID של ההורה (מתוך Supabase → Authentication → Users). בעתיד נוסיף חיפוש לפי מייל.",
      );
      setSubmitting(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from("students")
      .update({ parent_user_id: email.trim() })
      .eq("id", studentId);

    setSubmitting(false);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setMessage("הקישור בוצע! ההורה יוכל להיכנס ולראות את הסיכומים.");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input
        type="text"
        dir="ltr"
        className="text-left text-sm"
        placeholder="UUID של ההורה (מתוך Supabase Auth)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
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
