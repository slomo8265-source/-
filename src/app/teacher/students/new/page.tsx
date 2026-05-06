"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";

export default function NewStudentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();

    // 1. נסי לאתר משתמש קיים לפי המייל. אם לא קיים — הצעי לשלוח magic link דרך הטופס בטלפון/מייל
    //    בפועל, נשמור את הילד בלי parent_user_id; כשההורה ייכנס לראשונה עם המייל הזה, נקשר ידנית.
    const trimmedParentEmail = parentEmail.trim();

    const { data: created, error: insertErr } = await supabase
      .from("students")
      .insert({
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        parent_user_id: null,
        parent_email: trimmedParentEmail || null,
      })
      .select("id")
      .single();

    if (insertErr || !created) {
      setError(insertErr?.message ?? "שמירה נכשלה");
      setSubmitting(false);
      return;
    }

    if (notes.trim()) {
      const { error: privErr } = await supabase
        .from("student_private")
        .insert({
          student_id: created.id,
          background_notes: notes.trim(),
        });
      if (privErr) {
        // השמירה הבסיסית הצליחה — מציגים אזהרה אבל לא חוסמים
        console.warn("שמירת ההערות נכשלה:", privErr.message);
      }
    }

    // 2. שמרי את המייל של ההורה כ-metadata לקישור עתידי דרך RPC או טבלה נפרדת.
    //    כאן נשתמש בעמודת user_metadata של ההורה אם נרשם, או ב-auth.admin אם יש service role.
    //    לפשטות: שולחים magic link להורה. כשייכנס — מקבל role=parent, אבל הקישור לתלמיד
    //    יישמר בעמודה parent_user_id ע"י המורה (היא תעדכן את הילד בידנית).
    // שולחים magic link להורה. כשייכנס לראשונה, ה-trigger handle_new_user
    // יקשר אותו אוטומטית לתלמיד (לפי parent_email שנשמר על השורה).
    if (trimmedParentEmail) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      await supabase.auth.signInWithOtp({
        email: trimmedParentEmail,
        options: { emailRedirectTo: `${siteUrl}/auth/callback` },
      });
    }

    router.push(`/teacher/students/${created.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Link
        href="/teacher"
        className="inline-flex items-center gap-1 text-sm text-cocoa-500 hover:text-cocoa-700"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה
      </Link>

      <Card>
        <CardTitle className="mb-4">תלמיד חדש</CardTitle>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">שם מלא</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="לדוגמה: שירה כהן"
            />
          </div>

          <div>
            <Label htmlFor="birthDate">תאריך לידה</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="parentEmail">מייל ההורה (לא חובה)</Label>
            <Input
              id="parentEmail"
              type="email"
              dir="ltr"
              className="text-left"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              placeholder="parent@example.com"
            />
            <p className="mt-1 text-xs text-cocoa-400">
              אם תזיני מייל — נשלח להורה קישור כניסה במייל, וברגע שייכנס
              לראשונה הוא יקושר אוטומטית לתלמיד.
            </p>
          </div>

          <div>
            <Label htmlFor="notes">הערות רקע / טיפוליות</Label>
            <Textarea
              id="notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="מידע רקע, רגישויות, תחומי עניין..."
            />
            <p className="mt-1 text-xs text-cocoa-400">
              ⚠ ההערות האלו רגישות וגלויות לך בלבד. ההורה לא רואה אותן.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Link href="/teacher">
              <Button type="button" variant="ghost">
                ביטול
              </Button>
            </Link>
            <Button type="submit" disabled={submitting || !fullName.trim()}>
              {submitting ? "שומרים..." : "שמירת תלמיד"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
