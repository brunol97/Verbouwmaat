import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const projectDomain = process.env.PROJECT_DOMAIN ?? "verbouwmaat.nl";

export const resend = apiKey ? new Resend(apiKey) : null;

export function isEmailEnabled(): boolean {
  return resend !== null && !!projectDomain;
}

export function getProjectDomain(): string {
  return projectDomain;
}

export function generateProjectEmail(projectId: string): string {
  const shortId = projectId.slice(0, 8);
  return `project-${shortId}@${projectDomain}`;
}

export async function sendInquiryEmail(options: {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  if (!resend) {
    throw new Error("Resend niet geconfigureerd. Set RESEND_API_KEY.");
  }

  const result = await resend.emails.send({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo ?? options.from,
  });

  return result;
}
