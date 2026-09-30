import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AuthScreen } from "@/components/gym/auth-screen";
import { PlateApp } from "@/components/gym/plate-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setWaited(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);
  if (user) return <PlateApp />;
  if (isPending && !waited) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-medium tracking-tight">Plate</h1>
          <p className="mt-2 text-sm text-muted">Checking your account…</p>
        </div>
      </main>
    );
  }
  return <AuthScreen />;
}
