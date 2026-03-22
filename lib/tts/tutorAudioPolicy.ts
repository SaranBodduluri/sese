/**
 * @file tutorAudioPolicy.ts
 * @description Rules for when Sese auto-speaks vs stays silent after tutor feedback (ElevenLabs / fallback).
 *
 * Auto-speak: new analysis returns fresh tutorSpeech, user has not muted, TTS is on, and global auto-play is on.
 * Stay silent: user muted, TTS disabled, auto-play disabled, or while analyzing (no new speech yet).
 */

export type TutorAutoSpeakContext = {
  /** User turned voice off in the tutor panel. */
  isUserMuted: boolean;
  /** Master switch (e.g. NEXT_PUBLIC_TTS_ENABLED). */
  ttsEnabledGlobally: boolean;
  /** Default preference for speaking on each new response (NEXT_PUBLIC_AUTO_PLAY_TUTOR_AUDIO). */
  autoPlayOnNewFeedbackEnabled: boolean;
};

/**
 * Whether to start playback automatically when new tutor audio is ready.
 * Does not affect replay; user can always replay when unmuted (if audio or fallback exists).
 */
export function shouldAutoPlayAfterNewTutorSpeech(ctx: TutorAutoSpeakContext): boolean {
  return ctx.ttsEnabledGlobally && ctx.autoPlayOnNewFeedbackEnabled && !ctx.isUserMuted;
}

/**
 * Whether to call the server TTS route for this feedback (ElevenLabs on the server).
 */
export function shouldRequestServerTts(ttsEnabledGlobally: boolean): boolean {
  return ttsEnabledGlobally;
}

/**
 * Whether browser speechSynthesis may be used when server TTS fails or returns non-audio.
 */
export function shouldAllowBrowserTtsFallback(ttsEnabledGlobally: boolean, browserFallbackEnabled: boolean): boolean {
  return ttsEnabledGlobally && browserFallbackEnabled;
}
