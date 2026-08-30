"use client";

import { useState, useCallback } from "react";
import { IngestResult, Project, Floor, Room } from "@/types/floorplan";

interface FloorUploaderProps {
  onProjectCreated: (project: Project) => void;
}

function createDemoProject(): Project {
  const STANDARD_HEIGHT = 2.45;
  const makeRoom = (
    id: string,
    name: string,
    type: string,
    width: number,
    depth: number,
    x: number,
    y: number
  ): Room => {
    const area = parseFloat((width * depth).toFixed(2));
    const perimeter = 2 * (width + depth);
    const wallArea = parseFloat((perimeter * STANDARD_HEIGHT).toFixed(2));
    return {
      id,
      name,
      type,
      width,
      depth,
      area,
      floorArea: area,
      wallArea,
      ceilingArea: area,
      position: { x, y, width, depth },
      workItems: [],
    };
  };

  const floor0: Floor = {
    id: "floor-0",
    name: "Begane grond",
    level: 0,
    buildingWidth: 5.14,
    buildingDepth: 9.97,
    imageUrl: "",
    rooms: [
      makeRoom("r0-0", "Woonkamer", "living", 4.35, 5.14, 0, 4.62),
      makeRoom("r0-1", "Keuken", "kitchen", 3.2, 3.12, 0, 1.42),
      makeRoom("r0-2", "Overloop", "hallway", 3.97, 1.78, 3.12, 1.42),
      makeRoom("r0-3", "Toilet", "bathroom", 1.43, 0.86, 3.12, 0.56),
      makeRoom("r0-4", "Berging", "storage", 1.43, 0.92, 3.98, 0.56),
      makeRoom("r0-5", "Terras", "outdoor", 2.01, 5.14, 0, 9.97),
    ],
  };

  const floor1: Floor = {
    id: "floor-1",
    name: "Eerste verdieping",
    level: 1,
    buildingWidth: 5.14,
    buildingDepth: 9.97,
    imageUrl: "",
    rooms: [
      makeRoom("r1-0", "Slaapkamer", "bedroom", 2.72, 5.14, 0, 0),
      makeRoom("r1-1", "Badkamer", "bathroom", 2.39, 3.13, 0, 2.72),
      makeRoom("r1-2", "Overloop", "hallway", 3.4, 1.91, 3.13, 2.72),
      makeRoom("r1-3", "Kast", "closet", 0.88, 0.9, 4.14, 2.72),
      makeRoom("r1-4", "Slaapkamer", "bedroom", 2.47, 2.64, 0, 5.11),
      makeRoom("r1-5", "Slaapkamer", "bedroom", 3.38, 2.4, 2.64, 6.57),
    ],
  };

  const floor2: Floor = {
    id: "floor-2",
    name: "Tweede verdieping",
    level: 2,
    buildingWidth: 5.14,
    buildingDepth: 9.97,
    imageUrl: "",
    rooms: [
      makeRoom("r2-0", "Berging", "storage", 2.12, 5.14, 0, 0),
      makeRoom("r2-1", "Badkamer", "bathroom", 1.25, 2.16, 0, 2.12),
      makeRoom("r2-2", "Slaapkamer", "bedroom", 6.42, 3.1, 0, 3.37),
      makeRoom("r2-3", "Hal", "hallway", 5.06, 2.04, 3.1, 3.37),
      makeRoom("r2-4", "Overkapping", "outdoor", 2.85, 5.14, 0, 9.97),
    ],
  };

  return {
    id: `proj-demo-${Date.now()}`,
    name: "Demo Project - Hoofdstraat 12",
    floors: [floor0, floor1, floor2],
    createdAt: new Date().toISOString(),
  };
}

export default function FloorUploader({ onProjectCreated }: FloorUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...dropped]);
    setError(null);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...selected]);
    setError(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const STANDARD_HEIGHT = 2.45;

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const floors: Floor[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await fetch("/api/ingest", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Failed to process ${file.name}`);
        }

        const data = await res.json();
        const result: IngestResult = data.result;

        const rooms: Room[] = result.rooms.map((r, idx) => {
          const perimeter = 2 * (r.width + r.depth);
          const wallArea = parseFloat((perimeter * STANDARD_HEIGHT).toFixed(2));
          const floorArea = parseFloat(r.area.toFixed(2));
          return {
            id: `room-${i}-${idx}`,
            name: r.name,
            type: r.type,
            width: r.width,
            depth: r.depth,
            area: floorArea,
            floorArea,
            wallArea,
            ceilingArea: floorArea,
            position: r.position,
            workItems: [],
          };
        });

        floors.push({
          id: `floor-${i}`,
          name: result.floorName || `Verdieping ${i}`,
          level: result.floorLevel ?? i,
          buildingWidth: result.buildingWidth,
          buildingDepth: result.buildingDepth,
          rooms,
          imageUrl: URL.createObjectURL(file),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setIsProcessing(false);
        return;
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    floors.sort((a, b) => a.level - b.level);

    const project: Project = {
      id: `proj-${Date.now()}`,
      name: projectName || "Nieuw project",
      floors,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("projects") || "[]");
    existing.push(project);
    localStorage.setItem("projects", JSON.stringify(existing));

    onProjectCreated(project);
    setIsProcessing(false);
    setFiles([]);
    setProjectName("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Projectnaam
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Bijv. Renovatie Hoofdstraat 12"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileSelect}
        />
        <div className="space-y-2">
          <div className="text-4xl">🏠</div>
          <p className="text-sm font-medium text-gray-700">
            Sleep plattegronden hierheen, of klik om te uploaden
          </p>
          <p className="text-xs text-gray-500">
            Ondersteunt meerdere verdiepingen tegelijk
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Geselecteerde bestanden ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                <span className="truncate max-w-[80%]">{file.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  Verwijder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>AI analyseert plattegronden...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={processFiles}
        disabled={files.length === 0 || isProcessing}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? "Bezig met analyseren..." : "Start AI-analyse"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-400">of</span>
        </div>
      </div>

      <button
        onClick={() => {
          const demo = createDemoProject();
          const existing = JSON.parse(localStorage.getItem("projects") || "[]");
          existing.push(demo);
          localStorage.setItem("projects", JSON.stringify(existing));
          onProjectCreated(demo);
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        🎲 Laad demo project
      </button>
    </div>
  );
}
