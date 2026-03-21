'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Upload, X, Play, FileText, File, Mic, MicOff, Edit2, Check } from 'lucide-react';
import { SessionProfile, CourseMaterial } from '@/lib/ai/types';
import { useVoiceOnboarding } from '@/lib/onboarding/useVoiceOnboarding';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceOnboardingModalProps {
  onStartSession: (profile: SessionProfile) => void;
}

export function VoiceOnboardingModal({ onStartSession }: VoiceOnboardingModalProps) {
  const { state, data, setData, transcript, startOnboarding, skipToReady } = useVoiceOnboarding();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state === 'idle') {
      startOnboarding();
    }
  }, [state, startOnboarding]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
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
          mimeType: file.type
        };

        setMaterials(prev => [...prev, newMaterial]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleStart = () => {
    if (!data.studentName || !data.courseSubject || !data.studyGoal) return;
    
    onStartSession({
      studentName: data.studentName,
      courseSubject: data.courseSubject,
      studyGoal: data.studyGoal,
      chapterLabel: data.chapterLabel,
      materials
    });
  };

  const isFormValid = data.studentName.trim() !== '' && data.courseSubject.trim() !== '' && data.studyGoal.trim() !== '';
  const isListening = state.startsWith('listening');
  const isSpeaking = state.startsWith('asking') || state === 'greeting' || state === 'confirmingSession';

  const renderMascot = () => {
    let emoji = '🐼';
    let bgClass = 'bg-slate-100';
    let animationClass = '';

    if (isListening) {
      emoji = '🐼👂';
      bgClass = 'bg-indigo-50';
      animationClass = 'animate-pulse';
    } else if (isSpeaking) {
      emoji = '🐼💬';
      bgClass = 'bg-emerald-50';
      animationClass = 'animate-bounce';
    }

    return (
      <div className={`w-32 h-32 rounded-full flex items-center justify-center text-7xl shadow-inner ${bgClass} ${animationClass} transition-colors duration-500 shrink-0 mx-auto`}>
        {emoji}
      </div>
    );
  };

  const getQuestionText = () => {
    switch (state) {
      case 'greeting': return "Hello. I am Sese, your personal study companion.";
      case 'askingName':
      case 'listeningForName': return "What is your name?";
      case 'askingSubject':
      case 'listeningForSubject': return "What course or subject are we studying today?";
      case 'askingStudyGoal':
      case 'listeningForStudyGoal': return "What specifically are you practicing or focusing on?";
      case 'askingOptionalContext':
      case 'listeningForOptionalContext': return "Is there a specific chapter, assignment, or exam this is for?";
      case 'confirmingSession':
      case 'ready': return "Great. I have everything I need. You can review your answers below.";
      default: return "Setting up your session...";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center space-y-8">
          
          {/* Mascot and Voice Interaction */}
          <div className="text-center space-y-6 w-full max-w-xl">
            {renderMascot()}
            
            <div className="min-h-[80px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={getQuestionText()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-2xl font-light text-slate-200 text-center leading-relaxed"
                >
                  {getQuestionText()}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Transcript / Listening Indicator */}
            <div className="h-12 flex items-center justify-center">
              {isListening ? (
                <div className="flex items-center gap-3 text-indigo-400 bg-indigo-500/10 px-6 py-3 rounded-full border border-indigo-500/20">
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span className="text-lg font-medium italic">
                    {transcript || "Listening..."}
                  </span>
                </div>
              ) : (
                <div className="h-12"></div>
              )}
            </div>
          </div>

          {/* Editable Transcript Fallback */}
          <AnimatePresence>
            {(state === 'ready' || isEditing) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="w-full max-w-2xl bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Session Details</h3>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {isEditing ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                    {isEditing ? 'Done Editing' : 'Edit Answers'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Your Name *</label>
                    <input 
                      type="text" 
                      value={data.studentName}
                      onChange={e => setData(prev => ({ ...prev, studentName: e.target.value }))}
                      disabled={!isEditing && state !== 'ready'}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Course / Subject *</label>
                    <input 
                      type="text" 
                      value={data.courseSubject}
                      onChange={e => setData(prev => ({ ...prev, courseSubject: e.target.value }))}
                      disabled={!isEditing && state !== 'ready'}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-slate-400">Study Goal *</label>
                    <input 
                      type="text" 
                      value={data.studyGoal}
                      onChange={e => setData(prev => ({ ...prev, studyGoal: e.target.value }))}
                      disabled={!isEditing && state !== 'ready'}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-slate-400">Chapter / Context (Optional)</label>
                    <input 
                      type="text" 
                      value={data.chapterLabel}
                      onChange={e => setData(prev => ({ ...prev, chapterLabel: e.target.value }))}
                      disabled={!isEditing && state !== 'ready'}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-70"
                    />
                  </div>
                </div>

                {/* Course Materials */}
                <div className="pt-4 border-t border-slate-700/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Course Materials</h3>
                    <span className="text-xs text-slate-500">Optional</span>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-5 h-5 mb-2" />
                    <span className="text-sm font-medium">Click to upload materials</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                      {materials.map(material => (
                        <div key={material.id} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg p-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {material.type === 'pdf' ? <FileText className="w-4 h-4 text-rose-400 shrink-0" /> : <File className="w-4 h-4 text-blue-400 shrink-0" />}
                            <span className="text-xs text-slate-300 truncate">{material.name}</span>
                          </div>
                          <button 
                            onClick={() => removeMaterial(material.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
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

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          {state !== 'ready' ? (
            <button 
              onClick={skipToReady}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Skip Voice Setup
            </button>
          ) : (
            <div></div>
          )}
          
          <button 
            onClick={handleStart}
            disabled={!isFormValid || state !== 'ready'}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
          >
            Continue to Session
            <Play className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
