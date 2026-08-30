import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProjects } from "./actions";
import FloorUploaderClient from "@/components/floorplan/FloorUploaderClient";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await getProjects();

  const totalWork = (proj: (typeof projects)[0]) =>
    proj.floors.reduce(
      (s, f) =>
        s +
        f.rooms.reduce(
          (rs, r) => rs + (r.room_work_items?.length ?? 0),
          0
        ),
      0
    );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projecten</h1>
            <p className="text-sm text-gray-500 mt-1">
              Beheer je renovatieprojecten en plattegronden
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Terug
          </Link>
        </div>

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload plattegronden of start een demo
          </h2>
          <FloorUploaderClient />
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="text-4xl mb-3">📐</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Geen projecten yet
            </h3>
            <p className="text-sm text-gray-500">
              Upload plattegronden om je eerste project te starten, of laad het
              demo project.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const totalRooms = project.floors.reduce(
                (s, f) => s + f.rooms.length,
                0
              );

              return (
                <Link
                  key={project.id}
                  href={`/projecten/${project.id}`}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <ProjectDeleteButton id={project.id} />
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600">
                    {project.email_address && (
                      <div className="flex items-center gap-2">
                        <span>📧</span>
                        <span className="text-xs text-gray-500 truncate">
                          {project.email_address}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>🏢</span>
                      {project.floors.length} verdiepingen
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🚪</span>
                      {totalRooms} ruimtes
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🔨</span>
                      {totalWork(project)} werkzaamheden gepland
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(project.created_at).toLocaleDateString(
                        "nl-NL"
                      )}
                    </span>
                    <span className="text-xs font-medium text-blue-600">
                      Openen →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

import { deleteProject } from "./actions";

function ProjectDeleteButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await deleteProject(id);
      }}
    >
      <button
        type="submit"
        className="text-gray-400 hover:text-red-500 transition-colors"
        title="Verwijder project"
        onClick={(e) => {
          if (!confirm("Weet je zeker dat je dit project wilt verwijderen?")) {
            e.preventDefault();
          }
        }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </form>
  );
}
