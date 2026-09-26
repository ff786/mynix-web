"use client";

import { startTransition, useActionState, useId } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeToNewsletter, type NewsletterState } from "@/lib/newsletter/actions";
import { cn } from "@/utils/cn";

type NewsletterFormProps = {
  /** `large` for the home-page section, `compact` for the footer. */
  size?: "large" | "compact";
  className?: string;
};

export default function NewsletterForm({ size = "large", className }: NewsletterFormProps) {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeToNewsletter, {
    status: "idle",
  });
  const id = useId();
  const large = size === "large";

  if (state.status === "success") {
    return (
      <p
        role="status"
        className={cn("flex items-center gap-3 text-ink/80", large ? "justify-center text-lg" : "text-sm", className)}
      >
        <Check className={cn("shrink-0 text-accent", large ? "h-5 w-5" : "h-4 w-4")} />
        {state.message}
      </p>
    );
  }

  return (
    <form
      // Submitted manually so a failed attempt keeps what the visitor typed
      // (React resets a <form action> after it runs).
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className={cn("w-full", className)}
      noValidate
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border border-ink/15 bg-ink/[0.03] transition-colors focus-within:border-ink/40",
          large ? "p-1.5 pl-6" : "p-1 pl-4",
        )}
      >
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? `${id}-message` : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink/40 focus:outline-none",
            large ? "py-3 text-base" : "py-2 text-sm",
          )}
        />
        {/* Honeypot for bots — hidden from people and assistive tech. */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={pending}
          aria-label={large ? undefined : "Subscribe"}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink font-medium text-canvas transition-colors hover:bg-ink/85 disabled:opacity-60",
            large ? "px-6 py-3 text-[15px]" : "h-9 w-9",
          )}
        >
          {large && (pending ? "Subscribing…" : "Subscribe")}
          {!large && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
      {state.status === "error" && (
        <p id={`${id}-message`} role="alert" className={cn("mt-3 text-sm text-ink/70", large && "text-center")}>
          {state.message}
        </p>
      )}
    </form>
  );
}
