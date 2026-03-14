import type {
  Project,
  ProjectWithDetails,
  Scenario,
  Sandbox,
  CreateProjectRequest,
  CreateScenarioRequest,
  CreateSandboxRequest,
} from "../../shared/types";

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
  return res.json();
}

export function listProjects(): Promise<Project[]> {
  return request("/projects");
}

export function getProject(id: string): Promise<ProjectWithDetails> {
  return request(`/projects/${id}`);
}

export function createProject(data: CreateProjectRequest): Promise<Project> {
  return request("/projects", { method: "POST", body: JSON.stringify(data) });
}

export function createScenario(
  projectId: string,
  data: CreateScenarioRequest
): Promise<Scenario> {
  return request(`/projects/${projectId}/scenarios`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createSandbox(data: CreateSandboxRequest): Promise<Sandbox> {
  return request("/sandboxes", { method: "POST", body: JSON.stringify(data) });
}

export function getSandbox(id: string): Promise<Sandbox> {
  return request(`/sandboxes/${id}`);
}

export function destroySandbox(id: string): Promise<Sandbox> {
  return request(`/sandboxes/${id}`, { method: "DELETE" });
}
