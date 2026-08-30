"use client";

import { useState, useMemo } from "react";
import { Floor, Room, WorkType, WORK_TYPE_LABELS } from "@/types/floorplan";

interface DiagonalFloorViewerProps {
  floor: Floor;
  onRoomUpdate: (roomId: string, updates: Partial<Room>) => void;
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

function toIso(x: number, y: number, scale: number, offsetX: number, offsetY: number) {
  const isoX = (x - y) * scale + offsetX;
  const isoY = (x + y) * scale * 0.5 + offsetY;
  return { x: isoX, y: isoY };
}

export default function DiagonalFloorViewer({
  floor,
  onRoomUpdate,
}: DiagonalFloorViewerProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"iso" | "original">("iso");

  const svgWidth = 800;
  const svgHeight = 600;
  const padding = 60;

  const { rooms, scale, offsetX, offsetY } = useMemo(() => {
    const maxW = Math.max(...floor.rooms.map((r) => r.position.x + r.position.width), floor.buildingWidth);
    const maxD = Math.max(...floor.rooms.map((r) => r.position.y + r.position.depth), floor.buildingDepth);

    const availW = svgWidth - padding * 2;
    const availH = svgHeight - padding * 2;

    const scaleX = availW / ((maxW + maxD) * 1.2);
    const scaleY = availH / ((maxW + maxD) * 0.7);
    const scale = Math.min(scaleX, scaleY, 80);

    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const offsetX = centerX - ((maxW - maxD) * scale) / 2;
    const offsetY = centerY - ((maxW + maxD) * scale * 0.25);

    return { rooms: floor.rooms, scale, offsetX, offsetY };
  }, [floor]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const workTypes: WorkType[] = [
    "stucen",
    "vloerverwarming",
    "behangen",
    "schilderen",
    "tegelen",
    "vloerleggen",
    "elektra",
    "sanitair",
    "timmerwerk",
  ];

  const toggleWorkItem = (room: Room, type: WorkType) => {
    const exists = room.workItems.find((w) => w.type === type);
    if (exists) {
      onRoomUpdate(room.id, {
        workItems: room.workItems.filter((w) => w.type !== type),
      });
    } else {
      onRoomUpdate(room.id, {
        workItems: [
          ...room.workItems,
          { id: `work-${Date.now()}-${type}`, type, status: "pending" },
        ],
      });
    }
  };

  const getRoomPolygon = (room: Room) => {
    const p = room.position;
    const pts = [
      toIso(p.x, p.y, scale, offsetX, offsetY),
      toIso(p.x + p.width, p.y, scale, offsetX, offsetY),
      toIso(p.x + p.width, p.y + p.depth, scale, offsetX, offsetY),
      toIso(p.x, p.y + p.depth, scale, offsetX, offsetY),
    ];
    return pts.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  };

  const getRoomWallPolygons = (room: Room) => {
    const p = room.position;
    const wallH = 8; // visual wall height in iso units
    const base = [
      toIso(p.x, p.y, scale, offsetX, offsetY),
      toIso(p.x + p.width, p.y, scale, offsetX, offsetY),
      toIso(p.x + p.width, p.y + p.depth, scale, offsetX, offsetY),
      toIso(p.x, p.y + p.depth, scale, offsetX, offsetY),
    ];
    const top = base.map((b) => ({ x: b.x, y: b.y - wallH }));

    // Back-left wall
    const w1 = [
      base[0],
      base[1],
      top[1],
      top[0],
    ];
    // Back-right wall
    const w2 = [
      base[1],
      base[2],
      top[2],
      top[1],
    ];

    return [
      w1.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" "),
      w2.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" "),
    ];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* SVG Viewer */}
      <div className="flex-1">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {floor.name}
            </h3>
            <div className="flex items-center gap-3">
              {floor.imageUrl && (
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
                {floor.rooms.length} ruimtes · {floor.buildingWidth.toFixed(2)}m × {floor.buildingDepth.toFixed(2)}m
              </span>
            </div>
          </div>

          {viewMode === "original" && floor.imageUrl ? (
            <div className="w-full flex items-center justify-center bg-gray-100 p-4" style={{ minHeight: 400 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={floor.imageUrl}
                alt={floor.name}
                className="max-h-[500px] w-auto rounded-lg shadow-sm"
              />
            </div>
          ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto bg-slate-50"
            style={{ minHeight: 400 }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Render rooms in depth order (back to front) */}
            {[...rooms]
              .sort((a, b) => {
                const ca = toIso(
                  a.position.x + a.position.width / 2,
                  a.position.y + a.position.depth / 2,
                  scale,
                  offsetX,
                  offsetY
                );
                const cb = toIso(
                  b.position.x + b.position.width / 2,
                  b.position.y + b.position.depth / 2,
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
                const center = toIso(
                  room.position.x + room.position.width / 2,
                  room.position.y + room.position.depth / 2,
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
                    onClick={() => setSelectedRoomId(isSelected ? null : room.id)}
                    style={{ opacity: isHovered || isSelected ? 1 : 0.9 }}
                  >
                    {/* Shadow / depth walls */}
                    {wallPolys.map((poly, wi) => (
                      <polygon
                        key={wi}
                        points={poly}
                        fill={stroke}
                        opacity={0.15}
                        stroke="none"
                      />
                    ))}

                    {/* Floor surface */}
                    <polygon
                      points={roomPoly}
                      fill={color}
                      stroke={isSelected ? "#2563eb" : stroke}
                      strokeWidth={isSelected ? 3 : 1.5}
                      opacity={isHovered ? 0.95 : 0.85}
                      style={{ transition: "all 0.15s ease" }}
                    />

                    {/* Room label */}
                    {room.position.width * scale > 30 && room.position.depth * scale > 20 && (
                      <>
                        <text
                          x={center.x}
                          y={center.y - 4}
                          textAnchor="middle"
                          className="text-[10px] font-medium select-none"
                          fill="#1f2937"
                          style={{ fontSize: 11, pointerEvents: "none" }}
                        >
                          {room.name}
                        </text>
                        <text
                          x={center.x}
                          y={center.y + 10}
                          textAnchor="middle"
                          className="text-[9px] select-none"
                          fill="#4b5563"
                          style={{ fontSize: 10, pointerEvents: "none" }}
                        >
                          {room.area.toFixed(1)} m²
                        </text>
                      </>
                    )}

                    {/* Work indicators */}
                    {room.workItems.length > 0 && (
                      <g transform={`translate(${center.x + 20}, ${center.y - 20})`}>
                        <circle r="8" fill="#2563eb" opacity={0.9} />
                        <text
                          y="3"
                          textAnchor="middle"
                          fill="white"
                          style={{ fontSize: 9, fontWeight: 700, pointerEvents: "none" }}
                        >
                          {room.workItems.length}
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
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900">Ruimteoverzicht</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Ruimte</th>
                  <th className="px-4 py-2 text-right font-medium">Type</th>
                  <th className="px-4 py-2 text-right font-medium">Vloer (m²)</th>
                  <th className="px-4 py-2 text-right font-medium">Muren (m²)</th>
                  <th className="px-4 py-2 text-right font-medium">Plafond (m²)</th>
                  <th className="px-4 py-2 text-right font-medium">Werkzaamheden</th>
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
                      {room.floorArea.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {room.wallArea.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {room.ceilingArea.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {room.workItems.length > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {room.workItems.length}
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
                    {rooms.reduce((s, r) => s + r.floorArea, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {rooms.reduce((s, r) => s + r.wallArea, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {rooms.reduce((s, r) => s + r.ceilingArea, 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {rooms.reduce((s, r) => s + r.workItems.length, 0)}
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
                {selectedRoom.width.toFixed(2)}m × {selectedRoom.depth.toFixed(2)}m ·{" "}
                {selectedRoom.area.toFixed(2)} m²
              </p>
            )}
          </div>

          {selectedRoom ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedRoom.floorArea.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Vloer m²
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedRoom.wallArea.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Muren m²
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedRoom.ceilingArea.toFixed(1)}
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
                  {workTypes.map((type) => {
                    const active = selectedRoom.workItems.some(
                      (w) => w.type === type
                    );
                    return (
                      <button
                        key={type}
                        onClick={() => toggleWorkItem(selectedRoom, type)}
                        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                          active
                            ? "border-blue-300 bg-blue-50 text-blue-800"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <span>{WORK_TYPE_LABELS[type]}</span>
                        {active && (
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedRoom.workItems.length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Geselecteerde werkzaamheden
                  </h4>
                  <div className="space-y-2">
                    {selectedRoom.workItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {WORK_TYPE_LABELS[item.type]}
                          </span>
                          <button
                            onClick={() => toggleWorkItem(selectedRoom, item.type)}
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            Verwijder
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(["pending", "in_progress", "completed"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                onRoomUpdate(selectedRoom.id, {
                                  workItems: selectedRoom.workItems.map((w) =>
                                    w.id === item.id ? { ...w, status } : w
                                  ),
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
                          value={item.notes || ""}
                          onChange={(e) => {
                            onRoomUpdate(selectedRoom.id, {
                              workItems: selectedRoom.workItems.map((w) =>
                                w.id === item.id
                                  ? { ...w, notes: e.target.value }
                                  : w
                              ),
                            });
                          }}
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">
              <div className="text-3xl mb-2">👆</div>
              Klik op een ruimte in de plattegrond om werkzaamheden toe te voegen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
