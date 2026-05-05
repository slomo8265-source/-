"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Music, Mail, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6">
      <div className="text-cocoa-500">טוען...</div>
    </main>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "auth"
      ? "הקישור שניסיתם להשתמש בו פג תוקף. אנא הזינו את המייל שלכם שוב לקבלת קישור חדש."
      : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const next = params.get("next") ?? "/";
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-6">
      <header className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-rose-200 text-cocoa-700 shadow-warm">
          <Music className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-cocoa-800">צליל שווה</h1>
        <p className="mt-1 text-sm text-cocoa-500">
          סטודיו למוזיקה ותרפיה
        </p>
      </header>

      <Card className="w-full">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <h2 className="text-xl font-semibold text-cocoa-800">
              שלחנו לכם קישור!
            </h2>
            <p className="text-cocoa-600">
              פתחו את המייל שהגיע לכתובת
              <br />
              <strong className="text-cocoa-800">{email}</strong>
              <br />
              ולחצו על הקישור כדי להיכנס.
            </p>
            <p className="text-xs text-cocoa-400">
              אם לא רואים — בדקו ב&quot;קידום מכירות&quot; או &quot;ספאם&quot;.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-cocoa-800">כניסה</h2>
              <p className="mt-1 text-sm text-cocoa-500">
                נשלח לכם קישור חד-פעמי במייל. אין צורך בסיסמה.
              </p>
            </div>

            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="text-left"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || !email}
            >
              <Mail className="h-5 w-5" />
              {submitting ? "שולחים..." : "שלח לי קישור כניסה"}
            </Button>
          </form>
        )}
      </Card>

      <p className="text-center text-xs text-cocoa-400">
        בכניסה למערכת אתם מאשרים את שמירת הנתונים בכפוף למדיניות הפרטיות.
      </p>
    </main>
  );
}
