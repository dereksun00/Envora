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
