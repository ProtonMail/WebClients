import { UNIX_DAY, UNIX_WEEK } from '../../utils/time/constants';
import { OFFLINE_PROMPT_MAX_DISMISSALS, nextOfflinePrompt, shouldPromptOfflineSetup } from './offline-prompt';

const NOW = 1_700_000_000;

describe('offline prompt', () => {
    describe('shouldPromptOfflineSetup', () => {
        test('should prompt when never dismissed', () => {
            expect(shouldPromptOfflineSetup(undefined, NOW)).toBe(true);
        });

        test('should not prompt before the interval has elapsed', () => {
            const prompt = { count: 1, dismissedAt: NOW - UNIX_WEEK };
            expect(shouldPromptOfflineSetup(prompt, NOW)).toBe(false);
        });

        test('should prompt again after the interval has elapsed', () => {
            const prompt = { count: 1, dismissedAt: NOW - (UNIX_WEEK * 2 + UNIX_DAY) };
            expect(shouldPromptOfflineSetup(prompt, NOW)).toBe(true);
        });

        test('should never prompt after the maximum number of dismissals', () => {
            const prompt = { count: OFFLINE_PROMPT_MAX_DISMISSALS, dismissedAt: NOW - UNIX_WEEK * 52 };
            expect(shouldPromptOfflineSetup(prompt, NOW)).toBe(false);
        });
    });

    describe('nextOfflinePrompt', () => {
        test('should start the count at 1', () => {
            expect(nextOfflinePrompt(undefined, NOW)).toEqual({ count: 1, dismissedAt: NOW });
        });

        test('should increment the count and update the timestamp', () => {
            const prompt = { count: 1, dismissedAt: NOW - UNIX_WEEK * 3 };
            expect(nextOfflinePrompt(prompt, NOW)).toEqual({ count: 2, dismissedAt: NOW });
        });
    });
});
