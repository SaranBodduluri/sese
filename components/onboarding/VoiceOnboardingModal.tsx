'use client';

/**
 * @file VoiceOnboardingModal.tsx
 * @description Onboarding modal — light, minimal, aligned with Sese design system.
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Play, FileText, File, Mic } from 'lucide-react';
import { SessionProfile, CourseMaterial } from '@/lib/ai/types';
import { useVoiceOnboarding } from '@/lib/onboarding/useVoiceOnboarding';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceOnboardingModalProps {
  onStartSession: (profile: SessionProfile) => void;
}

export function VoiceOnboardingModal({ onStartSession }: VoiceOnboardingModalProps) {
  const { state, data, setData, transcript, startOnboarding, skipToReady } = useVoiceOnboarding();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];

        let type: CourseMaterial['type'] = 'notes';
        if (file.type === 'application/pdf') type = 'pdf';
        else if (file.name.toLowerCase().includes('slide')) type = 'slides';
        else if (file.name.toLowerCase().includes('formula')) type = 'formula_sheet';

        const newMaterial: CourseMaterial = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type,
          contentBase64: base64Data,
          mimeType: file.type,
        };

        setMaterials((prev) => [...prev, newMaterial]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleStart = () => {
    const name = data.studentName.trim();
    const topic = data.studyTopic.trim();
    if (!name || !topic) return;

    onStartSession({
      studentName: name,
      courseSubject: topic,
      studyGoal: topic,
      materials,
    });
  };

  const isFormValid = data.studentName.trim() !== '' && data.studyTopic.trim() !== '';
  const isListening = state === 'listeningForName' || state === 'listeningForStudyTopic';
  const isSpeaking =
    state === 'greeting' ||
    state === 'askingName' ||
    state === 'askingStudyTopic' ||
    state === 'confirmingSession';

  const showAnswersPanel = state !== 'idle';

  const renderMascot = () => {
    let emoji = '🐼';
    let bgClass = 'bg-[#F9FAFB]';
    let animationClass = '';

    if (isListening) {
      emoji = '🐼👂';
      bgClass = 'bg-[#FFFBF5]';
      animationClass = 'animate-pulse';
    } else if (isSpeaking) {
      emoji = '🐼💬';
      bgClass = 'bg-[#FFF7ED]';
      animationClass = 'animate-bounce';
    }

    return (
      <div
        className={`w-28 h-28 rounded-full flex items-center justify-center text-6xl border border-[#E5E7EB] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] ${bgClass} ${animationClass} transition-colors duration-500 shrink-0 mx-auto`}
      >
        {emoji}
      </div>
    );
  };

  const getQuestionText = () => {
    switch (state) {
      case 'idle':
        return 'Tap Begin to start.';
      case 'greeting':
        return 'One moment…';
      case 'askingName':
      case 'listeningForName':
        return "What's your name?";
      case 'askingStudyTopic':
      case 'listeningForStudyTopic':
        return 'What are you studying today?';
      case 'confirmingSession':
      case 'ready':
        return 'Review and continue when you are ready.';
      default:
        return 'Setting up…';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-6 w-full max-w-md">
            {renderMascot()}

            <div className="min-h-[72px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={getQuestionText()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-xl font-medium text-[#0A0A0A] text-center leading-snug"
                >
                  {getQuestionText()}
                </motion.h2>
              </AnimatePresence>
            </div>

            <div className="h-12 flex items-center justify-center">
              {state === 'idle' ? (
                <button
                  type="button"
                  onClick={startOnboarding}
                  className="px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#262626] text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Begin
                </button>
              ) : isListening ? (
                <div className="flex items-center gap-3 text-[#FF6A00] bg-[#FFF7ED] px-5 py-2.5 rounded-full border border-[#FFEDD5]">
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium italic text-[#0A0A0A]">
                    {transcript || 'Listening…'}
                  </span>
                </div>
              ) : (
                <div className="h-12" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {showAnswersPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="w-full max-w-md bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB] space-y-5"
              >
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Your answers</h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6B7280]">Name</label>
                    <input
                      type="text"
                      value={data.studentName}
                      onChange={(e) => setData((prev) => ({ ...prev, studentName: e.target.value }))}
                      placeholder="Alex"
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/35 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6B7280]">Studying today</label>
                    <input
                      type="text"
                      value={data.studyTopic}
                      onChange={(e) => setData((prev) => ({ ...prev, studyTopic: e.target.value }))}
                      placeholder="e.g. Calculus — derivatives"
                      className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/35 focus:border-transparent"
                    />
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                    Voice or type — edit anytime.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Materials</h3>
                    <span className="text-[10px] text-[#9CA3AF]">Optional</span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                    }}
                    className="border border-dashed border-[#E5E7EB] rounded-xl p-4 flex flex-col items-center justify-center text-[#9CA3AF] hover:border-[#FF6A00]/35 hover:bg-[#FFFBF5] transition-colors cursor-pointer"
                  >
                    <Upload className="w-5 h-5 mb-2" strokeWidth={1.25} />
                    <span className="text-xs font-medium text-[#6B7280]">Upload files</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept=".pdf,image/*,.txt"
                      onChange={handleFileChange}
                    />
                  </div>

                  {materials.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {materials.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-lg px-2 py-1.5"
                        >
                          <div className="flex items-center gap-2 overflow-hidden min-w-0">
                            {material.type === 'pdf' ? (
                              <FileText className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                            ) : (
                              <File className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                            )}
                            <span className="text-xs text-[#374151] truncate">{material.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMaterial(material.id)}
                            className="p-1 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-5 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-4">
          {state !== 'ready' ? (
            <button
              type="button"
              onClick={skipToReady}
              className="text-xs text-[#6B7280] hover:text-[#0A0A0A] transition-colors"
            >
              Skip voice
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={!isFormValid}
            className="ml-auto px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#262626] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
          >
            Continue
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
