'use client';

/**
 * @file SourceAttributionChips.tsx
 * @description Compact premium chips for demo grounding (textbook / notes / concept).
 */

import React from 'react';
import type { SourceAttribution, GroundingMode } from '@/lib/ai/types';
import { BookOpen, FileText, Presentation, Lightbulb } from 'lucide-react';

function iconFor(type: SourceAttribution['sourceType']) {
  switch (type) {
    case 'textbook':
      return <BookOpen className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />;
    case 'notes':
      return <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />;
    case 'slides':
      return <Presentation className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />;
    default:
      return <Lightbulb className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />;
  }
}

function labelForMode(mode: GroundingMode): string {
  switch (mode) {
    case 'course_materials':
      return 'Grounding';
    case 'topic_reference':
      return 'Typical references';
    case 'vector_retrieval':
      return 'Textbook match';
    case 'general_reasoning':
      return 'Reasoning';
    case 'general':
      return 'Reasoning';
    default:
      return '';
  }
}

interface SourceAttributionChipsProps {
  mode: GroundingMode;
  items: SourceAttribution[];
  /** When true, use compact single-line style (e.g. board strip). */
  compact?: boolean;
}

export function SourceAttributionChips({ mode, items, compact }: SourceAttributionChipsProps) {
  if (mode === 'general' && items.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#6B7280] leading-snug">
        General reasoning — no course materials attached for this session.
      </div>
    );
  }

  if (mode === 'general_reasoning' && items.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#6B7280] leading-snug">
        General reasoning — no strong textbook match for this question (upload or rephrase to search again).
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#9CA3AF]">{labelForMode(mode)}</p>
      <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'gap-2'}`}>
        {items.map((item, idx) => (
          <div
            key={`${item.conceptName}-${idx}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[11px] text-[#0A0A0A] shadow-sm transition-colors hover:border-[#FF6A00]/35"
            title={
              item.excerpt
                ? `${item.sourceTitle} — ${item.section}\n${item.excerpt}`
                : `${item.sourceTitle} — ${item.section}`
            }
          >
            {iconFor(item.sourceType)}
            <span className="font-medium text-[#0A0A0A]">{item.sourceTitle}</span>
            <span className="text-[#6B7280]">·</span>
            <span className="text-[#6B7280]">{item.section}</span>
            <span className="hidden sm:inline text-[#9CA3AF]">· {item.conceptName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
