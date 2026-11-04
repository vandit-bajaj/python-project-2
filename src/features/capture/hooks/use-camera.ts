'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CameraFacingMode, CameraError } from '../types';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isStreaming: boolean;
  isLoading: boolean;
  facingMode: CameraFacingMode;
  hasMultipleCameras: boolean;
  error: CameraError | null;
  startCamera: (mode?: CameraFacingMode) => Promise<void>;
  stopCamera: () => void;
  toggleFacingMode: () => Promise<void>;
  captureFrame: () => Promise<ImageBitmap | null>;
}

export function useCamera(initialFacingMode: CameraFacingMode = 'user'): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>(initialFacingMode);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);

  // Check available camera devices
  const checkDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    } catch {
      // In restricted iframes or permissions policies, enumerateDevices might fail quietly
    }
  }, []);

  const stopCamera = useCallback(() => {
    setStream((prevStream) => {
      if (prevStream) {
        prevStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(
    async (mode: CameraFacingMode = facingMode) => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError({
          code: 'UNSUPPORTED',
          message: 'Camera API is not supported in this browser.',
        });
        return;
      }

      setIsLoading(true);
      setError(null);
      stopCamera();

      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true;
          await videoRef.current.play();
        }

        setFacingMode(mode);
        setIsStreaming(true);
        await checkDevices();
      } catch (err: unknown) {
        stopCamera();
        const errObj = err as { name?: string; message?: string };
        const errName = errObj?.name || '';

        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setError({
            code: 'PERMISSION_DENIED',
            message:
              'Camera access was denied. DermaLens processes video strictly inside your browser. Please allow camera permissions in your browser settings to continue.',
            technicalDetails: errObj.message,
          });
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setError({
            code: 'NOT_FOUND',
            message: 'No video camera found on your device.',
            technicalDetails: errObj.message,
          });
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setError({
            code: 'IN_USE',
            message: 'Camera is currently in use by another application or tab.',
            technicalDetails: errObj.message,
          });
        } else if (errName === 'OverconstrainedError') {
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            setStream(fallbackStream);
            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              await videoRef.current.play();
            }
            setIsStreaming(true);
            setError(null);
          } catch {
            setError({
              code: 'OVERCONSTRAINED',
              message: 'Camera cannot satisfy resolution constraints.',
            });
          }
        } else {
          setError({
            code: 'UNKNOWN',
            message: 'Unable to initialize camera.',
            technicalDetails: errObj.message,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [facingMode, stopCamera, checkDevices],
  );

  const toggleFacingMode = useCallback(async () => {
    const nextMode: CameraFacingMode = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(nextMode);
  }, [facingMode, startCamera]);

  const captureFrame = useCallback(async (): Promise<ImageBitmap | null> => {
    const video = videoRef.current;
    if (!video || !isStreaming || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    try {
      return await createImageBitmap(video);
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0);
      return await createImageBitmap(canvas);
    }
  }, [isStreaming]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    isStreaming,
    isLoading,
    facingMode,
    hasMultipleCameras,
    error,
    startCamera,
    stopCamera,
    toggleFacingMode,
    captureFrame,
  };
}
