"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps the dashboard fresh while the tab is visible; silent refresh, no loading skeleton. */
export function AdminDashboardRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    const id = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  return null;
}
