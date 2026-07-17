import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "vite";

async function copyWhenPresent(source: string, destination: string, recursive = false): Promise<void> {
  try {
    await cp(source, destination, { recursive });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}

/** Place the hosting manifest and optional migrations beside the built server. */
export function sites(): Plugin {
  let projectDirectory = process.cwd();

  return {
    name: "weekmark-sites-artifacts",
    apply: "build",
    configResolved({ root }) {
      projectDirectory = root;
    },
    async closeBundle() {
      const artifactDirectory = join(projectDirectory, "dist", ".openai");
      const manifestSource = join(projectDirectory, ".openai", "hosting.json");
      const migrationsSource = join(projectDirectory, "drizzle");

      await rm(artifactDirectory, { force: true, recursive: true });
      await mkdir(artifactDirectory, { recursive: true });

      await copyWhenPresent(manifestSource, join(artifactDirectory, "hosting.json"));
      await copyWhenPresent(migrationsSource, join(artifactDirectory, "drizzle"), true);
    },
  };
}
