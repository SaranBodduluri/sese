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
import { MessageCircle, Lightbulb, CheckSquare, Zap, AlertCircle, BookOpen, FileText, File, Volume2, VolumeX, Play, Loader2 } from 'lucide-react';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

interface TutorWorkspaceProps {
  feedback: TutorFeedback | null;
  isAnalyzing: boolean;
  sessionProfile: SessionProfile | null;
}

export function TutorWorkspace({ feedback, isAnalyzing, sessionProfile }: TutorWorkspaceProps) {
  const [isMuted, setIsMuted] = useState(!config.elevenlabs.autoPlayTutorAudio);
  const isMutedRef = useRef(isMuted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update ref when state changes
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    };
  }, []);

  // Handle new feedback audio generation
  useEffect(() => {
    if (!feedback?.tutorSpeech || !config.elevenlabs.ttsEnabled) return;

    const generateAndPlayAudio = async () => {
      setIsGeneratingAudio(true);
      try {
        logger.info('Requesting TTS for new tutor feedback');
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: feedback.tutorSpeech }),
        });

        if (!response.ok) throw new Error('TTS request failed');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Cleanup previous URL
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current);
        }
        
        currentAudioUrlRef.current = url;
        setCurrentAudioUrl(url);

        if (!isMutedRef.current) {
          playAudio(url);
        }
      } catch (error) {
        logger.error('Failed to generate tutor audio', { error: String(error) });
      } finally {
        setIsGeneratingAudio(false);
      }
    };

    generateAndPlayAudio();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [feedback?.tutorSpeech]); // Only trigger when the actual speech text changes

  const playAudio = async (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      logger.error('Audio playback error');
    };

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          logger.error('Auto-play blocked or failed', { error: String(error) });
          setIsPlaying(false);
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      logger.error('Auto-play blocked or failed', { error: String(error) });
      setIsPlaying(false);
    }
  };

  const handleReplay = () => {
    if (currentAudioUrl) {
      logger.info('User requested audio replay');
      playAudio(currentAudioUrl);
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    logger.info('User toggled mute', { isMuted: newMutedState });
    
    if (newMutedState && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const renderMascot = () => {
    let emoji = '🐼';
    let bgClass = 'bg-slate-100';
    let animationClass = '';

    if (isAnalyzing) {
      emoji = '🤔';
      bgClass = 'bg-indigo-50';
      animationClass = 'animate-pulse';
    } else if (isPlaying) {
      emoji = '🐼💬';
      bgClass = 'bg-emerald-50';
      animationClass = 'animate-bounce';
    } else if (feedback) {
      switch (feedback.mascotState) {
        case 'happy': emoji = '🐼✨'; bgClass = 'bg-emerald-50'; break;
        case 'encouraging': emoji = '🐼💪'; bgClass = 'bg-amber-50'; break;
        case 'confused': emoji = '🐼❓'; bgClass = 'bg-orange-50'; break;
        case 'thinking': emoji = '🐼💭'; bgClass = 'bg-indigo-50'; break;
        default: emoji = '🐼'; bgClass = 'bg-slate-100';
      }
    }

    return (
      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner ${bgClass} ${animationClass} transition-colors duration-500 shrink-0 relative`}>
        {emoji}
        {isPlaying && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        )}
      </div>
    );
  };

  const getCorrectnessColor = (assessment: string) => {
    switch (assessment) {
      case 'correct': return 'bg-emerald-50 border-emerald-100 text-emerald-800';
      case 'incorrect': return 'bg-rose-50 border-rose-100 text-rose-800';
      case 'partial': return 'bg-amber-50 border-amber-100 text-amber-800';
      default: return 'bg-slate-50 border-slate-100 text-slate-800';
    }
  };

  const getCorrectnessIcon = (assessment: string) => {
    switch (assessment) {
      case 'correct': return <CheckSquare className="w-5 h-5 shrink-0 text-emerald-500" />;
      case 'incorrect': return <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />;
      case 'partial': return <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />;
      default: return <CheckSquare className="w-5 h-5 shrink-0 text-slate-500" />;
    }
  };

  const renderCitations = () => {
    if (!feedback?.grounded || !feedback.citations || feedback.citations.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Sources
        </div>
        <div className="flex flex-col gap-2">
          {feedback.citations.map((citation, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-start gap-2.5">
              {citation.sourceType === 'pdf' ? (
                <FileText className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <File className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-700">
                  {citation.sourceTitle}
                  {citation.pageReference && <span className="text-slate-500 font-normal">, {citation.pageReference}</span>}
                </span>
                <span className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-2">
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
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <span className="text-xl">🐼</span>
        <h2 className="text-lg font-semibold text-slate-800">Sese Tutor</h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6">
        
        {/* Mascot & Speech Bubble */}
        <div className="flex flex-col items-center gap-4 pt-4">
          {renderMascot()}
          
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                key="thinking" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                className="bg-slate-100 text-slate-600 px-4 py-3 rounded-2xl rounded-tl-none text-sm max-w-[90%]"
              >
                Hmm, let me take a look at the board...
              </motion.div>
            ) : feedback ? (
              <motion.div 
                key="feedback" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex flex-col gap-2 w-full"
              >
                <div className="bg-indigo-50 text-indigo-900 px-5 py-4 rounded-2xl rounded-tl-none text-sm shadow-sm border border-indigo-100 leading-relaxed relative group">
                  <p className="font-medium mb-2">{feedback.tutorSpeech}</p>
                  {feedback.followUpQuestion && (
                    <p className="text-indigo-800/80 italic mt-2">{feedback.followUpQuestion}</p>
                  )}
                  
                  {/* Audio Controls */}
                  {config.elevenlabs.ttsEnabled && (
                    <div className="absolute -bottom-3 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-indigo-100 rounded-full px-2 py-1">
                      {isGeneratingAudio ? (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      ) : (
                        <>
                          <button 
                            onClick={handleReplay}
                            disabled={!currentAudioUrl || isPlaying}
                            className="p-1 text-indigo-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                            title="Replay Audio"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-px h-3 bg-indigo-100 mx-0.5"></div>
                          <button 
                            onClick={toggleMute}
                            className="p-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                            title={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="waiting" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="bg-slate-50 text-slate-500 px-4 py-3 rounded-2xl rounded-tl-none text-sm border border-slate-100"
              >
                {sessionProfile ? (
                  <>Hi {sessionProfile.studentName}! Ready to work on {sessionProfile.studyGoal}?</>
                ) : (
                  <>I&apos;m ready when you are!</>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Compact Structured Feedback */}
        {feedback && !isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Quick Summary</div>
            
            <div className={`p-3 rounded-xl border text-sm flex items-start gap-3 ${getCorrectnessColor(feedback.correctnessAssessment)}`}>
              {getCorrectnessIcon(feedback.correctnessAssessment)}
              <div>
                <span className="font-semibold block mb-0.5 capitalize">{feedback.correctnessAssessment} Step</span>
                <span className="opacity-90">{feedback.whatISaw}</span>
              </div>
            </div>
            
            {feedback.nextHint && (
              <div className="p-3 rounded-xl border bg-slate-50 border-slate-100 text-slate-700 text-sm flex items-start gap-3">
                <Lightbulb className="w-5 h-5 shrink-0 text-amber-500" />
                <div>
                  <span className="font-semibold block mb-0.5">Next Hint</span>
                  <span className="opacity-90">{feedback.nextHint}</span>
                </div>
              </div>
            )}

            {renderCitations()}
          </motion.div>
        )}

      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
         <button className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-colors text-slate-600 hover:text-indigo-600">
           <Lightbulb className="w-5 h-5" />
           <span className="text-xs font-medium">Hint Me</span>
         </button>
         <button className="flex flex-col items-center justify-center gap-1 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-colors text-slate-600 hover:text-indigo-600">
           <MessageCircle className="w-5 h-5" />
           <span className="text-xs font-medium">Explain</span>
         </button>
         <button className="col-span-2 flex items-center justify-center gap-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors shadow-sm">
           <Zap className="w-4 h-4" />
           <span className="text-sm font-medium">Check My Step</span>
         </button>
      </div>
    </div>
  );
}
