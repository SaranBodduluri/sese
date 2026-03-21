'use client';

/**
 * @file InputSource.tsx
 * @description The left-most panel representing the student's input source.
 * 
 * Use Cases:
 * - Allows the user to select a specific window (e.g., Microsoft OneNote) to capture.
 * - Previews the live capture stream.
 * - Captures a frame from the stream and triggers the analysis process.
 * 
 * Interactions:
 * - Passes the base64 image data to the parent component (`WorkspaceLayout.tsx`).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, MonitorSmartphone, Loader2, AlertCircle, Cast, StopCircle } from 'lucide-react';
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
      streamRef.current.getTracks().forEach(track => track.stop());
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

      // Handle user stopping the stream via browser UI
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

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get base64 image data
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = dataUrl.split(',')[1];
    
    logger.info('Captured frame for analysis');
    onAnalyze(base64Data, 'image/jpeg');
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden text-slate-200">
      <div className="p-3 border-b border-slate-700 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">Live Input</h2>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' :
            connectionState === 'connecting' ? 'bg-amber-500 animate-pulse' :
            connectionState === 'error' ? 'bg-rose-500' :
            'bg-slate-600'
          }`} />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            {connectionState}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4">
        <div className="text-xs text-slate-400">
          Connect your OneNote window for live observation. After you analyze a frame once, the tutor panel can re-check that same snapshot.
        </div>
        
        <div className="flex-1 relative rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-900 flex flex-col items-center justify-center">
          {/* Hidden canvas for frame extraction */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Video Preview */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`absolute inset-0 w-full h-full object-contain ${connectionState === 'connected' ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Disconnected State */}
          {connectionState === 'disconnected' && (
            <div className="flex flex-col items-center text-slate-500 p-4 text-center">
              <Cast className="w-8 h-8 mb-3 opacity-50" />
              <span className="text-sm font-medium text-slate-300 mb-1">No Window Connected</span>
              <span className="text-xs">Share your OneNote window to begin.</span>
            </div>
          )}

          {/* Connecting State */}
          {connectionState === 'connecting' && (
            <div className="flex flex-col items-center text-indigo-400">
              <Loader2 className="w-8 h-8 mb-2 animate-spin" />
              <span className="text-xs font-medium">Waiting for permission...</span>
            </div>
          )}

          {/* Error State */}
          {connectionState === 'error' && (
            <div className="flex flex-col items-center text-rose-400 p-4 text-center">
              <AlertCircle className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium mb-1">Connection Failed</span>
              <span className="text-[10px] text-rose-500/80">{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {connectionState === 'connected' ? (
            <>
              <button 
                onClick={captureFrameAndAnalyze}
                disabled={isAnalyzing}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Latest Frame'}
              </button>
              <button 
                onClick={stopCapture}
                disabled={isAnalyzing}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <StopCircle className="w-4 h-4" />
                Disconnect
              </button>
            </>
          ) : (
            <button 
              onClick={startCapture}
              disabled={connectionState === 'connecting'}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <Cast className="w-4 h-4" />
              Connect OneNote Window
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
