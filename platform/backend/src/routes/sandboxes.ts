// =============================================================================
// Sandbox Routes
// =============================================================================
// POST   /api/sandboxes      — Create sandbox + start provisioning (async)
// GET    /api/sandboxes/:id  — Get sandbox status (poll every 2s)
// DELETE /api/sandboxes/:id  — Destroy sandbox (stop container, drop DB)
// =============================================================================
// Request/response shapes: see ../../shared/types.ts
// API spec: see ../api-spec.yaml
// =============================================================================

import { Router } from "express";
import { customAlphabet } from "nanoid";
import { Client } from "pg";
import { prisma } from "../lib/db.js";
import { provision } from "../lib/provision.js";
import { destroyContainer } from "../lib/docker.js";
import type { CreateSandboxRequest } from "../../../shared/types.js";

export const sandboxRoutes = Router();

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

const ADMIN_DB_URL =
  process.env.ADMIN_DATABASE_URL ||
  "postgresql://crm:crm_password@localhost:5432/postgres";

// POST /api/sandboxes
sandboxRoutes.post("/", async (req, res) => {
  const { projectId, scenarioId } = req.body as CreateSandboxRequest;

  if (!projectId || !scenarioId) {
    res.status(400).json({ error: "projectId and scenarioId are required" });
    return;
  }

  const subdomain = nanoid();
  const databaseName = "sandbox_" + nanoid();

  const sandbox = await prisma.sandbox.create({
    data: {
      projectId,
      scenarioId,
      subdomain,
      databaseName,
      status: "provisioning",
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  // Fire-and-forget — do NOT await
  provision(sandbox.id).catch(console.error);

  res.status(201).json(sandbox);
});

// GET /api/sandboxes/:id
sandboxRoutes.get("/:id", async (req, res) => {
  const sandbox = await prisma.sandbox.findUnique({
    where: { id: req.params.id },
  });

  if (!sandbox) {
    res.status(404).json({ error: "Sandbox not found" });
    return;
  }

  res.json(sandbox);
});

// DELETE /api/sandboxes/:id
sandboxRoutes.delete("/:id", async (req, res) => {
  const sandbox = await prisma.sandbox.findUnique({
    where: { id: req.params.id },
  });

  if (!sandbox) {
    res.status(404).json({ error: "Sandbox not found" });
    return;
  }

  // Stop and remove container if one exists
  if (sandbox.containerId) {
    await destroyContainer(sandbox.containerId).catch(console.error);
  }

  // Drop the sandbox Postgres database
  const adminClient = new Client({ connectionString: ADMIN_DB_URL });
  await adminClient.connect();
  await adminClient.query(`DROP DATABASE IF EXISTS "${sandbox.databaseName}"`);
  try {
    await adminClient.end();
  } catch {}

  const updated = await prisma.sandbox.update({
    where: { id: req.params.id },
    data: { status: "destroyed" },
  });

  res.json(updated);
});
