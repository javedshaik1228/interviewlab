import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

function pagesBasePath() {
  const configured = process.env.PAGES_BASE_PATH?.trim();
  if (configured) {
    const withLeadingSlash = configured.startsWith("/") ? configured : `/${configured}`;
    return withLeadingSlash === "/" ? withLeadingSlash : `${withLeadingSlash.replace(/\/+$/, "")}/`;
  }

  const repository = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
  return repository ? `/${repository}/` : "/";
}

export default defineConfig({
  root: fileURLToPath(new URL("./static", import.meta.url)),
  base: pagesBasePath(),
  resolve: {
    alias: {
      "tunnel-rat": fileURLToPath(new URL("./app/lib/react19-tunnel.tsx", import.meta.url)),
    },
  },
  define: {
    "process.env.NEXT_PUBLIC_INTERVIEWER_API_URL": JSON.stringify(
      process.env.NEXT_PUBLIC_INTERVIEWER_API_URL?.trim() ?? "",
    ),
  },
  build: {
    outDir: fileURLToPath(new URL("./dist-pages", import.meta.url)),
    emptyOutDir: true,
  },
});
