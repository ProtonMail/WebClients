import type { Maybe } from '../../types';
import { UNIX_WEEK } from '../../utils/time/constants';

export type OfflinePromptSettings = { count: number; dismissedAt: number };

export const OFFLINE_PROMPT_MAX_DISMISSALS = 2;
export const OFFLINE_PROMPT_INTERVAL = UNIX_WEEK * 2;

/** Offline mode cannot be enabled silently: it requires the user's password,
 * an online SRP check and an argon2 derivation. Users without offline components
 * are prompted, but only a limited number of times, spaced out in time. */
export const shouldPromptOfflineSetup = (prompt: Maybe<OfflinePromptSettings>, now: number): boolean => {
    if (!prompt) return true;
    if (prompt.count >= OFFLINE_PROMPT_MAX_DISMISSALS) return false;
    return now - prompt.dismissedAt > OFFLINE_PROMPT_INTERVAL;
};

export const nextOfflinePrompt = (prompt: Maybe<OfflinePromptSettings>, now: number): OfflinePromptSettings => ({
    count: (prompt?.count ?? 0) + 1,
    dismissedAt: now,
});
