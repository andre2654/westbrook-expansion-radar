import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // This repo lives next to other lockfiles; pin the tracing root to itself.
  outputFileTracingRoot: dir,
  // The pages/routes read /data/*.json at runtime via fs — make sure those files
  // are bundled into the serverless functions (so it works on Vercel, not just locally).
  outputFileTracingIncludes: {
    "/": ["./data/**/*.json"],
    "/play/[id]": ["./data/**/*.json"],
    "/api/run-radar": ["./data/**/*.json"],
    "/api/feedback": ["./data/**/*.json"],
  },
  // No ESLint config shipped (kept the repo lean); don't let lint block the build.
  eslint: { ignoreDuringBuilds: true },
  // Keep type-checking ON — a peer engineer should see this compiles clean.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
