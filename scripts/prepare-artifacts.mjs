import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const wasmSourceDir = path.join(rootDir, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const wasmTargetDir = path.join(rootDir, 'public', 'wasm');
const modelsTargetDir = path.join(rootDir, 'public', 'models');
const modelFilePath = path.join(modelsTargetDir, 'face_landmarker.task');

// 1. Ensure target directories exist
fs.mkdirSync(wasmTargetDir, { recursive: true });
fs.mkdirSync(modelsTargetDir, { recursive: true });

// 2. Copy WASM runtime binaries from node_modules if present
if (fs.existsSync(wasmSourceDir)) {
  const files = fs.readdirSync(wasmSourceDir);
  for (const file of files) {
    const src = path.join(wasmSourceDir, file);
    const dest = path.join(wasmTargetDir, file);
    fs.copyFileSync(src, dest);
  }
  console.log(`[prepare-artifacts] Copied ${files.length} WASM binaries to public/wasm/`);
}

// 3. Download official MediaPipe Face Landmarker model if not present
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

async function ensureModel() {
  if (fs.existsSync(modelFilePath) && fs.statSync(modelFilePath).size > 1000000) {
    console.log('[prepare-artifacts] face_landmarker.task is present.');
    return;
  }

  console.log('[prepare-artifacts] Downloading face_landmarker.task from official MediaPipe storage...');
  const res = await fetch(MODEL_URL);
  if (!res.ok) {
    throw new Error(`Failed to download model: HTTP ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(modelFilePath, Buffer.from(buffer));
  console.log(`[prepare-artifacts] Successfully downloaded face_landmarker.task (${(buffer.byteLength / (1024 * 1024)).toFixed(2)} MB).`);
}

ensureModel().catch((err) => {
  console.error('[prepare-artifacts] Error ensuring model:', err.message);
  process.exit(1);
});

