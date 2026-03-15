// =============================================================================
// Seed with Retry Module
// =============================================================================
// Executes SQL against a sandbox Postgres database.
// On failure, sends the SQL + schema + Postgres error back to Claude to fix.
// Retries up to 3 times. This is the most important reliability feature.
//
// Type refs: SeedResult from shared/types.ts
// =============================================================================

import { Client } from "pg";
import Anthropic from "@anthropic-ai/sdk";
import type { SeedResult } from "../../../shared/types.js";

const MAX_ATTEMPTS = 3;

/**
 * Execute SQL against the sandbox database with AI-powered retry.
 */
export async function seedWithRetry(
  databaseUrl: string,
  sql: string,
  schema: string,
  schemaFormat: string
): Promise<SeedResult> {
  let currentSQL = sql;
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const client = new Client({ connectionString: databaseUrl });
    try {
      await client.connect();
      await client.query("BEGIN");
      await client.query(currentSQL);
      await client.query("COMMIT");
      return { success: true, finalSQL: currentSQL, attempts: attempt };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // #region agent log
      fetch("http://127.0.0.1:7765/ingest/0edf77b0-9378-4eb7-9c79-05a81878ca9b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "acfe58" },
        body: JSON.stringify({
          sessionId: "acfe58",
          location: "seed-with-retry.ts:seedError",
          message: "Seed attempt failed",
          data: { attempt, lastError, errorPreview: lastError.slice(0, 500) },
          hypothesisId: "H4",
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      try {
        await client.query("ROLLBACK");
      } catch {}

      if (attempt < MAX_ATTEMPTS) {
        // Ask Claude to fix the SQL
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          messages: [
            {
              role: "user",
              content: `The following SQL failed with this Postgres error:

Error: ${lastError}

Schema (${schemaFormat}):
${schema}

Failed SQL:
${currentSQL}

Please return corrected SQL INSERT statements only. No markdown fences, no commentary.`,
            },
          ],
        });

        const content = response.content[0];
        if (content.type === "text") {
          let fixed = content.text;
          fixed = fixed.replace(/^```sql\s*/i, "").replace(/^```\s*/m, "").replace(/\s*```$/i, "").trim();
          currentSQL = fixed;
        }
      }
    } finally {
      try {
        await client.end();
      } catch {}
    }
  }

  // #region agent log
  fetch("http://127.0.0.1:7765/ingest/0edf77b0-9378-4eb7-9c79-05a81878ca9b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "acfe58" },
    body: JSON.stringify({
      sessionId: "acfe58",
      location: "seed-with-retry.ts:finalFailure",
      message: "Seed failed after all retries",
      data: { lastError, lastErrorPreview: lastError.slice(0, 500) },
      hypothesisId: "H4",
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return {
    success: false,
    finalSQL: currentSQL,
    attempts: MAX_ATTEMPTS,
    lastError,
  };
}
