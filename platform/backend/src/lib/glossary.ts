// =============================================================================
// UI Glossary Generation
// =============================================================================
// Reads app source code + schema and produces a structured mapping between
// UI labels (what users see) and schema operations (how values are computed).
//
// Called once per project at creation time, not per sandbox.
// =============================================================================

import Anthropic from "@anthropic-ai/sdk";
import type { GlossaryEntry } from "../../../shared/types.js";

/**
 * Analyze app source code and schema to extract UI-to-schema mappings.
 */
export async function generateGlossary(
  appSourceCode: string,
  schema: string,
  schemaFormat: string
): Promise<GlossaryEntry[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Truncate source code if too long (keep under ~80K chars to stay in context)
  const maxSourceLen = 80_000;
  const truncatedSource =
    appSourceCode.length > maxSourceLen
      ? appSourceCode.slice(0, maxSourceLen) + "\n\n... (truncated)"
      : appSourceCode;

  const systemPrompt = `You are analyzing a web application's source code to create a "UI Glossary" — a mapping between what users see in the app's interface and how those values are derived from the database schema.

For each UI concept you find, identify:
1. The exact label shown in the UI (e.g., "Pipeline Value", "Win Rate", "Total Revenue")
2. The schema-level operation that produces it (e.g., "SUM(Deal.amount)", "COUNT(Deal WHERE stage = 'closed_won') / COUNT(Deal)")
3. A brief description of what it represents

Focus on:
- Dashboard metrics and KPIs
- Computed/aggregated values (sums, counts, averages, percentages)
- Filtered counts (e.g., "Active Deals" = deals not in closed stages)
- Any label in the UI that does NOT literally match a single column name
- Column values that are renamed or reformatted in the UI

Do NOT include:
- Simple column displays (e.g., a "Name" column showing Contact.firstName)
- Navigation labels or button text
- Static text that isn't data-driven

Return ONLY a valid JSON array. No markdown fences, no commentary. Example format:
[
  { "uiLabel": "Pipeline Value", "schemaMapping": "SUM(Deal.amount)", "description": "Total monetary value of all deals" },
  { "uiLabel": "Win Rate", "schemaMapping": "COUNT(Deal WHERE stage='closed_won') / COUNT(Deal) * 100", "description": "Percentage of deals that were won" }
]`;

  const userPrompt = `Here is the database schema (${schemaFormat} format):

${schema}

Here is the application source code:

${truncatedSource}

Extract all UI-to-schema mappings as a JSON array.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude API");
  }

  let text = content.text.trim();

  // Strip markdown fences if present
  text = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const entries: GlossaryEntry[] = JSON.parse(text);
    // Validate structure
    return entries.filter(
      (e) =>
        typeof e.uiLabel === "string" &&
        typeof e.schemaMapping === "string" &&
        typeof e.description === "string"
    );
  } catch {
    console.error("[glossary] Failed to parse Claude response as JSON:", text.slice(0, 200));
    return [];
  }
}
