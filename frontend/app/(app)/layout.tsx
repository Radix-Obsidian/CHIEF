import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pt-[env(safe-area-inset-top)]">
      <main className="flex-1 pb-[calc(72px+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  );
}
