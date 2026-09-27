import Link from "next/link";
import { UserRound } from "lucide-react";

export default function AccountButton() {
  return (
    <Link href="/account" aria-label="Your account" className="rounded-full p-2 transition-opacity hover:opacity-70">
      <UserRound className="h-5 w-5" strokeWidth={1.75} />
    </Link>
  );
}
