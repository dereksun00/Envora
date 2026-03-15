// =============================================================================
// Docker Management Module
// =============================================================================
// Manages Docker containers for sandboxed app instances.
// Uses dockerode to interact with the Docker daemon.
//
// Type refs: ContainerInfo from shared/types.ts
//
// Key concepts:
// - All containers attach to the "sandbox-net" bridge network
// - Containers reach Postgres via Docker DNS name "sandbox-postgres" (NOT localhost)
// - Host ports are randomly assigned for localhost access
// =============================================================================

import Docker from "dockerode";
import { execSync } from "child_process";
import type { ContainerInfo } from "../../../shared/types.js";

/**
 * Launch a Docker container for a sandbox.
 */
export async function launchContainer(
  dockerImage: string,
  databaseUrl: string,
  appPort: number
): Promise<ContainerInfo> {
  const docker = new Docker();

  const container = await docker.createContainer({
    Image: dockerImage,
    Env: [`DATABASE_URL=${databaseUrl}`, `PORT=${appPort}`],
    ExposedPorts: { [`${appPort}/tcp`]: {} },
    HostConfig: {
      PortBindings: { [`${appPort}/tcp`]: [{ HostPort: "0" }] },
      NetworkMode: process.env.SANDBOX_NETWORK || "sandbox-net",
    },
  });

  await container.start();

  const info = await container.inspect();
  const portBindings = info.NetworkSettings.Ports[`${appPort}/tcp`];
  const hostPort = parseInt(portBindings?.[0]?.HostPort ?? "0", 10);

  return { containerId: container.id, hostPort };
}

/**
 * Stop a running Docker container (preserves data).
 */
export async function stopContainer(containerId: string): Promise<void> {
  const docker = new Docker();
  const container = docker.getContainer(containerId);
  await container.stop();
}

/**
 * Start a stopped Docker container and return the newly assigned host port.
 */
export async function startContainer(containerId: string): Promise<number> {
  const docker = new Docker();
  const container = docker.getContainer(containerId);
  await container.start();
  const info = await container.inspect();
  const ports = info.NetworkSettings.Ports;
  const firstBinding = Object.values(ports).find((b) => b && b.length > 0);
  return parseInt(firstBinding?.[0]?.HostPort ?? "0", 10);
}

/**
 * Extract source code from a Docker image by creating a temp container
 * and copying files out. Returns concatenated source as a single string.
 */
export async function extractSourceFromImage(dockerImage: string): Promise<string> {
  const docker = new Docker();
  const containerName = `glossary-extract-${Date.now()}`;

  // Create container without starting it
  const container = await docker.createContainer({
    Image: dockerImage,
    name: containerName,
    Cmd: ["true"],
  });

  try {
    // Common source directories in Docker images
    const dirs = ["/app/src", "/app/app", "/app/pages", "/app/components", "/src", "/app"];
    // File extensions to include
    const exts = "tsx,ts,jsx,js,vue,svelte,html";

    let source = "";

    for (const dir of dirs) {
      try {
        // Use docker cp via CLI to extract, then read files
        const result = execSync(
          `docker run --rm --entrypoint="" ${dockerImage} sh -c "find ${dir} -type f \\( ${exts.split(",").map(e => `-name '*.${e}'`).join(" -o ")} \\) 2>/dev/null | head -50 | while read f; do echo '===FILE:' \\$f '==='; cat \\$f 2>/dev/null; done"`,
          { encoding: "utf8", timeout: 30_000, maxBuffer: 5 * 1024 * 1024 }
        );
        if (result.trim()) {
          source += result;
          break; // Found source in this dir, stop looking
        }
      } catch {
        continue;
      }
    }

    return source;
  } finally {
    try { await container.remove({ force: true }); } catch {}
  }
}

/**
 * Destroy a Docker container. Swallows errors.
 */
export async function destroyContainer(containerId: string): Promise<void> {
  try {
    const docker = new Docker();
    const container = docker.getContainer(containerId);
    try {
      await container.stop();
    } catch {}
    try {
      await container.remove();
    } catch {}
  } catch {}
}
