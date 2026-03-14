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
import type { GenerateDataParams, GenerateDataResult } from "../../../shared/types.js";

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
- Output raw SQL only — NO markdown fences, NO commentary, NO explanations
- Every INSERT statement must end with a semicolon`;

  const demoUsersText =
    params.demoUsers.length > 0
      ? `\n\nDemo users to include (these specific users MUST appear in the data):\n${JSON.stringify(params.demoUsers, null, 2)}`
      : "";

  const userPrompt = `Generate SQL INSERT statements for the following ${params.schemaFormat === "prisma" ? "Prisma" : "SQL"} schema.

Schema:
${params.schema}

Scenario: ${params.scenarioPrompt}${demoUsersText}

Output raw SQL INSERT statements only. No markdown fences, no commentary.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  let sql = content.text;

  // Strip any accidental markdown fences
  sql = sql.replace(/^```sql\s*/i, "").replace(/^```\s*/m, "").replace(/\s*```$/i, "").trim();

  // Validate output contains INSERT statements
  if (!/INSERT\s+INTO/i.test(sql)) {
    throw new Error("Generated output does not contain any INSERT statements");
  }

  return {
    sql,
    tokenCount: response.usage.input_tokens + response.usage.output_tokens,
  };
}
