import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { Music } from "lucide-react";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "parent") redirect("/teacher");

  return (
    <div className="mx-auto min-h-dvh max-w-2xl">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-cocoa-100 bg-cream/90 px-4 py-3 backdrop-blur">
        {/* כותרת בלי קישור — אין נווט פנימי באזור ההורה */}
        <div className="flex items-center gap-2 text-cocoa-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-200">
            <Music className="h-5 w-5" />
          </div>
          <span className="font-bold">צליל שווה</span>
        </div>
        <LogoutButton />
      </header>
      <main className="px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}
