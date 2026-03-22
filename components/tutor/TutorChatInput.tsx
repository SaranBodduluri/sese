'use client';

/**
 * @file TutorChatInput.tsx
 * @description Bottom-of-panel freeform tutor input: text + browser speech recognition.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Mic, Send, Loader2, Square } from 'lucide-react';
import { logger } from '@/lib/logger';

interface TutorChatInputProps {
  disabled?: boolean;
  isSending: boolean;
  onSend: (text: string) => void;
}

export function TutorChatInput({ disabled, isSending, onSend }: TutorChatInputProps) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  /** Web Speech API recognition instance (browser-specific). */
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    const W = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start: () => void;
        stop: () => void;
        onresult: ((ev: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start: () => void;
        stop: () => void;
        onresult: ((ev: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
    };
    const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Ctor) {
      logger.warn('Speech recognition not available in this browser');
      return;
    }
    stopListening();
    const r = new Ctor();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (ev) => {
      const t = ev.results[0]?.[0]?.transcript;
      if (t) {
        setText((prev) => (prev ? `${prev} ${t.trim()}` : t.trim()));
      }
    };
    r.onerror = () => {
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
    };
    recognitionRef.current = r;
    try {
      r.start();
      setListening(true);
    } catch (e) {
      logger.warn('Could not start speech recognition', { error: String(e) });
      setListening(false);
    }
  }, [stopListening]);

  const submit = () => {
    const t = text.trim();
    if (!t || disabled || isSending) return;
    onSend(t);
    setText('');
  };

  const busy = disabled || isSending;

  return (
    <div className="px-4 pb-4 pt-0 flex flex-col gap-2 border-t border-[#E5E7EB] bg-[#FAFAFA]">
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="tutor-chat-input">
          Ask Sese anything
        </label>
        <textarea
          id="tutor-chat-input"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask anything… e.g. “Why set the derivative to zero?”"
          disabled={busy}
          className="flex-1 min-h-[44px] max-h-28 resize-y rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/35 disabled:opacity-50"
        />
        <div className="flex flex-col gap-1.5 shrink-0">
          {listening ? (
            <button
              type="button"
              onClick={stopListening}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
              title="Stop listening"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startListening}
              disabled={busy}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#FF6A00]/35 hover:bg-[#FFFBF5] transition-colors disabled:opacity-40"
              title="Speak (browser)"
            >
              <Mic className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={busy || !text.trim()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A0A0A] text-white hover:bg-[#262626] transition-colors disabled:opacity-40"
            title="Send"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.5} />}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-[#9CA3AF] leading-snug px-0.5">
        Voice uses your browser when available; otherwise type freely.
      </p>
    </div>
  );
}
