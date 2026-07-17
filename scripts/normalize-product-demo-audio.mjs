import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const remotionCli = resolve(projectRoot, "node_modules", "@remotion", "cli", "remotion-cli.js");
const inputPath = resolve(projectRoot, "outputs", "interviewlab-product-demo-raw.mp4");
const outputPath = resolve(projectRoot, "outputs", "interviewlab-product-demo.mp4");
const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";

await stat(inputPath);

function runFfmpeg(args) {
  const result = spawnSync(process.execPath, [remotionCli, "ffmpeg", ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`FFmpeg failed with exit code ${result.status}:\n${output}`);
  }

  return output;
}

const target = "I=-16:TP=-1.5:LRA=11";
const analysisOutput = runFfmpeg([
  "-hide_banner",
  "-i",
  inputPath,
  "-map",
  "0:a:0",
  "-vn",
  "-af",
  `loudnorm=${target}:print_format=json`,
  "-c:a",
  "pcm_s16le",
  "-f",
  "null",
  nullDevice,
]);

const measurementMatch = analysisOutput.match(/\{\s*"input_i"[\s\S]*?\}/);
if (!measurementMatch) {
  throw new Error(`Could not read loudness measurements from FFmpeg:\n${analysisOutput}`);
}

const measurement = JSON.parse(measurementMatch[0]);
const normalizationFilter = [
  `loudnorm=${target}`,
  `measured_I=${measurement.input_i}`,
  `measured_LRA=${measurement.input_lra}`,
  `measured_TP=${measurement.input_tp}`,
  `measured_thresh=${measurement.input_thresh}`,
  `offset=${measurement.target_offset}`,
  "linear=true",
].join(":");

runFfmpeg([
  "-hide_banner",
  "-y",
  "-i",
  inputPath,
  "-map",
  "0:v:0",
  "-map",
  "0:a:0",
  "-c:v",
  "copy",
  "-af",
  normalizationFilter,
  "-c:a",
  "aac",
  "-b:a",
  "256k",
  "-ar",
  "48000",
  outputPath,
]);

const normalizedStats = await stat(outputPath);
console.log(
  `Normalized product-demo audio to -16 LUFS: ${outputPath} (${(
    normalizedStats.size /
    1024 /
    1024
  ).toFixed(1)} MB)`,
);
