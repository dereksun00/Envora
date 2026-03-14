// =============================================================================
// Scenario Routes
// =============================================================================
// POST /api/projects/:projectId/scenarios — Create a scenario
// =============================================================================
// Request/response shapes: see ../../shared/types.ts
// API spec: see ../api-spec.yaml
// =============================================================================

import { Router } from "express";
import { prisma } from "../lib/db.js";
import type { CreateScenarioRequest } from "../../../shared/types.js";

export const scenarioRoutes = Router({ mergeParams: true });

// POST /api/projects/:projectId/scenarios
scenarioRoutes.post("/", async (req, res) => {
  const { projectId } = req.params;
  const { name, prompt, demoUsers, featureFlags } =
    req.body as CreateScenarioRequest;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (!name || !prompt) {
    res.status(400).json({ error: "name and prompt are required" });
    return;
  }

  const scenario = await prisma.scenario.create({
    data: {
      projectId,
      name,
      prompt,
      demoUsers: JSON.stringify(demoUsers ?? []),
      featureFlags: JSON.stringify(featureFlags ?? {}),
    },
  });

  res.status(201).json(scenario);
});
