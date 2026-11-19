import safeRegexLib from 'safe-regex2';
import type { MockedFunction } from 'vitest';

import { RegexSafety, checkRegex, safeRegex } from './safe-regex';

vi.mock('safe-regex2', () => ({ default: vi.fn(() => true) }));

const safeRegexLibMock = safeRegexLib as MockedFunction<typeof safeRegexLib>;

class MockWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    terminate = vi.fn();

    postMessage = vi.fn().mockImplementation(() => {
        this.onmessage?.({ data: { elapsed: 1 } } as MessageEvent);
    });
}

class NeverRespondingWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    terminate = vi.fn();
    postMessage = vi.fn();
}

describe('checkRegex', () => {
    afterEach(() => vi.clearAllMocks());

    test('returns Invalid for a regex that fails to compile', async () => {
        const result = checkRegex('[invalid');
        expect(result).toBe(RegexSafety.Invalid);
    });

    test('returns Unsafe when safe-regex2 rejects the pattern', async () => {
        safeRegexLibMock.mockReturnValueOnce(false);
        const result = checkRegex('(a+)+');
        expect(result).toBe(RegexSafety.Unsafe);
    });
});

// Skip those tests as long as they are unused in production
// Check safeRegex comment
describe.skip('safeRegex', () => {
    afterEach(() => vi.clearAllMocks());

    test('returns Safe when the regex completes within the time limit', async () => {
        global.Worker = MockWorker as unknown as typeof Worker;
        const result = await safeRegex('hello');
        expect(result).toBe(RegexSafety.Safe);
    });

    test('returns Unsafe when the regex times out in the worker', async () => {
        vi.useFakeTimers();
        global.Worker = NeverRespondingWorker as unknown as typeof Worker;

        const promise = safeRegex('hello');
        vi.advanceTimersByTime(600);
        const result = await promise;

        expect(result).toBe(RegexSafety.Unsafe);
        vi.useRealTimers();
    });
});
