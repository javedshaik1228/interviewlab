/* eslint-disable @typescript-eslint/no-require-imports */
const { access, cp, rm } = require("node:fs/promises");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const projectRoot = path.resolve(context.packager.projectDir, "..");
  const source = path.join(projectRoot, ".next", "standalone", "node_modules");
  const resourcesDir = context.packager.getResourcesDir(context.appOutDir);
  const destination = path.join(resourcesDir, "app", "node_modules");
  const nextPackage = path.join(destination, "next", "package.json");

  await access(path.join(source, "next", "package.json"));
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true, force: true, dereference: true });
  await access(nextPackage);

  console.log(`Copied standalone dependencies to ${destination}`);
};
