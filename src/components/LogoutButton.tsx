"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-cocoa-600 transition-colors hover:bg-rose-50"
      aria-label="התנתקות"
    >
      <LogOut className="h-4 w-4" />
      <span>יציאה</span>
    </button>
  );
}
