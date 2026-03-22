/**
 * @file studySession.ts
 * @description Optional Supabase persistence for tutor turns (no-op when not configured).
 */

import type { SessionProfile, TutorFeedback } from '@/lib/ai/types';
import { logger } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function persistTutorTurn(params: {
  sessionKey: string;
  userMessage: string;
  feedback: TutorFeedback;
  sessionProfile?: SessionProfile;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const { data: sessionRow, error: upsertErr } = await supabase
      .from('sese_study_sessions')
      .upsert(
        {
          client_session_id: params.sessionKey,
          profile: params.sessionProfile ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_session_id' },
      )
      .select('id')
      .single();

    if (upsertErr || !sessionRow?.id) {
      logger.error('persistTutorTurn: upsert session failed', { message: upsertErr?.message });
      return;
    }

    const sessionId = sessionRow.id as string;

    await supabase.from('sese_session_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: params.userMessage,
    });

    await supabase.from('sese_session_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: params.feedback.tutorSpeech,
      tutor_feedback: params.feedback as unknown as Record<string, unknown>,
    });

    await supabase.from('sese_board_states').insert({
      session_id: sessionId,
      board: params.feedback.boardContent as unknown as Record<string, unknown>,
    });
  } catch (e) {
    logger.error('persistTutorTurn failed', { error: e instanceof Error ? e.message : String(e) });
  }
}
