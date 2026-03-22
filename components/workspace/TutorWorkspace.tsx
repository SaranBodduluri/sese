'use client';

/**
 * @file TutorWorkspace.tsx
 * @description The right side of the app where Sese the Panda provides feedback.
 * 
 * Use Cases:
 * - Displays the mascot's current state (happy, thinking, etc.).
 * - Renders the structured feedback from the AI.
 * - Quick actions for the student.
 * - Handles ElevenLabs TTS playback for the tutor's speech.
 */

import React, { useState, useEffect, useRef } from 'react';
import { TutorFeedback, SessionProfile } from '@/lib/ai/types';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  Lightbulb,
  CheckSquare,
  Zap,
  AlertCircle,
  BookOpen,
  FileText,
  File,
  Volume2,
  VolumeX,
  Play,
  Loader2,
} from 'lucide-react';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import {
  shouldAutoPlayAfterNewTutorSpeech,
  shouldRequestServerTts,
  shouldAllowBrowserTtsFallback,
} from '@/lib/tts/tutorAudioPolicy';
import { cancelBrowserTTS, primeBrowserVoices, speakWithBrowserTTS } from '@/lib/tts/browserSpeech';
import { SourceAttributionChips } from '@/components/grounding/SourceAttributionChips';
import { TutorChatInput } from '@/components/tutor/TutorChatInput';
import { SolutionProgressBar } from '@/components/tutor/SolutionProgressBar';
import confetti from 'canvas-confetti';

interface TutorWorkspaceProps {
  feedback: TutorFeedback | null;
  isAnalyzing: boolean;
  /** Freeform tutor chat in flight (separate from frame analysis). */
  isChatting: boolean;
  studyStreak: number;
  sessionProfile: SessionProfile | null;
  /** True after at least one frame was analyzed (same snapshot reused for tutor actions). */
  hasLastFrame: boolean;
  /** Re-runs multimodal analysis on the last captured frame. */
  onTutorAction: (action: 'hint' | 'explain' | 'check') => void;
  /** Freeform message to `/api/tutor/chat`. */
  onTutorMessage: (message: string) => void;
}

export function TutorWorkspace({
  feedback,
  isAnalyzing,
  isChatting,
  studyStreak,
  sessionProfile,
  hasLastFrame,
  onTutorAction,
  onTutorMessage,
}: TutorWorkspaceProps) {
  /**
   * Mute = no auto-play and no replay until unmuted (companion stays “quiet”).
   * Initial: muted when global auto-play is off so first sound is opt-in.
   */
  const [isMuted, setIsMuted] = useState(!config.elevenlabs.autoPlayTutorAudio);
  const isMutedRef = useRef(isMuted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** How the current tutor line can be played (for UI + replay). */
  const [voiceBackend, setVoiceBackend] = useState<'none' | 'elevenlabs' | 'browser'>('none');
  const lastCelebrationKeyRef = useRef<string | null>(null);

  const isTutorBusy = isAnalyzing || isChatting;

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    primeBrowserVoices();
  }, []);

  /** While a new frame is analyzing or chat is streaming, stop any ongoing speech (no overlap). */
  useEffect(() => {
    if (isTutorBusy) {
      audioRef.current?.pause();
      cancelBrowserTTS();
      setIsPlaying(false);
    }
  }, [isTutorBusy]);

  /** Tasteful celebration when the model marks a completed-problem moment. */
  useEffect(() => {
    if (!feedback?.celebrationSuggested || !feedback.tutorSpeech) return;
    const key = `${feedback.tutorSpeech.slice(0, 160)}|${feedback.celebrationSuggested}`;
    if (lastCelebrationKeyRef.current === key) return;
    lastCelebrationKeyRef.current = key;
    confetti({
      particleCount: 88,
      spread: 70,
      origin: { y: 0.72 },
      ticks: 200,
      colors: ['#FF6A00', '#FBBF24', '#E5E7EB', '#0A0A0A'],
    });
  }, [feedback?.celebrationSuggested, feedback?.tutorSpeech]);

  const tutorSpeech = feedback?.tutorSpeech ?? null;

  /**
   * Fetch ElevenLabs audio for this tutor line; auto-play only if policy allows and user is unmuted.
   * On failure, optional browser TTS fallback (same script, companion tone preserved).
   */
  useEffect(() => {
    if (!tutorSpeech || !shouldRequestServerTts(config.elevenlabs.ttsEnabled)) {
      audioRef.current?.pause();
      cancelBrowserTTS();
      setVoiceBackend('none');
      setCurrentAudioUrl(null);
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      return;
    }

    const ac = new AbortController();
    let cancelled = false;
    let blobUrlForThisTurn: string | null = null;

    const autoPlayCtx = () => ({
      isUserMuted: isMutedRef.current,
      ttsEnabledGlobally: config.elevenlabs.ttsEnabled,
      autoPlayOnNewFeedbackEnabled: config.elevenlabs.autoPlayTutorAudio,
    });

    const playElevenLabsUrl = (url: string) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        logger.error('ElevenLabs playback error');
      };
      const p = audio.play();
      p?.catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        logger.error('Playback blocked or failed', { error: String(err) });
        setIsPlaying(false);
      });
    };

    void (async () => {
      setIsGeneratingAudio(true);
      setVoiceBackend('none');
      cancelBrowserTTS();
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      setCurrentAudioUrl(null);

      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: tutorSpeech }),
          signal: ac.signal,
        });

        if (cancelled) return;

        const ct = response.headers.get('content-type') || '';
        if (!response.ok || !ct.includes('audio')) {
          throw new Error('TTS response not audio');
        }

        const blob = await response.blob();
        if (cancelled) return;
        if (blob.size < 64) {
          throw new Error('TTS empty body');
        }

        blobUrlForThisTurn = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(blobUrlForThisTurn);
          blobUrlForThisTurn = null;
          return;
        }
        currentAudioUrlRef.current = blobUrlForThisTurn;
        setCurrentAudioUrl(blobUrlForThisTurn);
        setVoiceBackend('elevenlabs');

        if (shouldAutoPlayAfterNewTutorSpeech(autoPlayCtx())) {
          playElevenLabsUrl(blobUrlForThisTurn);
        }
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === 'AbortError')) return;
        logger.error('Tutor ElevenLabs TTS failed', { error: String(e) });

        const allowBrowser = shouldAllowBrowserTtsFallback(
          config.elevenlabs.ttsEnabled,
          config.elevenlabs.browserTtsFallback,
        );

        if (allowBrowser) {
          setVoiceBackend('browser');
          if (shouldAutoPlayAfterNewTutorSpeech(autoPlayCtx())) {
            setIsPlaying(true);
            speakWithBrowserTTS(tutorSpeech, () => setIsPlaying(false));
          }
        } else {
          setVoiceBackend('none');
        }
      } finally {
        if (!cancelled) {
          setIsGeneratingAudio(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
      audioRef.current?.pause();
      cancelBrowserTTS();
      if (blobUrlForThisTurn) {
        URL.revokeObjectURL(blobUrlForThisTurn);
        if (currentAudioUrlRef.current === blobUrlForThisTurn) {
          currentAudioUrlRef.current = null;
        }
      }
      setIsPlaying(false);
    };
  }, [tutorSpeech]);

  const handleReplay = () => {
    if (isMuted) {
      logger.info('Replay ignored while muted');
      return;
    }
    if (!tutorSpeech) return;
    logger.info('User requested tutor replay');
    const url = currentAudioUrlRef.current;
    if (url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      void audio.play().catch(() => setIsPlaying(false));
      return;
    }
    if (shouldAllowBrowserTtsFallback(config.elevenlabs.ttsEnabled, config.elevenlabs.browserTtsFallback)) {
      cancelBrowserTTS();
      setIsPlaying(true);
      speakWithBrowserTTS(tutorSpeech, () => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    logger.info('User toggled tutor mute', { isMuted: next });
    if (next) {
      audioRef.current?.pause();
      cancelBrowserTTS();
      setIsPlaying(false);
    }
  };

  const renderMascot = () => {
    let emoji = '🐼';
    let bgClass = 'bg-slate-100';
    let animationClass = '';

    if (isTutorBusy) {
      emoji = '🤔';
      bgClass = 'bg-[#F9FAFB]';
      animationClass = 'animate-pulse';
    } else if (isPlaying) {
      emoji = '🐼💬';
      bgClass = 'bg-[#FFF7ED]';
      animationClass = 'animate-bounce';
    } else if (feedback) {
      switch (feedback.mascotState) {
        case 'happy': emoji = '🐼✨'; bgClass = 'bg-[#ECFDF5]'; break;
        case 'encouraging': emoji = '🐼💪'; bgClass = 'bg-[#FFFBEB]'; break;
        case 'confused': emoji = '🐼❓'; bgClass = 'bg-[#FFF7ED]'; break;
        case 'thinking': emoji = '🐼💭'; bgClass = 'bg-[#F9FAFB]'; break;
        default: emoji = '🐼'; bgClass = 'bg-[#F9FAFB]';
      }
    }

    return (
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] border border-[#E5E7EB] ${bgClass} ${animationClass} transition-colors duration-300 shrink-0 relative`}
      >
        {emoji}
        {isPlaying && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6A00]/40 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FF6A00]" />
          </span>
        )}
      </div>
    );
  };

  const getCorrectnessColor = (assessment: string) => {
    switch (assessment) {
      case 'correct':
        return 'bg-[#ECFDF5] border-[#D1FAE5] text-[#065F46]';
      case 'incorrect':
        return 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]';
      case 'partial':
        return 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]';
      default:
        return 'bg-[#F9FAFB] border-[#E5E7EB] text-[#374151]';
    }
  };

  const getCorrectnessIcon = (assessment: string) => {
    switch (assessment) {
      case 'correct':
        return <CheckSquare className="w-4 h-4 shrink-0 text-[#059669]" strokeWidth={1.5} />;
      case 'incorrect':
        return <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" strokeWidth={1.5} />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 shrink-0 text-[#D97706]" strokeWidth={1.5} />;
      default:
        return <CheckSquare className="w-4 h-4 shrink-0 text-[#9CA3AF]" strokeWidth={1.5} />;
    }
  };

  const renderCitations = () => {
    if (!feedback?.grounded || !feedback.citations || feedback.citations.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] px-0.5 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
          Model citations
        </div>
        <div className="flex flex-col gap-2">
          {feedback.citations.map((citation, idx) => (
            <div
              key={idx}
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2.5 flex items-start gap-2.5"
            >
              {citation.sourceType === 'pdf' ? (
                <FileText className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0 mt-0.5" strokeWidth={1.5} />
              ) : (
                <File className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0 mt-0.5" strokeWidth={1.5} />
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-[#374151]">
                  {citation.sourceTitle}
                  {citation.pageReference && (
                    <span className="text-[#9CA3AF] font-normal">, {citation.pageReference}</span>
                  )}
                </span>
                <span className="text-[10px] text-[#9CA3AF] italic mt-0.5 line-clamp-2">
                  &quot;{citation.quotedOrReferencedSection}&quot;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Assistant</p>
          <h2 className="text-sm font-semibold text-[#0A0A0A]">
            Sese <span className="text-[#6B7280] font-normal">· tutor</span>
          </h2>
          {studyStreak > 0 && (
            <p className="text-[10px] text-[#9CA3AF] mt-1">
              Streak <span className="text-[#0A0A0A] font-medium">{studyStreak}</span> win
              {studyStreak === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <span className="text-lg opacity-90" aria-hidden>
          🐼
        </span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-6">
        
          {/* Mascot & speech */}
        <div className="flex flex-col items-center gap-4 pt-1">
          {renderMascot()}

          <AnimatePresence mode="wait">
            {isTutorBusy ? (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="bg-[#F9FAFB] text-[#6B7280] px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[95%] border border-[#E5E7EB] leading-relaxed"
              >
                {isAnalyzing ? 'Taking a look at your work…' : 'Thinking with you…'}
              </motion.div>
            ) : feedback ? (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 w-full"
              >
                <div className="bg-[#FAFAFA] text-[#0A0A0A] px-4 py-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed border border-[#E5E7EB] shadow-sm">
                  {feedback.celebrationSuggested && (
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FF6A00] mb-2">
                      Nice — milestone reached
                    </p>
                  )}
                  <p className="font-medium text-[15px] text-[#0A0A0A]">{feedback.tutorSpeech}</p>
                  {feedback.followUpQuestion && (
                    <p className="text-[#6B7280] italic mt-3 text-[13px] border-t border-[#E5E7EB] pt-3">
                      {feedback.followUpQuestion}
                    </p>
                  )}

                  {config.elevenlabs.ttsEnabled && (
                    <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF]">
                          {isGeneratingAudio
                            ? 'Preparing voice…'
                            : isMuted
                              ? 'Muted'
                              : config.elevenlabs.autoPlayTutorAudio
                                ? 'Auto-play on'
                                : 'Auto-play off'}
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          {voiceBackend === 'elevenlabs'
                            ? 'Cloud voice'
                            : voiceBackend === 'browser'
                              ? 'Browser voice'
                              : isGeneratingAudio
                                ? ''
                                : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleReplay}
                          disabled={
                            isMuted ||
                            isGeneratingAudio ||
                            (!currentAudioUrl &&
                              !shouldAllowBrowserTtsFallback(
                                config.elevenlabs.ttsEnabled,
                                config.elevenlabs.browserTtsFallback,
                              ))
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[#0A0A0A] text-xs font-medium hover:border-[#FF6A00]/40 hover:bg-[#FFFBF5] transition-colors disabled:opacity-40 disabled:pointer-events-none"
                          title={isMuted ? 'Unmute to replay' : 'Replay explanation'}
                        >
                          {isGeneratingAudio ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          Replay
                        </button>
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[#0A0A0A] text-xs font-medium hover:border-[#FF6A00]/40 transition-colors"
                          title={isMuted ? 'Unmute Sese' : 'Mute Sese'}
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <SourceAttributionChips
                  mode={feedback.groundingMode}
                  items={feedback.sourceAttributions}
                />
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#F9FAFB] text-[#6B7280] px-4 py-3 rounded-2xl rounded-tl-sm text-sm border border-[#E5E7EB] max-w-[95%] leading-relaxed"
              >
                {sessionProfile ? (
                  <>
                    Hi {sessionProfile.studentName}. When you capture a frame, I&apos;ll walk you through it.
                  </>
                ) : (
                  <>Ready when you are.</>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Compact Structured Feedback */}
        {feedback && !isTutorBusy && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] px-0.5">
              Summary
            </div>

            <SolutionProgressBar feedback={feedback} />

            <div
              className={`p-3.5 rounded-xl border text-sm flex items-start gap-3 ${getCorrectnessColor(feedback.correctnessAssessment)}`}
            >
              {getCorrectnessIcon(feedback.correctnessAssessment)}
              <div>
                <span className="font-semibold block mb-1 capitalize text-[13px]">
                  {feedback.correctnessAssessment} step
                </span>
                <span className="text-[13px] leading-relaxed opacity-95">{feedback.whatISaw}</span>
              </div>
            </div>

            {feedback.nextHint && (
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white text-[#374151] text-sm flex items-start gap-3 shadow-sm">
                <Lightbulb className="w-4 h-4 shrink-0 text-[#FF6A00]" strokeWidth={1.5} />
                <div>
                  <span className="font-semibold block mb-1 text-[13px] text-[#0A0A0A]">Next hint</span>
                  <span className="text-[13px] leading-relaxed">{feedback.nextHint}</span>
                </div>
              </div>
            )}

            {renderCitations()}
          </motion.div>
        )}

      </div>

      {/* Quick actions — same Gemini path as Analyze frame */}
      <div className="p-4 pb-3 bg-[#FAFAFA] border-t border-[#E5E7EB] grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!hasLastFrame || isTutorBusy}
          onClick={() => onTutorAction('hint')}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-white border border-[#E5E7EB] rounded-xl text-[#374151] hover:border-[#FF6A00]/35 hover:bg-[#FFFBF5] transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none"
        >
          <Lightbulb className="w-4 h-4 text-[#6B7280]" strokeWidth={1.5} />
          <span className="text-[11px] font-medium tracking-tight">Hint</span>
        </button>
        <button
          type="button"
          disabled={!hasLastFrame || isTutorBusy}
          onClick={() => onTutorAction('explain')}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-white border border-[#E5E7EB] rounded-xl text-[#374151] hover:border-[#FF6A00]/35 hover:bg-[#FFFBF5] transition-all duration-200 disabled:opacity-45 disabled:pointer-events-none"
        >
          <MessageCircle className="w-4 h-4 text-[#6B7280]" strokeWidth={1.5} />
          <span className="text-[11px] font-medium tracking-tight">Explain</span>
        </button>
        <button
          type="button"
          disabled={!hasLastFrame || isTutorBusy}
          onClick={() => onTutorAction('check')}
          className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 bg-[#0A0A0A] text-white rounded-xl hover:bg-[#262626] transition-colors duration-200 disabled:opacity-45 disabled:pointer-events-none"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" strokeWidth={1.5} />}
          <span className="text-sm font-medium">{isAnalyzing ? 'Thinking…' : 'Check step'}</span>
        </button>
      </div>

      <TutorChatInput
        disabled={isTutorBusy}
        isSending={isChatting}
        onSend={(msg) => onTutorMessage(msg)}
      />
    </div>
  );
}
