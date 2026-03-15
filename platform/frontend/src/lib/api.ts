import type {
  Project,
  ProjectListItem,
  ProjectWithDetails,
  Scenario,
  Sandbox,
  SandboxWithContext,
  OverviewStats,
  GlossaryEntry,
  CreateProjectRequest,
  CreateScenarioRequest,
  CreateSandboxRequest,
  UpdateSandboxRequest,
  UpdateScenarioRequest,
  ListSandboxesQuery,
} from "@shared/types";

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Overview ----

export function getOverview(): Promise<OverviewStats> {
  return request("/overview");
}

// ---- Projects ----

export function listProjects(): Promise<ProjectListItem[]> {
  return request("/projects");
}

export function getProject(id: string): Promise<ProjectWithDetails> {
  return request(`/projects/${id}`);
}

export function createProject(data: CreateProjectRequest): Promise<Project> {
  return request("/projects", { method: "POST", body: JSON.stringify(data) });
}

export function deleteProject(id: string): Promise<void> {
  return request(`/projects/${id}`, { method: "DELETE" });
}

export function updateGlossary(
  projectId: string,
  uiGlossary: GlossaryEntry[]
): Promise<Project> {
  return request(`/projects/${projectId}/glossary`, {
    method: "PUT",
    body: JSON.stringify({ uiGlossary }),
  });
}

export function regenerateGlossary(
  projectId: string,
  appSourceCode?: string
): Promise<Project> {
  return request(`/projects/${projectId}/glossary/regenerate`, {
    method: "POST",
    body: JSON.stringify({ appSourceCode }),
  });
}

// ---- Scenarios ----

export function createScenario(
  projectId: string,
  data: CreateScenarioRequest
): Promise<Scenario> {
  return request(`/projects/${projectId}/scenarios`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateScenario(
  projectId: string,
  scenarioId: string,
  data: UpdateScenarioRequest
): Promise<Scenario> {
  return request(`/projects/${projectId}/scenarios/${scenarioId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteScenario(
  projectId: string,
  scenarioId: string
): Promise<void> {
  return request(`/projects/${projectId}/scenarios/${scenarioId}`, {
    method: "DELETE",
  });
}

export function duplicateScenario(
  projectId: string,
  scenarioId: string
): Promise<Scenario> {
  return request(`/projects/${projectId}/scenarios/${scenarioId}/duplicate`, {
    method: "POST",
  });
}

// ---- Sandboxes ----

export function listSandboxes(
  query?: ListSandboxesQuery
): Promise<SandboxWithContext[]> {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.projectId) params.set("projectId", query.projectId);
  const qs = params.toString();
  return request(`/sandboxes${qs ? `?${qs}` : ""}`);
}

export function createSandbox(data: CreateSandboxRequest): Promise<Sandbox> {
  return request("/sandboxes", { method: "POST", body: JSON.stringify(data) });
}

export function getSandbox(id: string): Promise<Sandbox> {
  return request(`/sandboxes/${id}`);
}

export function updateSandbox(
  id: string,
  data: UpdateSandboxRequest
): Promise<Sandbox> {
  return request(`/sandboxes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function destroySandbox(id: string): Promise<Sandbox> {
  return request(`/sandboxes/${id}`, { method: "DELETE" });
}
