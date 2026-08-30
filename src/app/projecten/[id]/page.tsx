import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectById, getWorkCatalog } from "../actions";
import ProjectDetailClient from "@/components/floorplan/ProjectDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const project = await getProjectById(id);
  const workCatalog = await getWorkCatalog();

  if (!project) {
    notFound();
  }

  return (
    <ProjectDetailClient
      project={project}
      workCatalog={workCatalog}
      userId={user.id}
    />
  );
}
