"use server";

import { createClient } from "@/lib/supabase/server";
import { getPostHogServer } from "@/lib/posthog/server";
import { generateProjectEmail } from "@/lib/email/client";
import { revalidatePath } from "next/cache";

// ───────────────────────────────────────────
// Types for nested project data
// ───────────────────────────────────────────

export interface ProjectWithData {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  email_address: string | null;
  status: "active" | "archived" | "completed";
  created_at: string;
  updated_at: string;
  floors: FloorWithData[];
}

export interface FloorWithData {
  id: string;
  project_id: string;
  name: string;
  level: number;
  building_width: number | null;
  building_depth: number | null;
  image_url: string | null;
  created_at: string;
  rooms: RoomWithData[];
}

export interface RoomWithData {
  id: string;
  floor_id: string;
  name: string;
  type: string;
  width: number;
  depth: number;
  area: number;
  floor_area: number;
  wall_area: number;
  ceiling_area: number;
  position_json: { x: number; y: number; width: number; depth: number };
  created_at: string;
  room_work_items: WorkItemRow[];
}

export interface WorkItemRow {
  id: string;
  room_id: string;
  work_type: string;
  status: "pending" | "in_progress" | "completed";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────
// READ
// ───────────────────────────────────────────

export async function getProjects(): Promise<ProjectWithData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      floors (
        *,
        rooms (
          *,
          room_work_items (*)
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProjects error:", error);
    throw new Error("Kon projecten niet ophalen");
  }

  return (data as ProjectWithData[]) ?? [];
}

export async function getProjectById(
  id: string
): Promise<ProjectWithData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      floors (
        *,
        rooms (
          *,
          room_work_items (*)
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    console.error("getProjectById error:", error);
    throw new Error("Kon project niet ophalen");
  }

  return data as ProjectWithData;
}

export async function getWorkCatalog() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("work_catalog")
    .select("*")
    .order("label", { ascending: true });

  if (error) {
    console.error("getWorkCatalog error:", error);
    throw new Error("Kon werkzaamhedencatalogus niet ophalen");
  }

  return data ?? [];
}

// ───────────────────────────────────────────
// CREATE
// ───────────────────────────────────────────

export async function createProject(input: {
  name: string;
  address?: string | null;
  floors: {
    name: string;
    level: number;
    building_width?: number | null;
    building_depth?: number | null;
    image_url?: string | null;
    rooms: {
      name: string;
      type: string;
      width: number;
      depth: number;
      area: number;
      floor_area: number;
      wall_area: number;
      ceiling_area: number;
      position_json: { x: number; y: number; width: number; depth: number };
    }[];
  }[];
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd");

  // 1. Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: input.name,
      address: input.address ?? null,
    })
    .select()
    .single();

  if (projectError || !project) {
    console.error("createProject error:", projectError);
    throw new Error("Kon project niet aanmaken");
  }

  // 1b. Genereer uniek projectmailadres
  const emailAddress = generateProjectEmail(project.id);
  await supabase
    .from("projects")
    .update({ email_address: emailAddress })
    .eq("id", project.id);

  // 2. Create floors
  for (const floorInput of input.floors) {
    const { data: floor, error: floorError } = await supabase
      .from("floors")
      .insert({
        project_id: project.id,
        name: floorInput.name,
        level: floorInput.level,
        building_width: floorInput.building_width ?? null,
        building_depth: floorInput.building_depth ?? null,
        image_url: floorInput.image_url ?? null,
      })
      .select()
      .single();

    if (floorError || !floor) {
      console.error("createFloor error:", floorError);
      throw new Error("Kon verdieping niet aanmaken");
    }

    // 3. Create rooms
    if (floorInput.rooms.length > 0) {
      const roomsToInsert = floorInput.rooms.map((r) => ({
        floor_id: floor.id,
        name: r.name,
        type: r.type as
          | "living"
          | "kitchen"
          | "bedroom"
          | "bathroom"
          | "hallway"
          | "storage"
          | "stairs"
          | "outdoor"
          | "landing"
          | "closet",
        width: r.width,
        depth: r.depth,
        area: r.area,
        floor_area: r.floor_area,
        wall_area: r.wall_area,
        ceiling_area: r.ceiling_area,
        position_json: r.position_json,
      }));

      const { error: roomsError } = await supabase
        .from("rooms")
        .insert(roomsToInsert);

      if (roomsError) {
        console.error("createRooms error:", roomsError);
        throw new Error("Kon ruimtes niet aanmaken");
      }
    }
  }

  // PostHog
  getPostHogServer().capture({
    distinctId: user.id,
    event: "project_created",
    properties: {
      project_id: project.id,
      floor_count: input.floors.length,
      room_count: input.floors.reduce((s, f) => s + f.rooms.length, 0),
    },
  });
  await getPostHogServer().flush();

  revalidatePath("/projecten");
  return project.id;
}

// ───────────────────────────────────────────
// UPDATE
// ───────────────────────────────────────────

export async function updateProject(
  id: string,
  updates: { name?: string; address?: string | null; status?: string }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("updateProject error:", error);
    throw new Error("Kon project niet updaten");
  }

  revalidatePath("/projecten");
  revalidatePath(`/projecten/${id}`);
}

export async function updateRoom(
  roomId: string,
  updates: {
    name?: string;
    type?: string;
    width?: number;
    depth?: number;
    area?: number;
    floor_area?: number;
    wall_area?: number;
    ceiling_area?: number;
    position_json?: { x: number; y: number; width: number; depth: number };
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("id", roomId);

  if (error) {
    console.error("updateRoom error:", error);
    throw new Error("Kon ruimte niet updaten");
  }

  revalidatePath("/projecten");
}

export async function upsertRoomWorkItem(input: {
  room_id: string;
  work_type: string;
  status?: "pending" | "in_progress" | "completed";
  notes?: string | null;
}) {
  const supabase = await createClient();

  // Check if item already exists
  const { data: existing } = await supabase
    .from("room_work_items")
    .select("id")
    .eq("room_id", input.room_id)
    .eq("work_type", input.work_type)
    .maybeSingle();

  if (existing) {
    // Delete = toggle off
    const { error } = await supabase
      .from("room_work_items")
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error("deleteWorkItem error:", error);
      throw new Error("Kon werkzaamheid niet verwijderen");
    }
  } else {
    const { error } = await supabase.from("room_work_items").insert({
      room_id: input.room_id,
      work_type: input.work_type,
      status: input.status ?? "pending",
      notes: input.notes ?? null,
    });

    if (error) {
      console.error("insertWorkItem error:", error);
      throw new Error("Kon werkzaamheid niet toevoegen");
    }
  }

  revalidatePath("/projecten");
}

export async function updateWorkItemStatus(
  itemId: string,
  status: "pending" | "in_progress" | "completed",
  notes?: string | null
) {
  const supabase = await createClient();

  const updates: { status: string; notes?: string | null } = { status };
  if (notes !== undefined) updates.notes = notes;

  const { error } = await supabase
    .from("room_work_items")
    .update(updates)
    .eq("id", itemId);

  if (error) {
    console.error("updateWorkItemStatus error:", error);
    throw new Error("Kon status niet updaten");
  }

  revalidatePath("/projecten");
}

// ───────────────────────────────────────────
// DELETE
// ───────────────────────────────────────────

export async function deleteProject(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("deleteProject error:", error);
    throw new Error("Kon project niet verwijderen");
  }

  revalidatePath("/projecten");
}

export async function deleteRoom(roomId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("rooms").delete().eq("id", roomId);

  if (error) {
    console.error("deleteRoom error:", error);
    throw new Error("Kon ruimte niet verwijderen");
  }

  revalidatePath("/projecten");
}
