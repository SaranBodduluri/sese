'use client';

/**
 * @file TeachingBoard.tsx
 * @description The main large panel on the left styled like a digital blackboard.
 * 
 * Use Cases:
 * - Renders generated instructional content (equations, corrections, concept notes).
 * - Acts as the visual center of the product.
 */

import React from 'react';
import { TutorFeedback } from '@/lib/ai/types';
import { motion, AnimatePresence } from 'motion/react';
import { Presentation, AlertTriangle, BookOpen } from 'lucide-react';

interface TeachingBoardProps {
  feedback: TutorFeedback | null;
  isAnalyzing: boolean;
}

export function TeachingBoard({ feedback, isAnalyzing }: TeachingBoardProps) {
  return (
    <div className="flex flex-col h-full bg-[#1e293b] rounded-2xl shadow-xl border-8 border-slate-800 overflow-hidden relative">
      {/* Board Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center opacity-50 pointer-events-none">
        <div className="flex items-center gap-2 text-slate-400">
          <Presentation className="w-5 h-5" />
          <span className="font-mono text-sm tracking-widest uppercase">Sese Teaching Board</span>
        </div>
      </div>

      <div className="flex-1 p-8 pt-16 overflow-y-auto font-mono text-slate-200">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4"
            >
              <div className="w-16 h-16 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-lg animate-pulse">Sese is writing on the board...</p>
            </motion.div>
          ) : feedback ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, filter: 'blur(10px)' }} 
              animate={{ opacity: 1, filter: 'blur(0px)' }} 
              className="space-y-12 max-w-3xl mx-auto"
            >
              {/* Title Section */}
              {feedback.boardContent.title && (
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-wider uppercase border-b-2 border-slate-700 pb-4 inline-block">
                    {feedback.boardContent.title}
                  </h2>
                </div>
              )}

              {/* Equations Section */}
              {feedback.boardContent.equations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-indigo-400/80 text-sm uppercase tracking-widest border-b border-indigo-500/30 pb-2">Steps & Equations</h3>
                  <div className="space-y-3 pl-4 border-l-2 border-indigo-500/50">
                    {feedback.boardContent.equations.map((eq, idx) => (
                      <div key={idx} className="text-2xl md:text-3xl text-slate-100 tracking-wide">
                        {eq}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps Section */}
              {feedback.boardContent.steps && feedback.boardContent.steps.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-emerald-400/80 text-sm uppercase tracking-widest border-b border-emerald-500/30 pb-2">Logical Steps</h3>
                  <ol className="list-decimal list-inside space-y-2 text-emerald-100/90 text-lg">
                    {feedback.boardContent.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Annotations Section */}
              {feedback.boardContent.annotations && feedback.boardContent.annotations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-cyan-400/80 text-sm uppercase tracking-widest border-b border-cyan-500/30 pb-2">Annotations</h3>
                  <ul className="list-disc list-inside space-y-2 text-cyan-100/90 text-lg">
                    {feedback.boardContent.annotations.map((ann, idx) => (
                      <li key={idx}>{ann}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Corrections Section */}
              {feedback.boardContent.corrections && feedback.boardContent.corrections.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-rose-400/80 text-sm uppercase tracking-widest border-b border-rose-500/30 pb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Corrections
                  </h3>
                  <div className="space-y-3 pl-4 border-l-2 border-rose-500/50">
                    {feedback.boardContent.corrections.map((corr, idx) => (
                      <div key={idx} className="text-lg text-rose-200">
                        <span className="text-rose-400 mr-2">→</span>{corr}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concept Notes */}
              {feedback.boardContent.conceptNotes && (
                <div className="space-y-4">
                  <h3 className="text-amber-400/80 text-sm uppercase tracking-widest border-b border-amber-500/30 pb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Concept Note
                  </h3>
                  <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 text-amber-100/90 text-lg leading-relaxed">
                    {feedback.boardContent.conceptNotes}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-slate-600"
            >
              <p className="text-xl">The board is clean.</p>
              <p className="text-sm mt-2">Waiting for student input to begin...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
