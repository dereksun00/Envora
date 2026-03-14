// =============================================================================
// Provisioning Orchestrator
// =============================================================================
// Ties together: database creation, schema application, AI data generation,
// seed-with-retry, and Docker container launch.
//
// Called asynchronously from POST /api/sandboxes (fire-and-forget).
// Updates sandbox status in the platform DB at each step.
//
// IMPORTANT: Calls generate.ts DIRECTLY (as a function import), NOT via HTTP.
// =============================================================================

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { Client } from "pg";
import { prisma } from "./db.js";
import { generateSeedData } from "./generate.js";
import { seedWithRetry } from "./seed-with-retry.js";
import { launchContainer } from "./docker.js";

const ADMIN_DB_URL =
  process.env.ADMIN_DATABASE_URL ||
  "postgresql://crm:crm_password@localhost:5432/postgres";

async function updateStatus(sandboxId: string, step: string, message: string) {
  await prisma.sandbox.update({
    where: { id: sandboxId },
    data: { currentStep: step, statusMessage: message },
  });
}

/**
 * Provision a sandbox end-to-end.
 */
export async function provision(sandboxId: string): Promise<void> {
  try {
    // Fetch sandbox with project + scenario
    const sandbox = await prisma.sandbox.findUniqueOrThrow({
      where: { id: sandboxId },
      include: { project: true, scenario: true },
    });

    const { project, scenario, databaseName } = sandbox;

    // Step 1: Create database
    await updateStatus(sandboxId, "creating_database", "Creating database...");
    const adminClient = new Client({ connectionString: ADMIN_DB_URL });
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    try {
      await adminClient.end();
    } catch {}

    // Step 2: Apply schema
    await updateStatus(sandboxId, "applying_schema", "Applying schema...");
    const sandboxDatabaseUrl = `postgresql://crm:crm_password@localhost:5432/${databaseName}`;

    if (project.schemaFormat === "prisma") {
      const tempFile = path.join(os.tmpdir(), `schema-${sandboxId}.prisma`);
      // Ensure the datasource has a url field for db push
      const schemaWithUrl = project.schema.replace(
        /datasource\s+db\s*\{[^}]*\}/s,
        `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}`
      );
      fs.writeFileSync(tempFile, schemaWithUrl, "utf8");
      try {
        execSync(
          `npx prisma db push --schema="${tempFile}" --skip-generate --accept-data-loss`,
          {
            env: { ...process.env, DATABASE_URL: sandboxDatabaseUrl },
            stdio: "pipe",
          }
        );
      } finally {
        try {
          fs.unlinkSync(tempFile);
        } catch {}
      }
    } else {
      // SQL DDL
      const ddlClient = new Client({ connectionString: sandboxDatabaseUrl });
      await ddlClient.connect();
      try {
        await ddlClient.query(project.schema);
      } finally {
        try {
          await ddlClient.end();
        } catch {}
      }
    }

    // Step 3: Generate data
    await updateStatus(sandboxId, "generating_data", "Generating synthetic data...");
    let sql: string;

    if (scenario.generatedSQL) {
      sql = scenario.generatedSQL;
    } else {
      const result = await generateSeedData({
        schema: project.schema,
        schemaFormat: project.schemaFormat as "prisma" | "sql",
        scenarioPrompt: scenario.prompt,
        demoUsers: JSON.parse(scenario.demoUsers),
      });
      sql = result.sql;
      // Cache the generated SQL on the scenario
      await prisma.scenario.update({
        where: { id: scenario.id },
        data: { generatedSQL: sql },
      });
    }

    // Step 4: Seed database
    await updateStatus(sandboxId, "seeding_database", "Seeding database...");
    const seedResult = await seedWithRetry(
      sandboxDatabaseUrl,
      sql,
      project.schema,
      project.schemaFormat
    );
    // Update cached SQL if retries produced a modified version
    if (seedResult.finalSQL !== sql) {
      await prisma.scenario.update({
        where: { id: scenario.id },
        data: { generatedSQL: seedResult.finalSQL },
      });
    }

    // Step 5: Launch container
    await updateStatus(sandboxId, "launching_app", "Launching application...");
    // Use Docker DNS hostname "sandbox-postgres" — NOT localhost
    const containerDatabaseUrl = `postgresql://crm:crm_password@sandbox-postgres:5432/${databaseName}`;
    const { containerId, hostPort } = await launchContainer(
      project.dockerImage,
      containerDatabaseUrl,
      project.appPort
    );
    await prisma.sandbox.update({
      where: { id: sandboxId },
      data: { containerId, hostPort },
    });

    // Step 6: Wait for ready
    await updateStatus(sandboxId, "waiting_for_ready", "Waiting for app to be ready...");
    const appUrl = `http://localhost:${hostPort}`;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(appUrl);
        if (response.ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Step 7: Running
    await prisma.sandbox.update({
      where: { id: sandboxId },
      data: {
        status: "running",
        currentStep: "ready",
        statusMessage: "Sandbox is running",
        url: appUrl,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.sandbox
      .update({
        where: { id: sandboxId },
        data: { status: "failed", statusMessage: message },
      })
      .catch(() => {});
  }
}
