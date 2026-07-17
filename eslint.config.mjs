import { defineConfig, globalIgnores } from "eslint/config";
import webVitalsRules from "eslint-config-next/core-web-vitals";
import typescriptRules from "eslint-config-next/typescript";

const generatedApplicationFiles = globalIgnores(
  [".next/**", "out/**", "build/**", "next-env.d.ts"],
  "generated application files",
);

export default defineConfig([
  ...webVitalsRules,
  ...typescriptRules,
  generatedApplicationFiles,
]);
