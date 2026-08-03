/**
 * Pi Software Factory Helper
 *
 * Project-local extension die het factory workflow vergemakkelijkt.
 * Werkt samen met .github/workflows/pi-factory.yml en Matt Pocock's skills.
 *
 * Wat het doet:
 * 1. Bij session_start: detecteert .pi-factory/*.md context bestanden
 * 2. Laadt automatisch het meest recente als context
 * 3. /factory — toont alle klaarstaande factory issues
 * 4. /implement — laadt factory context + suggereert Matt's implement skill
 * 5. /commit — git add -A → commit → push
 * 6. /done — commit + genereert TESTPLAN.md + push
 * 7. /review — laadt Matt's code-review werkwijze op huidige changes
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
        const content = readFileSync(path, "utf-8");
        const titleMatch = content.match(/^#+\s*(.+)/);
        const title = titleMatch ? titleMatch[1].slice(0, 60) : `Issue #${number}`;
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
      `🏭 Factory context gevonden: #${latest.number} — laad met /factory of /implement`,
      "info"
    );

    if (ctx.mode === "tui") {
      ctx.ui.setWidget("factory", [
        `🏭 Pi Factory — ${contexts.length} issue(s) klaar`,
        `Recentste: #${latest.number} — ${latest.title}`,
        `Commands: /factory, /implement, /commit, /done, /review`,
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

      const content = readFileSync(selected.path, "utf-8");
      ctx.ui.setEditorText(
        `Implementeer issue ${selected.number} volgens onderstaande context:\n\n${content}`
      );
      ctx.ui.notify(`Context #${selected.number} geladen in editor.`, "info");
    },
  });

  // ── /implement — laadt context + suggestie voor Matt's skill ──
  pi.registerCommand("implement", {
    description: "Laadt factory context met Matt Pocock implementatie werkwijze",
    handler: async (_args, ctx) => {
      const contexts = getFactoryContexts();
      if (contexts.length === 0) {
        ctx.ui.notify("Geen factory context gevonden. Maak eerst een issue aan.", "warning");
        return;
      }

      const latest = contexts[0];
      const content = readFileSync(latest.path, "utf-8");

      // Laad context in editor met Matt skill hint
      const prompt = `${content}\n\n---\n\n## Matt Pocock Implementatie Protocol\n\nGebruik Matt's implementatie werkwijze:\n- Lees eerst de codebase (wat bestaat er al?)\n- Maak een plan voor je begint\n- Implementeer iteratief in kleine stappen\n- TypeScript strict — geen any, geen errors\n- Test na elke stap met npm run build\n\nAls je Matt's skills hebt geïnstalleerd, run eerst:\n/skill:implement\n\nDaarna implementeer bovenstaande feature.`;

      ctx.ui.setEditorText(prompt);
      ctx.ui.notify(`🎯 Implementatie context #${latest.number} geladen. Gebruik /skill:implement als beschikbaar.`, "info");
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
    description: "Commit, genereer TESTPLAN.md, en push (klaar voor PR)",
    handler: async (_args, ctx) => {
      const issueNumber = getFactoryContexts()[0]?.number || "XXX";
      const branchResult = await pi.exec("git", ["branch", "--show-current"]);
      const branch = branchResult.stdout.trim();

      ctx.ui.setStatus("factory", "Generating TESTPLAN...");

      // Genereer TESTPLAN.md
      const testplan = `# Testplan — Issue #${issueNumber}

## Preview URL
- Wacht tot Vercel build groen is (check PR comments)
- Test op zowel desktop als mobile (Chrome DevTools responsive)

## Functionele Tests
- [ ] Alle acceptance criteria uit het originele issue werken
- [ ] Happy flow getest
- [ ] Error states getest (indien van toepassing)

## Tech Stack Checks (Matt Pocock stijl)
- [ ] TypeScript strict: \`npx tsc --noEmit\` slaagt
- [ ] Build slaagt: \`npm run build\` zonder errors
- [ ] Geen \`any\` types toegevoegd
- [ ] PostHog events zichtbaar in Live Events (filter: environment=preview)
- [ ] Geen console errors in browser
- [ ] Mobile responsive (Tailwind breakpoints)

## Code Quality
- [ ] Server Components gebruikt waar mogelijk
- [ ] Client components alleen voor interactiviteit
- [ ] Server Actions voor mutations (geen API routes als het niet nodig is)
- [ ] RLS policies gecheckt / aangepast
- [ ] PostHog tracking toegevoegd

## Goedkeuring
- [ ] Alle bovenstaande checkboxes aangevinkt
- [ ] PR is gereviewed (optioneel: /skill:code-review)
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

      ctx.ui.notify("✅ TESTPLAN.md gegenereerd en gepushed! Maak nu een PR.", "success");
      ctx.ui.setStatus("factory", "");
    },
  });

  // ── /review — Matt Pocock code review op huidige changes ──
  pi.registerCommand("review", {
    description: "Review je eigen code met Matt Pocock's werkwijze (diff-based)",
    handler: async (_args, ctx) => {
      ctx.ui.setStatus("factory", "Reviewing...");

      // Haal diff op
      const diff = await pi.exec("git", ["diff", "HEAD~1", "--stat"]);
      const fullDiff = await pi.exec("git", ["diff", "HEAD~1"]);

      if (!fullDiff.stdout.trim()) {
        ctx.ui.notify("Geen changes gevonden sinds laatste commit.", "warning");
        ctx.ui.setStatus("factory", "");
        return;
      }

      // Laad review prompt in editor
      const reviewPrompt = `Review deze code changes met Matt Pocock's code-review werkwijze:

## Files changed
${diff.stdout}

## Review checklist
- [ ] TypeScript types zijn correct en strict?
- [ ] Geen onnodige client components?
- [ ] PostHog tracking aanwezig?
- [ ] Supabase RLS policies correct?
- [ ] Error handling aanwezig?
- [ ] Naming is duidelijk?
- [ ] Geen duplicatie die naar lib/ kan?

Als je Matt's code-review skill hebt, run eerst:
/skill:code-review

Daarna analyseer de changes hieronder en geef concrete verbeterpunten.

---
\`\`\`diff
${fullDiff.stdout.slice(0, 8000)}
\`\`\`
`;

      ctx.ui.setEditorText(reviewPrompt);
      ctx.ui.notify("🔍 Review context geladen. Gebruik /skill:code-review als beschikbaar.", "info");
      ctx.ui.setStatus("factory", "");
    },
  });
}
