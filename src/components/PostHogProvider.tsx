"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { getPostHogClient } from "@/lib/posthog/client";
import { getPostHogProperties } from "@/lib/config";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url =
        window.origin +
        pathname +
        (searchParams.toString() ? "?" + searchParams.toString() : "");

      getPostHogClient().capture("$pageview", {
        $current_url: url,
        ...getPostHogProperties(),
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
