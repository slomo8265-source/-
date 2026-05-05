import { formatDateIL } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

type Lesson = {
  id: string;
  lesson_date: string;
  summary_html: string;
  created_at: string;
};

export function LessonFeed({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length === 0) {
    return (
      <Card className="text-center text-cocoa-500">
        עדיין לא נכתבו סיכומי שיעור.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map((l) => (
        <Card key={l.id} className="animate-soft-fade">
          <div className="mb-3 flex items-baseline justify-between border-b border-cocoa-100 pb-2">
            <h3 className="text-lg font-semibold text-cocoa-800">
              שיעור מתאריך {formatDateIL(l.lesson_date)}
            </h3>
          </div>
          <div
            className="prose-summary"
            // התוכן מקור מ-Tiptap (HTML מוגבל-תגיות) ונשמר ע"י המורה בלבד
            dangerouslySetInnerHTML={{ __html: l.summary_html }}
          />
        </Card>
      ))}
    </div>
  );
}
