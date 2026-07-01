import { defineConfig } from "tsup";
import { readFileSync, writeFileSync } from "node:fs";

// esbuild strips the source-level "use client" directive when bundling, so we
// re-assert it as the first line of the client entry after build. Idempotent.
function ensureUseClient(files: string[]) {
  for (const f of files) {
    try {
      const src = readFileSync(f, "utf8");
      if (!/^\s*['"]use client['"]/.test(src)) {
        writeFileSync(f, `"use client";\n${src}`);
      }
    } catch {
      /* a given format may not exist — ignore */
    }
  }
}

// Two builds so the published package keeps a correct RSC boundary:
//  • index  → the React component + client helpers; carries "use client".
//  • core / server → pure + server-only code; NO "use client" (usable server-side).
export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    tsconfig: "tsconfig.build.json",
    dts: true,
    clean: true,
    treeshake: true,
    sourcemap: true,
    external: ["react", "react-dom"],
    onSuccess: async () => {
      ensureUseClient(["dist/index.js", "dist/index.cjs"]);
    },
  },
  {
    entry: { core: "src/core/index.ts", server: "src/server.ts" },
    format: ["esm", "cjs"],
    tsconfig: "tsconfig.build.json",
    dts: true,
    clean: false,
    treeshake: true,
    sourcemap: true,
    external: ["react", "react-dom", "@google/genai"],
  },
]);
