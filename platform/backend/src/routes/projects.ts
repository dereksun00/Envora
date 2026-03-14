// =============================================================================
// Project Routes
// =============================================================================
// GET  /api/projects          — List all projects
// POST /api/projects          — Create a project
// GET  /api/projects/:id      — Get project with scenarios + sandboxes
// POST /api/projects/:id/scenarios — Create scenario (delegated)
// =============================================================================
// Request/response shapes: see ../../shared/types.ts
// API spec: see ../api-spec.yaml
// =============================================================================

import { Router } from "express";
import { prisma } from "../lib/db.js";
import { scenarioRoutes, serializeScenario } from "./scenarios.js";
import type { CreateProjectRequest } from "../../../shared/types.js";

export const projectRoutes = Router();

// Nest scenario routes under projects
projectRoutes.use("/:projectId/scenarios", scenarioRoutes);

// GET /api/projects
projectRoutes.get("/", async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(projects);
});

// POST /api/projects
projectRoutes.post("/", async (req, res) => {
  const { name, dockerImage, schema, schemaFormat, appPort } =
    req.body as CreateProjectRequest;

  if (!name || !dockerImage || !schema) {
    res.status(400).json({ error: "name, dockerImage, and schema are required" });
    return;
  }

  const project = await prisma.project.create({
    data: {
      name,
      dockerImage,
      schema,
      schemaFormat: schemaFormat ?? "prisma",
      appPort: appPort ?? 3000,
    },
  });

  res.status(201).json(project);
});

// GET /api/projects/:id
projectRoutes.get("/:id", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { scenarios: true, sandboxes: true },
  });

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Parse JSON string fields on scenarios before sending
  res.json({
    ...project,
    scenarios: project.scenarios.map(serializeScenario),
  });
});
