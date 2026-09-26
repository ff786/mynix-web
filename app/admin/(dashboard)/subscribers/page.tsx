import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Subscribers" };

type Subscriber = { id: number; email: string; created_at: string };

export default async function AdminSubscribersPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  const subscribers = (data ?? []) as Subscriber[];
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Subscribers</h1>
      <p className="mt-2 text-ink/60">
        {subscribers.length} {subscribers.length === 1 ? "person has" : "people have"} joined the newsletter.
      </p>

      {error ? (
        <p role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          Couldn&apos;t load subscribers: {error.message}. Has <code>supabase/schema.sql</code> been run?
        </p>
      ) : subscribers.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-ink/10 bg-white px-5 py-4 text-sm text-ink/60">
          No sign-ups yet. They&apos;ll appear here as visitors join from the website.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-ink/10 overflow-hidden rounded-3xl border border-ink/10 bg-white">
          {subscribers.map((s) => (
            <li key={s.id} className="flex flex-col gap-1 px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <a href={`mailto:${s.email}`} className="font-medium break-all hover:underline">
                {s.email}
              </a>
              <span className="text-ink/50">{formatDate(s.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
