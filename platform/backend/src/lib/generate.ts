// =============================================================================
// AI Data Generation Module
// =============================================================================
// Calls Claude API to generate SQL INSERT statements for sandbox seeding.
// Input: schema + scenario prompt + demo users
// Output: SQL INSERT statements (dependency-ordered, FK-correct)
//
// Type refs: GenerateDataParams, GenerateDataResult from shared/types.ts
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";
import type { GenerateDataParams, GenerateDataResult, GlossaryEntry } from "../../../shared/types.js";

function buildGlossarySection(glossary: GlossaryEntry[]): string {
  if (glossary.length === 0) return "";
  const entries = glossary
    .map((g) => `- "${g.uiLabel}" → ${g.schemaMapping} — ${g.description}`)
    .join("\n");
  return `

UI Glossary — these are concepts the user may reference in their scenario prompt.
When the user mentions any of these terms, use the schema mapping to generate data that produces the correct result:
${entries}

CRITICAL: If the scenario mentions a target for any glossary term (e.g., "pipeline value of $36M"), you MUST ensure the generated data's aggregation matches that target exactly. Use the scratchpad to plan and verify.`;
}

/**
 * Generate SQL INSERT statements using Claude API.
 */
export async function generateSeedData(
  params: GenerateDataParams
): Promise<GenerateDataResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a database seeding expert. Generate SQL INSERT statements for a sandbox database.

Rules (MUST follow all):
- Insert parent tables before child tables (dependency-ordered INSERTs)
- Only reference IDs that were actually inserted in your output (FK correctness)
- Generate realistic, narrative-coherent data that matches the scenario description
- Use ISO 8601 timestamps spread across the last 6 months
- Use ~30% NULLs in nullable columns
- Match exact enum casing from the schema (e.g., 'mid_market' not 'Mid_Market', 'closed_won' not 'Closed_Won')
- If the scenario specifies any numeric targets or totals (e.g. "2.1 million pipeline", "500k revenue", "1.5 billion ARR"), you MUST use a <scratchpad> first: list every row value you plan to insert, sum them, and adjust until they match the target exactly — THEN write the SQL
- Output format: optional <scratchpad>...</scratchpad> block first, then raw SQL INSERT statements. The scratchpad will be stripped from the final output
- Every INSERT statement must end with a semicolon${buildGlossarySection(params.uiGlossary || [])}`;

  const demoUsersText =
    params.demoUsers.length > 0
      ? `\n\nDemo users to include (these specific users MUST appear in the data):\n${JSON.stringify(params.demoUsers, null, 2)}`
      : "";

  const scenarioPrompt = params.scenarioPrompt.replace(/\.{2,}\s*$/, "").trim();

  // #region agent log
  fetch("http://127.0.0.1:7765/ingest/0edf77b0-9378-4eb7-9c79-05a81878ca9b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "acfe58" },
    body: JSON.stringify({
      sessionId: "acfe58",
      location: "generate.ts:entry",
      message: "generateSeedData called",
      data: { rawPrompt: params.scenarioPrompt, trimmedPrompt: scenarioPrompt, promptLength: scenarioPrompt.length },
      hypothesisId: "H1",
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const userPrompt = `Generate SQL INSERT statements for the following ${params.schemaFormat === "prisma" ? "Prisma" : "SQL"} schema.

Schema:
${params.schema}

Scenario: ${scenarioPrompt}${demoUsersText}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    // #region agent log
    fetch("http://127.0.0.1:7765/ingest/0edf77b0-9378-4eb7-9c79-05a81878ca9b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "acfe58" },
      body: JSON.stringify({
        sessionId: "acfe58",
        location: "generate.ts:nonText",
        message: "Claude returned non-text content",
        data: { contentType: content.type },
        hypothesisId: "H5",
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new Error("Unexpected response type from Claude API");
  }

  let sql = content.text;

  // #region agent log
  fetch("http://127.0.0.1:7765/ingest/0edf77b0-9378-4eb7-9c79-05a81878ca9b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "acfe58" },
    body: JSON.stringify({
      sessionId: "acfe58",
      location: "generate.ts:response",
      message: "Claude response received",
      data: { sqlLength: sql.length, hasInsert: /INSERT\s+INTO/i.test(sql), sqlPreview: sql.slice(0, 400) },
      hypothesisId: "H2",
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  console.log("\n========== RAW CLAUDE RESPONSE ==========\n", sql, "\n=========================================\n");

  // Strip scratchpad block if present
  sql = sql.replace(/<scratchpad>[\s\S]*?<\/scratchpad>/i, "").trim();

  // Strip any accidental markdown fences
  sql = sql.replace(/^```sql\s*/i, "").replace(/^```\s*/m, "").replace(/\s*```$/i, "").trim();

  // Validate output contains INSERT statements
  if (!/INSERT\s+INTO/i.test(sql)) {
    // #region agent log
    fetch("http://127.0.0.1:7765/ingest/0edf77b0-9378-4eb7-9c79-05a81878ca9b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "acfe58" },
      body: JSON.stringify({
        sessionId: "acfe58",
        location: "generate.ts:noInsert",
        message: "Generated output has no INSERT statements",
        data: { sqlPreview: sql.slice(0, 600) },
        hypothesisId: "H5",
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new Error("Generated output does not contain any INSERT statements");
  }

  return {
    sql,
    tokenCount: response.usage.input_tokens + response.usage.output_tokens,
  };
}
