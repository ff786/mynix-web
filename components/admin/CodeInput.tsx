import { inputClasses } from "@/components/admin/fields";
import { cn } from "@/utils/cn";

/** 6-digit authenticator code; phones offer to paste it from the app. */
export default function CodeInput({ id = "code" }: { id?: string }) {
  return (
    <input
      id={id}
      name="code"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9 ]{6,7}"
      maxLength={7}
      required
      autoFocus
      placeholder="123 456"
      className={cn(inputClasses, "text-center text-2xl tracking-[0.3em] placeholder:tracking-[0.3em]")}
    />
  );
}
