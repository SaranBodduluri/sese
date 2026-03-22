'use client';

/**
 * @file InputSource.tsx
 * @description Input column: grounding textbook (demo label) + live window capture.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  MonitorSmartphone,
  Loader2,
  AlertCircle,
  Cast,
  StopCircle,
  BookOpen,
} from 'lucide-react';
import { logger } from '@/lib/logger';

interface InputSourceProps {
  onAnalyze: (base64Image: string, mimeType: string) => void;
  isAnalyzing: boolean;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export function InputSource({ onAnalyze, isAnalyzing }: InputSourceProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setConnectionState('disconnected');
    logger.info('Stopped window capture');
  };

  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  const startCapture = async () => {
    try {
      setConnectionState('connecting');
      setErrorMessage(null);

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };

      setConnectionState('connected');
      logger.info('Started window capture');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to capture window';
      setErrorMessage(msg);
      setConnectionState('error');
      logger.error('Window capture failed', { error: msg });
    }
  };

  const captureFrameAndAnalyze = () => {
    if (!videoRef.current || !canvasRef.current || connectionState !== 'connected') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      logger.warn('Video dimensions not ready yet');
      return;
    }

    const maxW = 1280;
    const maxH = 720;
    const scale = Math.min(1, maxW / vw, maxH / vh);
    const outW = Math.max(1, Math.round(vw * scale));
    const outH = Math.max(1, Math.round(vh * scale));

    canvas.width = outW;
    canvas.height = outH;
    context.drawImage(video, 0, 0, outW, outH);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    const base64Data = dataUrl.split(',')[1];

    logger.info('Captured frame for analysis', { outW, outH, approxBytes: Math.round(base64Data.length * 0.75) });
    onAnalyze(base64Data, 'image/jpeg');
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MonitorSmartphone className="w-4 h-4 text-[#9CA3AF] shrink-0" strokeWidth={1.5} />
          <h2 className="text-xs font-semibold text-[#0A0A0A] truncate">Input</h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              connectionState === 'connected'
                ? 'bg-[#22C55E] animate-pulse'
                : connectionState === 'connecting'
                  ? 'bg-[#F59E0B] animate-pulse'
                  : connectionState === 'error'
                    ? 'bg-[#EF4444]'
                    : 'bg-[#D1D5DB]'
            }`}
          />
          <span className="text-[10px] uppercase tracking-[0.1em] text-[#9CA3AF] font-medium">
            {connectionState}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 p-4 overflow-y-auto">
        {/* Demo-only: textbook grounding (no upload in UI) */}
        <div className="flex items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF6A00]/10 text-[#C2410C]">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <p className="text-[11px] font-medium text-[#0A0A0A] text-left leading-snug">Grounding textbook</p>
        </div>

        <section className="flex flex-col gap-2 min-h-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">Live capture</p>
          <p className="text-[11px] leading-relaxed text-[#6B7280]">
            Share your OneNote window. After the first analyze, tutor actions reuse the same snapshot.
          </p>

          <div className="flex-1 min-h-[120px] relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-white flex flex-col items-center justify-center">
            <canvas ref={canvasRef} className="hidden" />

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-contain ${
                connectionState === 'connected' ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {connectionState === 'disconnected' && (
              <div className="flex flex-col items-center text-[#9CA3AF] p-4 text-center">
                <Cast className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.25} />
                <span className="text-xs font-medium text-[#6B7280] mb-0.5">No capture</span>
                <span className="text-[11px] text-[#9CA3AF]">Connect a window to start.</span>
              </div>
            )}

            {connectionState === 'connecting' && (
              <div className="flex flex-col items-center text-[#6B7280]">
                <Loader2 className="w-7 h-7 mb-2 animate-spin text-[#9CA3AF]" />
                <span className="text-[11px] font-medium">Waiting…</span>
              </div>
            )}

            {connectionState === 'error' && (
              <div className="flex flex-col items-center text-[#B91C1C] p-4 text-center">
                <AlertCircle className="w-7 h-7 mb-2" strokeWidth={1.25} />
                <span className="text-[11px] font-medium mb-0.5">Could not connect</span>
                <span className="text-[10px] text-[#DC2626]/90">{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0 pt-1">
            {connectionState === 'connected' ? (
              <>
                <button
                  type="button"
                  onClick={captureFrameAndAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-45"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" strokeWidth={1.5} />}
                  {isAnalyzing ? 'Analyzing…' : 'Analyze frame'}
                </button>
                <button
                  type="button"
                  onClick={stopCapture}
                  disabled={isAnalyzing}
                  className="w-full py-2 text-[#6B7280] text-xs font-medium rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] transition-colors flex items-center justify-center gap-2 disabled:opacity-45"
                >
                  <StopCircle className="w-4 h-4" strokeWidth={1.5} />
                  Stop
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startCapture}
                disabled={connectionState === 'connecting'}
                className="w-full py-2.5 border border-[#E5E7EB] bg-white text-[#0A0A0A] text-xs font-medium rounded-xl hover:border-[#FF6A00]/35 hover:bg-[#FFFBF5] transition-all flex items-center justify-center gap-2 disabled:opacity-45"
              >
                <Cast className="w-4 h-4" strokeWidth={1.5} />
                Connect window
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
