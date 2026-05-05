"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Heading2, Undo2, Redo2 } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"], defaultAlignment: "right" }),
      Placeholder.configure({ placeholder: placeholder ?? "כתבי כאן את סיכום השיעור..." }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "tiptap rounded-xl border border-cocoa-200 bg-white/80 px-4 py-3 min-h-[14rem] focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200",
        dir: "rtl",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const ToolbarBtn = ({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-cocoa-700 transition-colors",
        active ? "bg-rose-200 text-cocoa-800" : "hover:bg-rose-50",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-xl bg-cream-200 p-2">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="מודגש"
        >
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="נטוי"
        >
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="כותרת"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarBtn>
        <div className="mx-1 h-6 w-px bg-cocoa-200" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="רשימה"
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="רשימה ממוספרת"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <div className="mx-1 h-6 w-px bg-cocoa-200" />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} label="ביטול">
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} label="חזרה">
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
