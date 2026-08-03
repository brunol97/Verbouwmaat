import { createClient } from "@/lib/supabase/server";
import { getPostHogServer } from "@/lib/posthog/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Example server-side PostHog capture
  if (user) {
    getPostHogServer().capture({
      distinctId: user.id,
      event: "page_view_home",
      properties: { path: "/" },
    });
    await getPostHogServer().flush();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          AI SaaS Starter
        </h1>

        <p className="text-lg text-gray-600">
          Hello world with <strong>Supabase</strong>, <strong>Vercel</strong>, and <strong>PostHog</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Card
            title="Supabase"
            status={user ? "Authenticated" : "Not signed in"}
            detail={user?.email ?? "No session"}
          />
          <Card
            title="Vercel"
            status="Deployed"
            detail="Edge + Serverless"
          />
          <Card
            title="PostHog"
            status={user ? "Capturing" : "Ready"}
            detail="Product analytics"
          />
        </div>

        <div className="pt-8 text-sm text-gray-500">
          <p>
            Edit <code className="bg-gray-100 px-1 rounded">src/app/page.tsx</code> to get started.
          </p>
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  status,
  detail,
}: {
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 text-left space-y-2">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm font-medium text-green-700">{status}</p>
      <p className="text-xs text-gray-500">{detail}</p>
    </div>
  );
}
