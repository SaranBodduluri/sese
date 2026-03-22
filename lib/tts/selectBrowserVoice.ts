/**
 * @file selectBrowserVoice.ts
 * @description Picks English voices for `speechSynthesis` fallback when ElevenLabs is unavailable.
 */

/**
 * Prefer female English voices; avoid common male names and "Male" labels.
 * Different browsers expose different `name` strings (Google, Microsoft, Apple, etc.).
 */
export function selectEnglishFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;

  const englishFirst = voices.filter((v) => /^en/i.test(v.lang || ''));
  const list = englishFirst.length > 0 ? englishFirst : voices;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const n = `${v.name} ${v.voiceURI}`.toLowerCase();
    let s = 0;
    // Strong female signals
    if (/\bfemale\b|woman|girl|zira|samantha|victoria|karen|moira|fiona|serena|tessa|sonya|amy\b|ivy\b|joanna|hazel|emily|susan|mary|linda|heather|aria|joelle|shelley|catherine|siri|kate|veena/.test(n)) {
      s += 120;
    }
    if (n.includes('google') && n.includes('female')) s += 90;
    if (n.includes('microsoft') && n.includes('zira')) s += 90;
    if (n.includes('microsoft') && n.includes('female')) s += 85;
    if (n.includes('apple') && (n.includes('samantha') || n.includes('karen') || n.includes('moira'))) s += 85;
    // Strong male signals (penalize)
    if (/\bmale\b|daniel|david\b|fred\b|mark\b|tom\b|james|george|richard|oliver|arthur|aaron|benjamin|kenny|bruce|brian|aaron|fred|john|jake|alex\b.*male|microsoft.*mark|microsoft.*david|google uk english male|google us english male/.test(n)) {
      s -= 150;
    }
    if (v.lang?.toLowerCase().startsWith('en-us')) s += 4;
    return s;
  };

  let best: SpeechSynthesisVoice | undefined;
  let bestScore = -Infinity;
  for (const v of list) {
    const sc = scoreVoice(v);
    if (sc > bestScore) {
      bestScore = sc;
      best = v;
    }
  }

  if (best && bestScore >= 40) return best;

  // Last resort: any voice that is explicitly labeled female and not penalized
  for (const v of list) {
    const n = v.name.toLowerCase();
    if (/\bfemale\b|zira|samantha|victoria|karen|moira|fiona|serena|tessa|sonya|amy\b|ivy\b|joanna/.test(n) && !/\bmale\b|david|daniel|fred|mark|james|george|tom\b|oliver/.test(n)) {
      return v;
    }
  }

  return best ?? list[0];
}

/**
 * Soft, calm companion voice (Baymax-adjacent): prefer neural/natural male-ish voices, avoid harsh defaults.
 */
export function selectSoftCompanionVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;

  const englishFirst = voices.filter((v) => /^en/i.test(v.lang || ''));
  const list = englishFirst.length > 0 ? englishFirst : voices;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    const n = `${v.name} ${v.voiceURI}`.toLowerCase();
    let s = 0;
    if (/\bnatural\b|neural|premium/.test(n)) s += 85;
    if (/\bguy\b|james|ryan|oliver|thomas|william|aaron|arthur|hugh/.test(n)) s += 42;
    if (n.includes('microsoft') && /guy|james|ryan|oliver|thomas/.test(n)) s += 38;
    if (n.includes('google uk english male')) s += 18;
    if (n.includes('google us english male')) s -= 25;
    if (/\bfred\b|microsoft david|compact|sapi|robot/.test(n)) s -= 130;
    if (/\bfemale\b|zira|samantha|victoria|karen|moira|fiona|amy\b|ivy\b|joanna|hazel/.test(n)) s -= 40;
    if (v.lang?.toLowerCase().startsWith('en-us')) s += 5;
    return s;
  };

  let best: SpeechSynthesisVoice | undefined;
  let bestScore = -Infinity;
  for (const v of list) {
    const sc = scoreVoice(v);
    if (sc > bestScore) {
      bestScore = sc;
      best = v;
    }
  }

  if (best && bestScore >= 25) return best;

  for (const v of list) {
    const n = v.name.toLowerCase();
    if (/\bnatural\b|neural/.test(n) && !/\bfred\b|david|compact/.test(n)) {
      return v;
    }
  }

  return best ?? list[0];
}
