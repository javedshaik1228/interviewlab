import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_FORMATS, FilePathSource, Input } from "mediabunny";
import {
  MUSIC_FILE,
  PRODUCT_DEMO_DURATION_FRAMES,
  PRODUCT_DEMO_FPS,
  VOICEOVER_SCENES,
} from "../remotion/audio-plan.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(projectRoot, "public");
const args = new Set(process.argv.slice(2));
const musicOnly = args.has("--music-only");
const voiceOnly = args.has("--voice-only");
const fromArgument = process.argv.slice(2).find((argument) => argument.startsWith("--from="));
const fromScene = fromArgument?.slice("--from=".length);

if (musicOnly && voiceOnly) {
  throw new Error("Choose either --music-only or --voice-only, not both.");
}

const clampSample = (value) => Math.max(-1, Math.min(1, value));

function writeWavHeader(buffer, sampleRate, frameCount) {
  const channelCount = 2;
  const bitsPerSample = 16;
  const blockAlign = (channelCount * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataLength = frameCount * blockAlign;

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
}

async function generateMusic() {
  const sampleRate = 44100;
  const durationSeconds = PRODUCT_DEMO_DURATION_FRAMES / PRODUCT_DEMO_FPS;
  const frameCount = Math.round(sampleRate * durationSeconds);
  const buffer = Buffer.alloc(44 + frameCount * 4);
  const progression = [
    [130.81, 164.81, 196, 246.94],
    [110, 130.81, 164.81, 196],
    [87.31, 110, 130.81, 164.81],
    [98, 123.47, 146.83, 220],
  ];

  writeWavHeader(buffer, sampleRate, frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / sampleRate;
    const chordIndex = Math.floor(time / 5) % progression.length;
    const chord = progression[chordIndex];
    const localChordTime = time % 5;
    const chordFade = Math.min(1, localChordTime / 0.8, (5 - localChordTime) / 0.8);
    const masterFade = Math.min(1, time / 1.25, (durationSeconds - time) / 1.6);

    let left = 0;
    let right = 0;
    for (let note = 0; note < chord.length; note += 1) {
      const frequency = chord[note];
      const slowMotion = 1 + 0.0018 * Math.sin(2 * Math.PI * (0.07 + note * 0.01) * time);
      const pad = Math.sin(2 * Math.PI * frequency * slowMotion * time + note * 0.55);
      const octave = Math.sin(2 * Math.PI * frequency * 2 * time + note * 0.31) * 0.16;
      const pan = note / (chord.length - 1);
      left += (pad + octave) * (0.3 + (1 - pan) * 0.16);
      right += (pad + octave) * (0.3 + pan * 0.16);
    }

    const pulseLength = 0.625;
    const pulseIndex = Math.floor(time / pulseLength);
    const pulseTime = time % pulseLength;
    const pulseFrequency = chord[pulseIndex % chord.length] * 2;
    const pulseEnvelope = Math.min(1, pulseTime / 0.025) * Math.exp(-pulseTime * 7.5);
    const pulse = Math.sin(2 * Math.PI * pulseFrequency * time) * pulseEnvelope * 0.28;
    const pulsePan = pulseIndex % 2 === 0 ? 0.72 : 0.28;

    const beatTime = time % 2.5;
    const beatEnvelope = Math.exp(-beatTime * 13);
    const beatFrequency = 52 + 30 * Math.exp(-beatTime * 24);
    const beat = Math.sin(2 * Math.PI * beatFrequency * beatTime) * beatEnvelope * 0.24;

    const padGain = 0.115 * chordFade;
    left = left * padGain + pulse * (1 - pulsePan) + beat;
    right = right * padGain + pulse * pulsePan + beat;
    left *= masterFade * 0.72;
    right *= masterFade * 0.72;

    buffer.writeInt16LE(Math.round(clampSample(left) * 32767), 44 + frame * 4);
    buffer.writeInt16LE(Math.round(clampSample(right) * 32767), 46 + frame * 4);
  }

  const outputPath = resolve(publicRoot, MUSIC_FILE);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
  console.log(`Generated original background music: ${outputPath}`);
}

async function getDurationSeconds(filePath) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new FilePathSource(filePath),
  });

  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
}

async function generateVoiceover() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY is not configured. Set it in the current shell, then run npm run video:audio:voice.",
    );
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const startIndex = fromScene
    ? VOICEOVER_SCENES.findIndex((scene) => scene.id === fromScene)
    : 0;
  if (startIndex === -1) {
    throw new Error(`Unknown voiceover scene: ${fromScene}`);
  }

  for (const [index, scene] of VOICEOVER_SCENES.entries()) {
    if (index < startIndex) {
      continue;
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: scene.text,
          model_id: "eleven_multilingual_v2",
          seed: 1228 + index,
          voice_settings: {
            stability: 0.56,
            similarity_boost: 0.78,
            style: 0.18,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`ElevenLabs failed for ${scene.id} (${response.status}): ${details}`);
    }

    const outputPath = resolve(publicRoot, scene.file);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));

    const durationSeconds = await getDurationSeconds(outputPath);
    const maximumSeconds = scene.maxDurationFrames / PRODUCT_DEMO_FPS;
    if (durationSeconds > maximumSeconds) {
      throw new Error(
        `${scene.id} narration is ${durationSeconds.toFixed(2)}s, longer than its ${maximumSeconds.toFixed(2)}s scene slot. Shorten the script before rendering.`,
      );
    }

    console.log(
      `Generated ${scene.id}: ${durationSeconds.toFixed(2)}s / ${maximumSeconds.toFixed(2)}s`,
    );
  }
}

if (!voiceOnly) {
  await generateMusic();
}

if (!musicOnly) {
  await generateVoiceover();
}
