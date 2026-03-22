'use client';

/**
 * @file TeachingBoard.tsx
 * @description Primary teaching surface — premium minimal layout, strong hierarchy.
 */

import React from 'react';
import { TutorFeedback, SessionProfile } from '@/lib/ai/types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, BookOpen, Lightbulb } from 'lucide-react';
import { SourceAttributionChips } from '@/components/grounding/SourceAttributionChips';

interface TeachingBoardProps {
  feedback: TutorFeedback | null;
  isAnalyzing: boolean;
  sessionProfile: SessionProfile | null;
}

export function TeachingBoard({ feedback, isAnalyzing, sessionProfile }: TeachingBoardProps) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="shrink-0 px-6 py-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Teaching board</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-sm font-medium text-[#0A0A0A]">Session focus</p>
            {feedback?.grounded && feedback.groundingMode === 'vector_retrieval' && (
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#D1FAE5]">
                Grounded
              </span>
            )}
          </div>
        </div>
        <div className="h-8 w-8 rounded-full bg-[#FF6A00]/10 flex items-center justify-center text-sm" aria-hidden>
          ◎
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 overflow-y-auto text-[#0A0A0A]">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[200px] flex flex-col items-center justify-center text-[#6B7280] space-y-5"
            >
              <div
                className="w-10 h-10 rounded-full border-2 border-[#E5E7EB] border-t-[#FF6A00] animate-spin"
                aria-hidden
              />
              <p className="text-sm font-medium tracking-tight">Updating the board…</p>
            </motion.div>
          ) : feedback ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-10 max-w-3xl mx-auto"
            >
              <div className="pb-2 border-b border-[#F3F4F6]">
                <SourceAttributionChips
                  mode={feedback.groundingMode}
                  items={feedback.sourceAttributions}
                  compact
                />
              </div>

              {feedback.boardContent.title && (
                <div className="text-center">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#0A0A0A] tracking-tight leading-tight">
                    {feedback.boardContent.title}
                  </h2>
                </div>
              )}

              {feedback.boardContent.equations && feedback.boardContent.equations.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                    Equations
                  </h3>
                  <div className="space-y-4 pl-4 border-l-2 border-[#FF6A00]/40">
                    {feedback.boardContent.equations.map((eq, idx) => (
                      <div
                        key={idx}
                        className="text-lg md:text-xl font-medium text-[#0A0A0A] leading-relaxed tracking-wide"
                      >
                        {eq}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {feedback.boardContent.orderedSteps && feedback.boardContent.orderedSteps.length > 0 && (
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9CA3AF]">
                    Steps
                  </h3>
                  <ol className="list-decimal list-outside ml-5 space-y-3 text-[15px] md:text-base text-[#374151] leading-relaxed">
                    {feedback.boardContent.orderedSteps.map((step, idx) => (
                      <li key={idx} className="pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {feedback.boardContent.correctionHighlights &&
                feedback.boardContent.correctionHighlights.length > 0 && (
                  <section className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9CA3AF] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={1.5} />
                      Adjustments
                    </h3>
                    <ul className="space-y-2 pl-1">
                      {feedback.boardContent.correctionHighlights.map((corr, idx) => (
                        <li key={idx} className="text-[15px] text-[#374151] leading-relaxed flex gap-2">
                          <span className="text-[#FF6A00] shrink-0">→</span>
                          <span>{corr}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

              {feedback.boardContent.conceptNotes && (
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9CA3AF] flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Concept
                  </h3>
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#374151] leading-relaxed">
                    {feedback.boardContent.conceptNotes}
                  </div>
                </section>
              )}

              {feedback.boardContent.finalConclusion && (
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9CA3AF] flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Wrap-up
                  </h3>
                  <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-4 text-[15px] text-[#4B5563] leading-relaxed italic">
                    {feedback.boardContent.finalConclusion}
                  </div>
                </section>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto space-y-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Ready</p>
              {sessionProfile ? (
                <>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#0A0A0A]">
                    Hi, {sessionProfile.studentName}
                  </h2>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    <span className="text-[#0A0A0A] font-medium">{sessionProfile.courseSubject}</span>
                    <span className="block mt-2 text-[#9CA3AF]">
                      Capture a frame from OneNote when you want feedback — the board updates here.
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg text-[#374151]">Board is ready.</p>
                  <p className="text-sm text-[#9CA3AF]">Finish onboarding to begin.</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
