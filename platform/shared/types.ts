// =============================================================================
// Sandbox Platform — Shared Types
// =============================================================================
// This file is the single source of truth for all API shapes.
// CRITICAL: After ANY change to this file, re-feed it to your AI tool.
//   - Claude Code: reference the file
//   - Cursor: @types.ts
//   - Antigravity: mention in next prompt
// =============================================================================

// ---- Enums ----

export type SchemaFormat = "prisma" | "sql";

export type SandboxStatus =
  | "provisioning"
  | "running"
  | "stopped"
  | "failed"
  | "expired"
  | "destroyed";

export type SandboxAction = "stop" | "start" | "reset" | "extend";

export type ProvisioningStep =
  | "creating_database"
  | "applying_schema"
  | "generating_data"
  | "seeding_database"
  | "launching_app"
  | "waiting_for_ready"
  | "ready";

// ---- Domain Models ----

export interface Project {
  id: string;
  name: string;
  dockerImage: string;
  schema: string;
  schemaFormat: SchemaFormat;
  appPort: number;
  uiGlossary: GlossaryEntry[];
  createdAt: string; // ISO 8601
}

export interface Scenario {
  id: string;
  projectId: string;
  name: string;
  prompt: string;
  generatedSQL: string | null; // cached SQL from AI generation
  demoUsers: DemoUser[];
  featureFlags: Record<string, boolean>;
  createdAt: string;
}

export interface DemoUser {
  name: string;
  email: string;
  role: string;
}

export interface GlossaryEntry {
  uiLabel: string;        // What users see in the app UI (e.g., "Pipeline Value")
  schemaMapping: string;  // How it maps to schema (e.g., "SUM(Deal.amount)")
  description: string;    // Plain English explanation
}

export interface Sandbox {
  id: string;
  projectId: string;
  scenarioId: string;
  subdomain: string;
  containerId: string | null;
  hostPort: number | null;
  databaseName: string;
  status: SandboxStatus;
  statusMessage: string;
  currentStep: ProvisioningStep | null;
  url: string | null;
  expiresAt: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

// ---- Enriched Response Models ----

export interface SandboxWithContext extends Sandbox {
  projectName: string;
  scenarioName: string;
}

export interface ProjectListItem extends Project {
  _count: {
    scenarios: number;
    sandboxes: number;
  };
  activeSandboxCount: number;
}

// ---- API Request Bodies ----

export interface CreateProjectRequest {
  name: string;
  dockerImage: string;
  schema: string;
  schemaFormat: SchemaFormat;
  appPort?: number; // defaults to 3000
  appSourceCode?: string; // optional: app source code for auto-generating UI glossary
  uiGlossary?: GlossaryEntry[]; // optional: manual glossary entries
}

export interface CreateScenarioRequest {
  name: string;
  prompt: string;
  demoUsers?: DemoUser[];
  featureFlags?: Record<string, boolean>;
}

export interface CreateSandboxRequest {
  projectId: string;
  scenarioId: string;
  useWarmStart?: boolean; // skip AI generation, use cached SQL
}

export interface UpdateSandboxRequest {
  action: SandboxAction;
  extendMinutes?: number; // only for "extend" action, default 120
}

export interface UpdateScenarioRequest {
  name?: string;
  prompt?: string;
  demoUsers?: DemoUser[];
  featureFlags?: Record<string, boolean>;
}

// ---- API Response Shapes ----

export interface ProjectWithDetails extends Project {
  scenarios: Scenario[];
  sandboxes: Sandbox[];
}

export interface OverviewStats {
  projectCount: number;
  scenarioCount: number;
  activeSandboxCount: number;
  failedSandboxCount: number;
  recentSandboxes: SandboxWithContext[];
}

export interface ListSandboxesQuery {
  status?: SandboxStatus;
  projectId?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}

// ---- Provisioning Pipeline Types ----

export interface GenerateDataParams {
  schema: string;
  schemaFormat: SchemaFormat;
  scenarioPrompt: string;
  demoUsers: DemoUser[];
  uiGlossary?: GlossaryEntry[];
}

export interface GenerateDataResult {
  sql: string;
  tokenCount?: number;
}

export interface SeedResult {
  success: boolean;
  finalSQL: string;
  attempts: number;
  lastError?: string;
}

export interface ContainerInfo {
  containerId: string;
  hostPort: number;
}
