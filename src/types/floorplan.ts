export type WorkType =
  | "stucen"
  | "vloerverwarming"
  | "behangen"
  | "schilderen"
  | "tegelen"
  | "vloerleggen"
  | "elektra"
  | "sanitair"
  | "timmerwerk";

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  stucen: "Stucen",
  vloerverwarming: "Vloerverwarming leggen",
  behangen: "Behangen",
  schilderen: "Schilderen",
  tegelen: "Tegelen",
  vloerleggen: "Vloer leggen",
  elektra: "Elektra",
  sanitair: "Sanitair",
  timmerwerk: "Timmerwerk",
};

export interface WorkItem {
  id: string;
  type: WorkType;
  status: "pending" | "in_progress" | "completed";
  notes?: string;
}

export interface RoomPosition {
  x: number;
  y: number;
  width: number;
  depth: number;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  width: number;
  depth: number;
  area: number;
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
  position: RoomPosition;
  workItems: WorkItem[];
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  buildingWidth: number;
  buildingDepth: number;
  rooms: Room[];
  imageUrl: string;
}

export interface Project {
  id: string;
  name: string;
  address?: string;
  floors: Floor[];
  createdAt: string;
}

export interface IngestResult {
  floorName: string;
  floorLevel: number;
  buildingWidth: number;
  buildingDepth: number;
  rooms: {
    name: string;
    type: string;
    width: number;
    depth: number;
    area: number;
    position: RoomPosition;
  }[];
}
