/**
 * Pi Software Factory Helper
 *
 * Project-local extension die het factory workflow vergemakkelijkt.
 * Werkt samen met .github/workflows/pi-factory.yml.
 *
 * Wat het doet:
 * 1. Bij session_start: detecteert of er .pi-factory/*.md context bestanden zijn
 * 2. Laadt automatisch het meest recente als context (via notify)
 * 3. /factory — toont alle klaarstaande factory issues
 * 4. /commit — git add -A → commit → push (handig na Pi implementatie)
 * 5. /done — commit + genereert TESTPLAN.md + push
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FACTORY_DIR = ".pi-factory";

function getFactoryContexts(): { number: string; title: string; path: string; modified: Date }[] {
  try {
    const files = readdirSync(FACTORY_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => {
        const path = join(FACTORY_DIR, f);
        const stat = statSync(path);
        const number = f.replace(".md", "");
        // Lees eerste regel als titel hint
        const firstLine = readFileSync(path, "utf-8").split("\n")[0] || "";
        const title = firstLine.replace(/^#+\s*/, "").slice(0, 60);
        return { number, title, path, modified: stat.mtime };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    return files;
  } catch {
    return [];
  }
}

export default function (pi: ExtensionAPI) {
  // ── Auto-detect bij session start ──
  pi.on("session_start", async (_event, ctx) => {
    const contexts = getFactoryContexts();
    if (contexts.length === 0) return;

    const latest = contexts[0];
    ctx.ui.notify(
      `🏭 Factory context gevonden: #${latest.number} — laad met /factory`,
      "info"
    );

    if (ctx.mode === "tui") {
      ctx.ui.setWidget("factory", [
        `🏭 Pi Factory — ${contexts.length} issue(s) klaar`,
        `Recentste: #${latest.number} — ${latest.title}`,
        `Run /factory om te zien, /commit om te pushen`,
      ]);
    }
  });

  // ── /factory — toon alle klaarstaande issues ──
  pi.registerCommand("factory", {
    description: "Toon alle Pi Software Factory context bestanden",
    handler: async (_args, ctx) => {
      const contexts = getFactoryContexts();
      if (contexts.length === 0) {
        ctx.ui.notify("Geen factory context bestanden gevonden.", "info");
        return;
      }

      const choice = await ctx.ui.select(
        `🏭 ${contexts.length} factory issue(s) klaar:`,
        contexts.map((c) => `#${c.number}: ${c.title}`)
      );

      if (!choice) return;

      const selected = contexts.find((c) => choice.startsWith(`#${c.number}`));
      if (!selected) return;

      // Laad context in editor zodat gebruiker het kan kopiëren of als prompt gebruiken
      const content = readFileSync(selected.path, "utf-8");
      ctx.ui.setEditorText(
        `Implementeer issue ${selected.number} volgens onderstaande context:\n\n${content}`
      );
      ctx.ui.notify(`Context #${selected.number} geladen in editor.`, "info");
    },
  });

  // ── /commit — snelle git commit + push ──
  pi.registerCommand("commit", {
    description: "Git add -A, commit, en push naar huidige branch",
    handler: async (args, ctx) => {
      const message = args || "🏭 [PI-Factory] Implementatie";

      ctx.ui.setStatus("factory", "Committing...");

      const add = await pi.exec("git", ["add", "-A"]);
      if (add.code !== 0) {
        ctx.ui.notify(`git add failed: ${add.stderr}`, "error");
        return;
      }

      // Check of er iets te committen is
      const status = await pi.exec("git", ["status", "--short"]);
      if (!status.stdout.trim()) {
        ctx.ui.notify("Niets te committen.", "info");
        ctx.ui.setStatus("factory", "");
        return;
      }

      const commit = await pi.exec("git", ["commit", "-m", message]);
      if (commit.code !== 0) {
        ctx.ui.notify(`git commit failed: ${commit.stderr}`, "error");
        ctx.ui.setStatus("factory", "");
        return;
      }

      const push = await pi.exec("git", ["push", "origin", "HEAD"]);
      if (push.code !== 0) {
        ctx.ui.notify(`git push failed: ${push.stderr}`, "error");
        ctx.ui.setStatus("factory", "");
        return;
      }

      ctx.ui.notify("✅ Gecommit en gepushed!", "success");
      ctx.ui.setStatus("factory", "");
    },
  });

  // ── /done — commit + TESTPLAN.md + push ──
  pi.registerCommand("done", {
    description: "Commit, genereer TESTPLAN.md, en push",
    handler: async (_args, ctx) => {
      const issueNumber = getFactoryContexts()[0]?.number || "XXX";
      const branchResult = await pi.exec("git", [
        "branch",
        "--show-current",
      ]);
      const branch = branchResult.stdout.trim();

      ctx.ui.setStatus("factory", "Generating TESTPLAN...");

      // Genereer simpel TESTPLAN.md
      const testplan = `# Testplan — Issue #${issueNumber}

## Preview URL
- Wacht tot Vercel build groen is (check PR comments)
- Test op zowel desktop als mobile (Chrome DevTools responsive)

## Functionele Tests
- [ ] Alle acceptance criteria uit het originele issue werken
- [ ] Happy flow getest
- [ ] Error states getest (indien van toepassing)

## Tech Stack Checks
- [ ] PostHog events zichtbaar in Live Events (filter: environment=preview)
- [ ] Geen console errors in browser
- [ ] TypeScript strict compatible
- [ ] Mobile responsive (Tailwind breakpoints)

## Goedkeuring
- [ ] PR is gereviewed
- [ ] Merge naar main → productie deploy via Vercel
`;

      const fs = await import("node:fs");
      fs.writeFileSync("TESTPLAN.md", testplan);

      // Commit alles
      await pi.exec("git", ["add", "-A"]);
      await pi.exec("git", [
        "commit",
        "-m",
        `🏭 [PI-${issueNumber}] Implementatie + TESTPLAN`,
      ]);
      await pi.exec("git", ["push", "origin", branch]);

      ctx.ui.notify("✅ TESTPLAN.md gegenereerd en gepushed!", "success");
      ctx.ui.setStatus("factory", "");
    },
  });
}
