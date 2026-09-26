import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · MYNIX Admin" },
  robots: { index: false, follow: false },
};

/** Light, quiet workspace — none of the public site's chrome or scroll effects. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-[#f5f5f7] text-ink [--page-bg:#f5f5f7]">
      {children}
    </div>
  );
}
