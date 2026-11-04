import * as Comlink from 'comlink';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { FaceMeshResult } from '../types';

let faceLandmarker: FaceLandmarker | null = null;
let isInitializing = false;

export class FaceMeshService {
  async init(): Promise<boolean> {
    if (faceLandmarker) return true;
    if (isInitializing) return false;

    isInitializing = true;
    try {
      // Use strictly self-hosted WASM binaries
      const vision = await FilesetResolver.forVisionTasks('/wasm');

      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numFaces: 1,
        minFaceDetectionConfidence: 0.7,
        minFacePresenceConfidence: 0.7,
        minTrackingConfidence: 0.7,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      });

      return true;
    } catch {
      // If WebGL/GPU delegate fails, retry with CPU/WASM delegate
      try {
        const vision = await FilesetResolver.forVisionTasks('/wasm');
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numFaces: 1,
          minFaceDetectionConfidence: 0.7,
        });
        return true;
      } catch {
        return false;
      }
    } finally {
      isInitializing = false;
    }
  }

  async detect(bitmap: ImageBitmap): Promise<FaceMeshResult | null> {
    if (!faceLandmarker) {
      const initialized = await this.init();
      if (!initialized || !faceLandmarker) return null;
    }

    try {
      const result = faceLandmarker.detect(bitmap);
      const faceLandmarks = result.faceLandmarks[0];

      if (!faceLandmarks || faceLandmarks.length === 0) {
        return null;
      }

      // Calculate 2D bounding box
      let minX = 1;
      let maxX = 0;
      let minY = 1;
      let maxY = 0;

      const landmarks = faceLandmarks.map((lm) => {
        if (lm.x < minX) minX = lm.x;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.y > maxY) maxY = lm.y;

        return {
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        };
      });

      const faceRect = {
        x: minX,
        y: minY,
        width: Math.max(0, maxX - minX),
        height: Math.max(0, maxY - minY),
      };

      return {
        landmarks,
        confidence: 0.95,
        faceRect,
      };
    } catch {
      return null;
    }
  }
}

Comlink.expose(new FaceMeshService());

