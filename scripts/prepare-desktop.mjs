import { access, cp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const copies = [
  {
    source: path.join(projectRoot, ".next", "static"),
    destination: path.join(standaloneRoot, ".next", "static"),
  },
  {
    source: path.join(projectRoot, "public"),
    destination: path.join(standaloneRoot, "public"),
  },
];

const [rootPackage, desktopPackage] = await Promise.all([
  readFile(path.join(projectRoot, "package.json"), "utf8").then(JSON.parse),
  readFile(path.join(projectRoot, "desktop", "package.json"), "utf8").then(JSON.parse),
]);
if (rootPackage.version !== desktopPackage.version) {
  throw new Error("package.json and desktop/package.json must use the same version.");
}

await access(path.join(standaloneRoot, "server.js"));
for (const { source, destination } of copies) {
  await access(source);
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true, force: true });
}

console.log(`Prepared InterviewLab ${rootPackage.version} desktop runtime.`);
