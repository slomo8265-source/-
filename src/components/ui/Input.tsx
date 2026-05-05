import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-cocoa-200 bg-white/70 px-4 text-cocoa-800 placeholder:text-cocoa-400 transition-colors focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[6rem] w-full rounded-xl border border-cocoa-200 bg-white/70 px-4 py-3 text-cocoa-800 placeholder:text-cocoa-400 transition-colors focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-sm font-medium text-cocoa-700", className)}
      {...props}
    >
      {children}
    </label>
  );
}
