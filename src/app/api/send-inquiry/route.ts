import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInquiryEmail, isEmailEnabled } from "@/lib/email/client";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    if (!isEmailEnabled()) {
      return NextResponse.json(
        { error: "E-mail niet geconfigureerd" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { projectId, to, subject, text, html } = body;

    if (!projectId || !to || !subject || !text) {
      return NextResponse.json(
        { error: "Ontbrekende velden: projectId, to, subject, text" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, email_address, name")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    if (!project.email_address) {
      return NextResponse.json(
        { error: "Project heeft geen e-mailadres" },
        { status: 400 }
      );
    }

    const toList = Array.isArray(to) ? to : [to];

    // Send email via Resend
    const result = await sendInquiryEmail({
      from: project.email_address,
      to: toList,
      subject,
      text,
      html,
      replyTo: project.email_address,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return NextResponse.json(
        { error: `E-mail kon niet worden verstuurd: ${result.error.message}` },
        { status: 500 }
      );
    }

    // Store outbound message in database
    const { error: msgError } = await supabase.from("messages").insert({
      project_id: projectId,
      direction: "outbound",
      from_address: project.email_address,
      to_address: toList.join(", "),
      subject,
      body_text: text,
      body_html: html ?? null,
      provider_message_id: result.data?.id ?? null,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    if (msgError) {
      console.error("Message storage error:", msgError);
      // Don't fail the request, just log
    }

    return NextResponse.json({ success: true, messageId: result.data?.id });
  } catch (error) {
    console.error("Send inquiry error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
