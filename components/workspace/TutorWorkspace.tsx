'use client';

/**
 * @file TutorWorkspace.tsx
 * @description The right side of the app where Sese the Panda provides feedback.
 * 
 * Use Cases:
 * - Displays the mascot's current state (happy, thinking, etc.).
 * - Renders the structured feedback from the AI.
 * - Quick actions for the student.
 */

import React from 'react';
import { TutorFeedback } from '@/lib/ai/types';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Lightbulb, CheckSquare, Zap, AlertCircle } from 'lucide-react';

interface TutorWorkspaceProps {
  feedback: TutorFeedback | null;
  isAnalyzing: boolean;
}

export function TutorWorkspace({ feedback, isAnalyzing }: TutorWorkspaceProps) {
  const renderMascot = () => {
    let emoji = '🐼';
    let bgClass = 'bg-slate-100';
    let animationClass = '';

    if (isAnalyzing) {
      emoji = '🤔';
      bgClass = 'bg-indigo-50';
      animationClass = 'animate-pulse';
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
      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-inner ${bgClass} ${animationClass} transition-colors duration-500 shrink-0`}>
        {emoji}
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
                <div className="bg-indigo-50 text-indigo-900 px-5 py-4 rounded-2xl rounded-tl-none text-sm shadow-sm border border-indigo-100 leading-relaxed">
                  <p className="font-medium mb-2">{feedback.tutorSpeech}</p>
                  {feedback.followUpQuestion && (
                    <p className="text-indigo-800/80 italic mt-2">{feedback.followUpQuestion}</p>
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
                I&apos;m ready when you are!
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
