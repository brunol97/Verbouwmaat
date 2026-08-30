import { NextRequest, NextResponse } from "next/server";
import { openai, getVisionModel, isAiEnabled } from "@/lib/openai/client";
import { IngestResult } from "@/types/floorplan";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Je bent een expert in het analyseren van bouwtekeningen en plattegronden van woningen.

Analyseer de plattegrond afbeelding en extraheer gestructureerde data.

INSTRUCTIES:
1. Identificeer de verdieping naam (bijv. "Begane grond", "Eerste verdieping", "Tweede verdieping", "Zolder")
2. Bepaal het verdiepingsnummer (0 = begane grond, 1 = eerste verdieping, 2 = tweede verdieping)
3. Bepaal de totale buitenafmetingen van het gebouw in meters (breedte = horizontaal, diepte = verticaal)
4. Identificeer ALLE ruimtes op de plattegrond. Gebruik de naam zoals op de tekening staat.
5. Voor elke ruimte:
   - Geschatte breedte en diepte in meters (afgerond op 2 decimalen)
   - Oppervlakte in m² (breedte × diepte, afgerond op 2 decimalen)
   - Position: x, y, width, depth in meters. x,y is de positie van de linkerbovenhoek van de ruimte ten opzichte van de linkerbovenhoek van het GEBOUW. Gebruik de schaal en afmetingsmarkeringen op de tekening om dit te bepalen.
   - Type: kies uit "living", "kitchen", "bedroom", "bathroom", "hallway", "storage", "stairs", "outdoor", "landing", "closet"

Gebruik de schaalmarkeringen en afmetingslijnen op de plattegrond om exacte meters te bepalen.

Geef ALLEEN geldige JSON terug zonder markdown code blocks, zonder uitleg. De JSON moet exact dit formaat hebben:

{
  "floorName": "string",
  "floorLevel": number,
  "buildingWidth": number,
  "buildingDepth": number,
  "rooms": [
    {
      "name": "string",
      "type": "string",
      "width": number,
      "depth": number,
      "area": number,
      "position": { "x": number, "y": number, "width": number, "depth": number }
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/webp";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    if (!openai) {
      return NextResponse.json(
        { error: "AI provider not configured. Set OPENCODE_API_KEY or OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const response = await openai.chat.completions.create({
      model: getVisionModel(),
      max_tokens: 4000,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as IngestResult;

    // Validate structure
    if (!parsed.floorName || !Array.isArray(parsed.rooms)) {
      return NextResponse.json(
        { error: "Invalid response structure from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: parsed });
  } catch (error) {
    console.error("Ingest error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
