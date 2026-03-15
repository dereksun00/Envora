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
import { generateGlossary } from "../lib/glossary.js";
import { extractSourceFromImage } from "../lib/docker.js";
import type { CreateProjectRequest, GlossaryEntry } from "../../../shared/types.js";

/** Parse uiGlossary JSON string on project before sending to client */
function serializeProject(project: any) {
  return {
    ...project,
    uiGlossary: JSON.parse(project.uiGlossary || "[]"),
  };
}

export const projectRoutes = Router();

// Nest scenario routes under projects
projectRoutes.use("/:projectId/scenarios", scenarioRoutes);

// GET /api/projects
projectRoutes.get("/", async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { scenarios: true, sandboxes: true } },
      sandboxes: {
        where: { status: { in: ["running", "provisioning"] } },
        select: { id: true },
      },
    },
  });

  const result = projects.map((p) => ({
    ...serializeProject(p),
    activeSandboxCount: p.sandboxes.length,
    sandboxes: undefined,
  }));

  res.json(result);
});

// POST /api/projects
projectRoutes.post("/", async (req, res) => {
  const { name, dockerImage, schema, schemaFormat, appPort, appSourceCode, uiGlossary } =
    req.body as CreateProjectRequest;

  if (!name || !dockerImage || !schema) {
    res.status(400).json({ error: "name, dockerImage, and schema are required" });
    return;
  }

  // Create project first, then generate glossary in background
  const project = await prisma.project.create({
    data: {
      name,
      dockerImage,
      schema,
      schemaFormat: schemaFormat ?? "prisma",
      appPort: appPort ?? 3000,
      uiGlossary: JSON.stringify(uiGlossary || []),
    },
  });

  // Fire-and-forget: auto-extract source from Docker image and generate glossary
  (async () => {
    try {
      console.log(`[glossary] Auto-extracting source from Docker image: ${dockerImage}`);
      const source = await extractSourceFromImage(dockerImage);
      if (!source.trim()) {
        console.log("[glossary] No source found in Docker image, skipping");
        return;
      }
      const glossary = await generateGlossary(source, schema, schemaFormat ?? "prisma");
      console.log(`[glossary] Auto-generated ${glossary.length} entries for project ${project.id}`);
      await prisma.project.update({
        where: { id: project.id },
        data: { uiGlossary: JSON.stringify(glossary), appSourceCode: source },
      });
    } catch (err) {
      console.error("[glossary] Auto-generation failed:", err);
    }
  })();

  res.status(201).json(serializeProject(project));
});

// DELETE /api/projects/:id
projectRoutes.delete("/:id", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
  });

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).end();
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

  // Parse JSON string fields on scenarios and project before sending
  res.json({
    ...serializeProject(project),
    scenarios: project.scenarios.map(serializeScenario),
  });
});

// PUT /api/projects/:id/glossary — Update glossary manually
projectRoutes.put("/:id/glossary", async (req, res) => {
  const { uiGlossary } = req.body as { uiGlossary: GlossaryEntry[] };

  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: { uiGlossary: JSON.stringify(uiGlossary || []) },
  });

  res.json(serializeProject(updated));
});

// POST /api/projects/:id/glossary/regenerate — Extract source from Docker image + generate glossary
projectRoutes.post("/:id/glossary/regenerate", async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  try {
    // Extract source from Docker image automatically
    console.log(`[glossary] Extracting source from Docker image: ${project.dockerImage}`);
    const sourceCode = await extractSourceFromImage(project.dockerImage);
    if (!sourceCode.trim()) {
      res.status(400).json({ error: `Could not extract source code from Docker image "${project.dockerImage}". Make sure the image exists locally.` });
      return;
    }
    console.log(`[glossary] Extracted ${sourceCode.length} chars of source code`);

    const glossary = await generateGlossary(sourceCode, project.schema, project.schemaFormat);
    console.log(`[glossary] Generated ${glossary.length} glossary entries`);

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        uiGlossary: JSON.stringify(glossary),
        appSourceCode: sourceCode,
      },
    });
    res.json(serializeProject(updated));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Glossary generation failed: " + message });
  }
});
