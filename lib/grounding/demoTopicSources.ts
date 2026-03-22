/**
 * @file demoTopicSources.ts
 * @description Deterministic topic → reference mapping for demo credibility (not live retrieval).
 * Uses broad chapter-style labels only — no fake page numbers.
 */

import type { SourceAttribution } from '@/lib/ai/types';

export interface DemoSourceRule {
  keywords: string[];
  attribution: SourceAttribution;
}

/**
 * Ordered rules: first keyword hits win; keep list small to avoid clutter.
 */
export const DEMO_TOPIC_SOURCES: DemoSourceRule[] = [
  {
    keywords: ['closed interval', 'extreme value', 'evt'],
    attribution: {
      conceptName: 'Extreme Value Theorem',
      sourceTitle: 'Stewart Calculus',
      section: 'Ch. 4',
      sourceType: 'textbook',
    },
  },
  {
    keywords: ['optimization', 'optimize', 'max min', 'maximum', 'minimum'],
    attribution: {
      conceptName: 'Applied Optimization',
      sourceTitle: 'Stewart Calculus',
      section: 'Ch. 4',
      sourceType: 'textbook',
    },
  },
  {
    keywords: ['derivative', 'derivatives', 'differentiation', 'differentiate'],
    attribution: {
      conceptName: 'Derivatives',
      sourceTitle: 'Stewart Calculus',
      section: 'Ch. 2–3',
      sourceType: 'textbook',
    },
  },
  {
    keywords: ['integral', 'integration', 'antiderivative', 'integrate'],
    attribution: {
      conceptName: 'Integration',
      sourceTitle: 'Stewart Calculus',
      section: 'Ch. 5',
      sourceType: 'textbook',
    },
  },
  {
    keywords: ['limit', 'limits', 'continuity', 'continuous'],
    attribution: {
      conceptName: 'Limits & Continuity',
      sourceTitle: 'Stewart Calculus',
      section: 'Ch. 1–2',
      sourceType: 'textbook',
    },
  },
  {
    keywords: ['chain rule', 'chain'],
    attribution: {
      conceptName: 'Chain Rule',
      sourceTitle: 'Stewart Calculus',
      section: 'Ch. 3',
      sourceType: 'textbook',
    },
  },
  {
    keywords: ['related rates'],
    attribution: {
      conceptName: 'Related Rates',
      sourceTitle: 'Stewart Calculus',
      section: 'Ch. 3',
      sourceType: 'textbook',
    },
  },
  {
    keywords: ['linear algebra', 'matrix', 'matrices', 'eigen'],
    attribution: {
      conceptName: 'Linear systems',
      sourceTitle: 'Strang — Introduction to Linear Algebra',
      section: 'Early chapters',
      sourceType: 'textbook',
    },
  },
  {
    keywords: ['probability', 'bayes', 'distribution'],
    attribution: {
      conceptName: 'Probability',
      sourceTitle: 'Typical intro stats text',
      section: 'Core topics',
      sourceType: 'textbook',
    },
  },
];
