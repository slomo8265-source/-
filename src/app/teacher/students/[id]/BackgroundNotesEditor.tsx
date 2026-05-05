"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

type Props = {
  studentId: string;
  initialValue: string;
};

export function BackgroundNotesEditor({ studentId, initialValue }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const trimmed = value.trim();

    const { error: upsertErr } = await supabase
      .from("student_private")
      .upsert(
        { student_id: studentId, background_notes: trimmed || null, updated_at: new Date().toISOString() },
        { onConflict: "student_id" },
      );

    setSaving(false);
    if (upsertErr) {
      setError(upsertErr.message);
    } else {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        {initialValue ? (
          <p className="whitespace-pre-wrap text-sm text-cocoa-700">{initialValue}</p>
        ) : (
          <p className="text-sm italic text-cocoa-400">אין הערות עדיין.</p>
        )}
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-xs text-cocoa-500 hover:text-cocoa-800"
        >
          <Pencil className="h-3.5 w-3.5" />
          {initialValue ? "עריכת ההערות" : "הוספת הערות"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="מידע רקע, רגישויות, תחומי עניין..."
      />
      {error && (
        <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700">{error}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setValue(initialValue);
            setEditing(false);
          }}
        >
          <X className="h-4 w-4" />
          ביטול
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "שומרים..." : "שמירה"}
        </Button>
      </div>
    </div>
  );
}
