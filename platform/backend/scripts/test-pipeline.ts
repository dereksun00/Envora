// =============================================================================
// Pipeline End-to-End Test Script
// =============================================================================
// Run with: npm run test:pipeline
//
// Creates a project + scenario + sandbox, calls the provisioner,
// and opens the result in a browser.
//
// Use this BEFORE writing any UI code to verify the pipeline works.
// The CRM should load with realistic data and support full CRUD.
// =============================================================================

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { customAlphabet } from "nanoid";
import { prisma } from "../src/lib/db.js";
import { provision } from "../src/lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

async function main() {
  const fixturesDir = join(__dirname, "..", "..", "test-fixtures");
  const schema = readFileSync(
    join(fixturesDir, "demo-crm-schema.prisma"),
    "utf8"
  );
  const scenarioData = JSON.parse(
    readFileSync(join(fixturesDir, "demo-scenario.json"), "utf8")
  );

  console.log("Creating project...");
  const project = await prisma.project.create({
    data: {
      name: "Demo CRM",
      dockerImage: "envora/demo-crm:latest",
      schema,
      schemaFormat: "prisma",
      appPort: 3000,
    },
  });
  console.log(`  Project ID: ${project.id}`);

  console.log("Creating scenario...");
  const scenario = await prisma.scenario.create({
    data: {
      projectId: project.id,
      name: scenarioData.name,
      prompt: scenarioData.prompt,
      demoUsers: JSON.stringify(scenarioData.demoUsers),
    },
  });
  console.log(`  Scenario ID: ${scenario.id}`);

  console.log("Creating sandbox...");
  const sandbox = await prisma.sandbox.create({
    data: {
      projectId: project.id,
      scenarioId: scenario.id,
      subdomain: nanoid(),
      databaseName: "sandbox_" + nanoid(),
      status: "provisioning",
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });
  console.log(`  Sandbox ID: ${sandbox.id}`);

  console.log("\nProvisioning sandbox (this may take a minute)...");
  await provision(sandbox.id);

  // Poll for final status
  const maxWait = 120_000;
  const start = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let final: any = sandbox;

  while (Date.now() - start < maxWait) {
    const current = await prisma.sandbox.findUniqueOrThrow({
      where: { id: sandbox.id },
    });
    console.log(`  Status: ${current.status} — ${current.statusMessage}`);
    if (current.status !== "provisioning") {
      final = current;
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (final.status === "running" && final.url) {
    console.log(`\nSandbox is running at: ${final.url}`);
    try {
      const openCmd =
        process.platform === "win32"
          ? `start ${final.url}`
          : `open ${final.url}`;
      execSync(openCmd);
    } catch {}
  } else {
    console.log(`\nSandbox ended with status: ${final.status}`);
    console.log(`Message: ${final.statusMessage}`);
    process.exit(1);
  }
}

main().catch(console.error);
