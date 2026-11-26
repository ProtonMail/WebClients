import { shouldPrompt } from './cadence';
import type { PromptDismissal } from './types';

const DAY = 24 * 3_600;

describe('shouldPrompt', () => {
    test('always eligible when never dismissed', () => {
        expect(shouldPrompt(undefined, [DAY, 2 * DAY], 1000)).toBe(true);
        expect(shouldPrompt(undefined, [], 1000)).toBe(true);
    });

    test('stops prompting once the cadence is exhausted', () => {
        const dismissal: PromptDismissal = { count: 3, lastDismissedAt: 0 };
        expect(shouldPrompt(dismissal, [DAY, 2 * DAY], Number.MAX_SAFE_INTEGER)).toBe(false);
    });

    test('re-prompts after the graduated interval elapses', () => {
        const dismissal: PromptDismissal = { count: 1, lastDismissedAt: 1000 };
        expect(shouldPrompt(dismissal, [DAY, 2 * DAY], 1000 + DAY)).toBe(false);
        expect(shouldPrompt(dismissal, [DAY, 2 * DAY], 1000 + DAY + 1)).toBe(true);
    });

    test('applies the next snooze level on subsequent dismissals', () => {
        const dismissal: PromptDismissal = { count: 2, lastDismissedAt: 1000 };
        expect(shouldPrompt(dismissal, [DAY, 2 * DAY], 1000 + 2 * DAY)).toBe(false);
        expect(shouldPrompt(dismissal, [DAY, 2 * DAY], 1000 + 2 * DAY + 1)).toBe(true);
    });

    test('empty cadence makes the prompt one-shot', () => {
        const dismissal: PromptDismissal = { count: 1, lastDismissedAt: 1000 };
        expect(shouldPrompt(dismissal, [], Number.MAX_SAFE_INTEGER)).toBe(false);
    });
});
