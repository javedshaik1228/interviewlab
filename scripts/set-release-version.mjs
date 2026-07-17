import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const versionedFiles = [
  "package.json",
  "package-lock.json",
  "desktop/package.json",
  "desktop/package-lock.json",
];

export function releaseVersionFromTag(tag) {
  const version = String(tag ?? "").trim().replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error("RELEASE_TAG must be a semantic version tag such as v1.2.3 or v1.2.3-beta.1.");
  }
  return version;
}

export async function synchronizeReleaseVersion(root, tag) {
  const version = releaseVersionFromTag(tag);
  await Promise.all(versionedFiles.map(async (relativePath) => {
    const filePath = path.join(root, relativePath);
    const document = JSON.parse(await readFile(filePath, "utf8"));
    document.version = version;
    if (document.packages?.[""]) document.packages[""].version = version;
    await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`);
  }));
  return version;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const version = await synchronizeReleaseVersion(projectRoot, process.env.RELEASE_TAG);
  console.log(`Synchronized InterviewLab release version ${version}.`);
}
