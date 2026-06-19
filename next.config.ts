import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // This repo lives next to other lockfiles; pin the tracing root to itself.
  outputFileTracingRoot: dir,
  // No ESLint config shipped (kept the repo lean); don't let lint block the build.
  eslint: { ignoreDuringBuilds: true },
  // Keep type-checking ON — a peer engineer should see this compiles clean.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
