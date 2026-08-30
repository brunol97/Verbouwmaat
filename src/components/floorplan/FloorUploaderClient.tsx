"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/projecten/actions";
import { IngestResult } from "@/types/floorplan";
import { isAiEnabled } from "@/lib/openai/client";

export default function FloorUploaderClient() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const STANDARD_HEIGHT = 2.45;

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...dropped]);
    setError(null);
  }, []);

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      setFiles((prev) => [...prev, ...selected]);
      setError(null);
    },
    []
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const floorInputs: {
      name: string;
      level: number;
      building_width: number | null;
      building_depth: number | null;
      image_url: string | null;
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
    }[] = [];

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

        const rooms = result.rooms.map((r) => {
          const perimeter = 2 * (r.width + r.depth);
          const wallArea = parseFloat(
            (perimeter * STANDARD_HEIGHT).toFixed(2)
          );
          const floorArea = parseFloat(r.area.toFixed(2));
          return {
            name: r.name,
            type: r.type,
            width: r.width,
            depth: r.depth,
            area: floorArea,
            floor_area: floorArea,
            wall_area: wallArea,
            ceiling_area: floorArea,
            position_json: r.position,
          };
        });

        floorInputs.push({
          name: result.floorName || `Verdieping ${i}`,
          level: result.floorLevel ?? i,
          building_width: result.buildingWidth ?? null,
          building_depth: result.buildingDepth ?? null,
          image_url: null,
          rooms,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setIsProcessing(false);
        return;
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    floorInputs.sort((a, b) => a.level - b.level);

    try {
      const projectId = await createProject({
        name: projectName || "Nieuw project",
        floors: floorInputs,
      });
      router.push(`/projecten/${projectId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }

    setIsProcessing(false);
  };

  const loadDemo = async () => {
    const mkRoom = (
      name: string,
      type: string,
      width: number,
      depth: number,
      x: number,
      y: number
    ) => {
      const area = parseFloat((width * depth).toFixed(2));
      const perimeter = 2 * (width + depth);
      const wallArea = parseFloat((perimeter * STANDARD_HEIGHT).toFixed(2));
      return {
        name,
        type,
        width,
        depth,
        area,
        floor_area: area,
        wall_area: wallArea,
        ceiling_area: area,
        position_json: { x, y, width, depth },
      };
    };

    try {
      const projectId = await createProject({
        name: projectName || "Demo Project — Hoofdstraat 12",
        floors: [
          {
            name: "Begane grond",
            level: 0,
            building_width: 5.14,
            building_depth: 9.97,
            image_url: null,
            rooms: [
              mkRoom("Woonkamer", "living", 4.35, 5.14, 0, 4.62),
              mkRoom("Keuken", "kitchen", 3.2, 3.12, 0, 1.42),
              mkRoom("Overloop", "hallway", 3.97, 1.78, 3.12, 1.42),
              mkRoom("Toilet", "bathroom", 1.43, 0.86, 3.12, 0.56),
              mkRoom("Berging", "storage", 1.43, 0.92, 3.98, 0.56),
              mkRoom("Terras", "outdoor", 2.01, 5.14, 0, 9.97),
            ],
          },
          {
            name: "Eerste verdieping",
            level: 1,
            building_width: 5.14,
            building_depth: 9.97,
            image_url: null,
            rooms: [
              mkRoom("Slaapkamer", "bedroom", 2.72, 5.14, 0, 0),
              mkRoom("Badkamer", "bathroom", 2.39, 3.13, 0, 2.72),
              mkRoom("Overloop", "hallway", 3.4, 1.91, 3.13, 2.72),
              mkRoom("Kast", "closet", 0.88, 0.9, 4.14, 2.72),
              mkRoom("Slaapkamer", "bedroom", 2.47, 2.64, 0, 5.11),
              mkRoom("Slaapkamer", "bedroom", 3.38, 2.4, 2.64, 6.57),
            ],
          },
          {
            name: "Tweede verdieping",
            level: 2,
            building_width: 5.14,
            building_depth: 9.97,
            image_url: null,
            rooms: [
              mkRoom("Berging", "storage", 2.12, 5.14, 0, 0),
              mkRoom("Badkamer", "bathroom", 1.25, 2.16, 0, 2.12),
              mkRoom("Slaapkamer", "bedroom", 6.42, 3.1, 0, 3.37),
              mkRoom("Hal", "hallway", 5.06, 2.04, 3.1, 3.37),
              mkRoom("Overkapping", "outdoor", 2.85, 5.14, 0, 9.97),
            ],
          },
        ],
      });
      router.push(`/projecten/${projectId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
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

      {!isAiEnabled() && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Geen AI-provider geconfigureerd.</strong> Voeg{" "}
          <code className="font-mono bg-amber-100 px-1 rounded">OPENCODE_API_KEY</code>{" "}
          of{" "}
          <code className="font-mono bg-amber-100 px-1 rounded">OPENAI_API_KEY</code>{" "}
          toe aan je <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code>{" "}
          om AI-analyse te gebruiken.
        </div>
      )}

      <button
        onClick={processFiles}
        disabled={files.length === 0 || isProcessing || !isAiEnabled()}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing
          ? "Bezig met analyseren..."
          : isAiEnabled()
            ? "Start AI-analyse"
            : "AI-analyse niet beschikbaar"}
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
        onClick={loadDemo}
        disabled={isProcessing}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        🎲 Laad demo project
      </button>
    </div>
  );
}
