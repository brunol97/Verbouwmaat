"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  ProjectWithData,
  WorkItemRow,
  upsertRoomWorkItem,
  updateWorkItemStatus,
  updateRoom,
  deleteRoom,
} from "@/app/projecten/actions";
import { getPostHogServer } from "@/lib/posthog/server";

interface Props {
  project: ProjectWithData;
  workCatalog: {
    id: string;
    type: string;
    label: string;
    unit: string;
    applicable_room_types: string[];
  }[];
  userId: string;
}

const ROOM_COLORS: Record<string, string> = {
  living: "#fef3c7",
  kitchen: "#dbeafe",
  bedroom: "#dcfce7",
  bathroom: "#cffafe",
  hallway: "#f3f4f6",
  storage: "#e5e7eb",
  stairs: "#fef9c3",
  outdoor: "#d1fae5",
  landing: "#f3e8ff",
  closet: "#fce7f3",
};

const ROOM_STROKES: Record<string, string> = {
  living: "#f59e0b",
  kitchen: "#3b82f6",
  bedroom: "#22c55e",
  bathroom: "#06b6d4",
  hallway: "#6b7280",
  storage: "#4b5563",
  stairs: "#eab308",
  outdoor: "#10b981",
  landing: "#a855f7",
  closet: "#ec4899",
};

function toIso(
  x: number,
  y: number,
  scale: number,
  offsetX: number,
  offsetY: number
) {
  const isoX = (x - y) * scale + offsetX;
  const isoY = (x + y) * scale * 0.5 + offsetY;
  return { x: isoX, y: isoY };
}

export default function ProjectDetailClient({
  project,
  workCatalog,
  userId,
}: Props) {
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"iso" | "original">("iso");
  const [isPending, startTransition] = useTransition();
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryTo, setInquiryTo] = useState("");
  const [inquirySubject, setInquirySubject] = useState("");
  const [inquiryText, setInquiryText] = useState("");
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);

  const activeFloor = project.floors[activeFloorIndex];
  const totalWork = project.floors.reduce(
    (s, f) =>
      s +
      f.rooms.reduce((rs, r) => rs + (r.room_work_items?.length ?? 0), 0),
    0
  );

  const handleRoomUpdate = useCallback(
    (roomId: string, updates: Partial<WorkItemRow>) => {
      startTransition(async () => {
        if (updates.status !== undefined) {
          await updateWorkItemStatus(
            roomId,
            updates.status,
            updates.notes ?? null
          );
        }
      });
    },
    []
  );

  const toggleWorkItem = useCallback(
    (roomId: string, workType: string) => {
      startTransition(async () => {
        await upsertRoomWorkItem({ room_id: roomId, work_type: workType });
      });
    },
    []
  );

  // SVG layout
  const svgWidth = 800;
  const svgHeight = 600;
  const padding = 60;

  const rooms = activeFloor?.rooms ?? [];
  const maxW = Math.max(
    ...rooms.map((r) => {
      const p = r.position_json as { x: number; y: number; width: number; depth: number };
      return (p?.x ?? 0) + (p?.width ?? 0);
    }),
    activeFloor?.building_width ?? 0
  );
  const maxD = Math.max(
    ...rooms.map((r) => {
      const p = r.position_json as { x: number; y: number; width: number; depth: number };
      return (p?.y ?? 0) + (p?.depth ?? 0);
    }),
    activeFloor?.building_depth ?? 0
  );

  const availW = svgWidth - padding * 2;
  const availH = svgHeight - padding * 2;
  const scaleX = availW / ((maxW + maxD) * 1.2);
  const scaleY = availH / ((maxW + maxD) * 0.7);
  const scale = Math.min(scaleX, scaleY, 80);
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const offsetX = centerX - ((maxW - maxD) * scale) / 2;
  const offsetY = centerY - ((maxW + maxD) * scale * 0.25);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const getRoomPolygon = (room: (typeof rooms)[0]) => {
    const p = room.position_json as { x: number; y: number; width: number; depth: number };
    const pts = [
      toIso(p.x, p.y, scale, offsetX, offsetY),
      toIso(p.x + p.width, p.y, scale, offsetX, offsetY),
      toIso(p.x + p.width, p.y + p.depth, scale, offsetX, offsetY),
      toIso(p.x, p.y + p.depth, scale, offsetX, offsetY),
    ];
    return pts.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  };

  const getRoomWallPolygons = (room: (typeof rooms)[0]) => {
    const p = room.position_json as { x: number; y: number; width: number; depth: number };
    const wallH = 8;
    const base = [
      toIso(p.x, p.y, scale, offsetX, offsetY),
      toIso(p.x + p.width, p.y, scale, offsetX, offsetY),
      toIso(p.x + p.width, p.y + p.depth, scale, offsetX, offsetY),
      toIso(p.x, p.y + p.depth, scale, offsetX, offsetY),
    ];
    const top = base.map((b) => ({ x: b.x, y: b.y - wallH }));

    const w1 = [base[0], base[1], top[1], top[0]];
    const w2 = [base[1], base[2], top[2], top[1]];

    return [
      w1.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" "),
      w2.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" "),
    ];
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/projecten"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {project.name}
                </h1>
                <p className="text-xs text-gray-500">
                  {project.floors.length} verdiepingen ·{" "}
                  {project.floors.reduce((s, f) => s + f.rooms.length, 0)}{" "}
                  ruimtes · {totalWork} werkzaamheden
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {project.email_address && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {project.email_address}
                </div>
              )}
              <button
                onClick={() => setShowInquiry(true)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                📧 Uitvraag versturen
              </button>
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
                {project.floors.map((floor, index) => (
                  <button
                    key={floor.id}
                    onClick={() => {
                      setActiveFloorIndex(index);
                      setSelectedRoomId(null);
                    }}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      index === activeFloorIndex
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-pulse">
          Opslaan...
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SVG Viewer */}
          <div className="flex-1">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {activeFloor?.name}
                </h3>
                <div className="flex items-center gap-3">
                  {activeFloor?.image_url && (
                    <div className="flex items-center rounded-lg bg-gray-100 p-0.5">
                      <button
                        onClick={() => setViewMode("iso")}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          viewMode === "iso"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Isometrisch
                      </button>
                      <button
                        onClick={() => setViewMode("original")}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          viewMode === "original"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Origineel
                      </button>
                    </div>
                  )}
                  <span className="text-xs text-gray-500">
                    {activeFloor?.rooms.length} ruimtes ·{" "}
                    {activeFloor?.building_width?.toFixed(2) ?? "?"}m ×{" "}
                    {activeFloor?.building_depth?.toFixed(2) ?? "?"}m
                  </span>
                </div>
              </div>

              {viewMode === "original" && activeFloor?.image_url ? (
                <div
                  className="w-full flex items-center justify-center bg-gray-100 p-4"
                  style={{ minHeight: 400 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeFloor.image_url}
                    alt={activeFloor.name}
                    className="max-h-[500px] w-auto rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto bg-slate-50"
                  style={{ minHeight: 400 }}
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {[...rooms]
                    .sort((a, b) => {
                      const pa = a.position_json as { x: number; y: number; width: number; depth: number };
                      const pb = b.position_json as { x: number; y: number; width: number; depth: number };
                      const ca = toIso(
                        pa.x + pa.width / 2,
                        pa.y + pa.depth / 2,
                        scale,
                        offsetX,
                        offsetY
                      );
                      const cb = toIso(
                        pb.x + pb.width / 2,
                        pb.y + pb.depth / 2,
                        scale,
                        offsetX,
                        offsetY
                      );
                      return ca.y - cb.y;
                    })
                    .map((room) => {
                      const isSelected = selectedRoomId === room.id;
                      const isHovered = hoveredRoomId === room.id;
                      const color = ROOM_COLORS[room.type] || "#f3f4f6";
                      const stroke = ROOM_STROKES[room.type] || "#6b7280";
                      const wallPolys = getRoomWallPolygons(room);
                      const roomPoly = getRoomPolygon(room);
                      const rp = room.position_json as { x: number; y: number; width: number; depth: number };
                      const center = toIso(
                        rp.x + rp.width / 2,
                        rp.y + rp.depth / 2,
                        scale,
                        offsetX,
                        offsetY
                      );

                      return (
                        <g
                          key={room.id}
                          className="cursor-pointer transition-opacity"
                          onMouseEnter={() => setHoveredRoomId(room.id)}
                          onMouseLeave={() => setHoveredRoomId(null)}
                          onClick={() =>
                            setSelectedRoomId(isSelected ? null : room.id)
                          }
                          style={{ opacity: isHovered || isSelected ? 1 : 0.9 }}
                        >
                          {wallPolys.map((poly, wi) => (
                            <polygon
                              key={wi}
                              points={poly}
                              fill={stroke}
                              opacity={0.15}
                              stroke="none"
                            />
                          ))}
                          <polygon
                            points={roomPoly}
                            fill={color}
                            stroke={isSelected ? "#2563eb" : stroke}
                            strokeWidth={isSelected ? 3 : 1.5}
                            opacity={isHovered ? 0.95 : 0.85}
                            style={{ transition: "all 0.15s ease" }}
                          />
                          {rp.width * scale > 30 && rp.depth * scale > 20 && (
                            <>
                              <text
                                x={center.x}
                                y={center.y - 4}
                                textAnchor="middle"
                                fill="#1f2937"
                                style={{
                                  fontSize: 11,
                                  pointerEvents: "none",
                                  fontWeight: 500,
                                }}
                              >
                                {room.name}
                              </text>
                              <text
                                x={center.x}
                                y={center.y + 10}
                                textAnchor="middle"
                                fill="#4b5563"
                                style={{ fontSize: 10, pointerEvents: "none" }}
                              >
                                {room.area.toFixed(1)} m²
                              </text>
                            </>
                          )}
                          {(room.room_work_items?.length ?? 0) > 0 && (
                            <g
                              transform={`translate(${center.x + 20}, ${center.y - 20})`}
                            >
                              <circle r="8" fill="#2563eb" opacity={0.9} />
                              <text
                                y="3"
                                textAnchor="middle"
                                fill="white"
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  pointerEvents: "none",
                                }}
                              >
                                {room.room_work_items?.length}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                </svg>
              )}
            </div>

            {/* Room list table */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">
                  Ruimteoverzicht
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">
                        Ruimte
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        Type
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        Vloer (m²)
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        Muren (m²)
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        Plafond (m²)
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        Werkzaamheden
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rooms.map((room) => (
                      <tr
                        key={room.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedRoomId === room.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() =>
                          setSelectedRoomId(
                            selectedRoomId === room.id ? null : room.id
                          )
                        }
                      >
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {room.name}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 capitalize">
                          {room.type}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {room.floor_area.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {room.wall_area.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {room.ceiling_area.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {(room.room_work_items?.length ?? 0) > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {room.room_work_items?.length}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium text-gray-900">
                    <tr>
                      <td className="px-4 py-2" colSpan={2}>
                        Totaal
                      </td>
                      <td className="px-4 py-2 text-right">
                        {rooms.reduce((s, r) => s + r.floor_area, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {rooms.reduce((s, r) => s + r.wall_area, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {rooms
                          .reduce((s, r) => s + r.ceiling_area, 0)
                          .toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {rooms.reduce(
                          (s, r) => s + (r.room_work_items?.length ?? 0),
                          0
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900">
                  {selectedRoom ? selectedRoom.name : "Selecteer een ruimte"}
                </h3>
                {selectedRoom && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedRoom.width.toFixed(2)}m ×{" "}
                    {selectedRoom.depth.toFixed(2)}m ·{" "}
                    {selectedRoom.area.toFixed(2)} m²
                  </p>
                )}
              </div>

              {selectedRoom ? (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedRoom.floor_area.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                        Vloer m²
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedRoom.wall_area.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                        Muren m²
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedRoom.ceiling_area.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                        Plafond m²
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Werkzaamheden
                    </h4>
                    <div className="space-y-1.5">
                      {workCatalog.map((catalogItem) => {
                        const applicable =
                          catalogItem.applicable_room_types.length === 0 ||
                          catalogItem.applicable_room_types.includes(
                            selectedRoom.type
                          );
                        if (!applicable) return null;

                        const active = selectedRoom.room_work_items?.some(
                          (w) => w.work_type === catalogItem.type
                        );
                        const item = selectedRoom.room_work_items?.find(
                          (w) => w.work_type === catalogItem.type
                        );

                        return (
                          <button
                            key={catalogItem.type}
                            onClick={() =>
                              toggleWorkItem(
                                selectedRoom.id,
                                catalogItem.type
                              )
                            }
                            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                              active
                                ? "border-blue-300 bg-blue-50 text-blue-800"
                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                            }`}
                          >
                            <span>{catalogItem.label}</span>
                            {active && (
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedRoom.room_work_items &&
                    selectedRoom.room_work_items.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Geselecteerde werkzaamheden
                        </h4>
                        <div className="space-y-2">
                          {selectedRoom.room_work_items.map((item) => {
                            const catalogItem = workCatalog.find(
                              (c) => c.type === item.work_type
                            );
                            return (
                              <div
                                key={item.id}
                                className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">
                                    {catalogItem?.label ?? item.work_type}
                                  </span>
                                  <button
                                    onClick={() =>
                                      toggleWorkItem(
                                        selectedRoom.id,
                                        item.work_type
                                      )
                                    }
                                    className="text-gray-400 hover:text-red-500 text-xs"
                                  >
                                    Verwijder
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {(
                                    [
                                      "pending",
                                      "in_progress",
                                      "completed",
                                    ] as const
                                  ).map((status) => (
                                    <button
                                      key={status}
                                      onClick={() => {
                                        startTransition(async () => {
                                          await updateWorkItemStatus(
                                            item.id,
                                            status,
                                            item.notes
                                          );
                                        });
                                      }}
                                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors ${
                                        item.status === status
                                          ? status === "completed"
                                            ? "bg-green-100 text-green-700"
                                            : status === "in_progress"
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-gray-200 text-gray-700"
                                          : "bg-white text-gray-400 hover:text-gray-600 border border-gray-200"
                                      }`}
                                    >
                                      {status === "pending"
                                        ? "Open"
                                        : status === "in_progress"
                                          ? "Bezig"
                                          : "Klaar"}
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  placeholder="Notities..."
                                  defaultValue={item.notes ?? ""}
                                  onBlur={(e) => {
                                    if (e.target.value !== item.notes) {
                                      startTransition(async () => {
                                        await updateWorkItemStatus(
                                          item.id,
                                          item.status,
                                          e.target.value || null
                                        );
                                      });
                                    }
                                  }}
                                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                  rows={2}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-gray-500">
                  <div className="text-3xl mb-2">👆</div>
                  Klik op een ruimte in de plattegrond om werkzaamheden toe te
                  voegen
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Offerte-uitvraag versturen
                </h3>
                <p className="text-xs text-gray-500">
                  Vanaf {project.email_address}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInquiry(false);
                  setInquiryError(null);
                  setInquirySuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setInquiryLoading(true);
                setInquiryError(null);
                setInquirySuccess(null);

                try {
                  const res = await fetch("/api/send-inquiry", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      projectId: project.id,
                      to: inquiryTo.split(",").map((s) => s.trim()),
                      subject: inquirySubject,
                      text: inquiryText,
                    }),
                  });

                  const data = await res.json();

                  if (!res.ok) {
                    throw new Error(data.error || "Versturen mislukt");
                  }

                  setInquirySuccess("Uitvraag succesvol verstuurd!");
                  setInquiryTo("");
                  setInquirySubject("");
                  setInquiryText("");
                } catch (err) {
                  setInquiryError(
                    err instanceof Error ? err.message : "Versturen mislukt"
                  );
                } finally {
                  setInquiryLoading(false);
                }
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aannemer(s) e-mail
                </label>
                <input
                  type="text"
                  value={inquiryTo}
                  onChange={(e) => setInquiryTo(e.target.value)}
                  placeholder="aannemer@voorbeeld.nl, tweede@bedrijf.nl"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Meerdere? Scheid met komma’s
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Onderwerp
                </label>
                <input
                  type="text"
                  value={inquirySubject}
                  onChange={(e) => setInquirySubject(e.target.value)}
                  placeholder="Offerte-aanvraag verbouwing"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bericht
                </label>
                <textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="Beschrijf hier je werkzaamheden en vraag een offerte aan..."
                  required
                  rows={6}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {inquiryError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {inquiryError}
                </div>
              )}

              {inquirySuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  {inquirySuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInquiry(false);
                    setInquiryError(null);
                    setInquirySuccess(null);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={inquiryLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {inquiryLoading ? "Versturen..." : "Verstuur uitvraag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
