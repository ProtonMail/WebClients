import safeRegexLib from 'safe-regex2';

import { RegexSafety, checkRegex, safeRegex } from './safe-regex';

jest.mock('safe-regex2', () => jest.fn(() => true));

const safeRegexLibMock = safeRegexLib as jest.MockedFunction<typeof safeRegexLib>;

class MockWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    terminate = jest.fn();

    postMessage = jest.fn().mockImplementation(() => {
        this.onmessage?.({ data: { elapsed: 1 } } as MessageEvent);
    });
}

class NeverRespondingWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: ErrorEvent) => void) | null = null;
    terminate = jest.fn();
    postMessage = jest.fn();
}

describe('checkRegex', () => {
    afterEach(() => jest.clearAllMocks());

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
    afterEach(() => jest.clearAllMocks());

    test('returns Safe when the regex completes within the time limit', async () => {
        global.Worker = MockWorker as unknown as typeof Worker;
        const result = await safeRegex('hello');
        expect(result).toBe(RegexSafety.Safe);
    });

    test('returns Unsafe when the regex times out in the worker', async () => {
        jest.useFakeTimers();
        global.Worker = NeverRespondingWorker as unknown as typeof Worker;

        const promise = safeRegex('hello');
        jest.advanceTimersByTime(600);
        const result = await promise;

        expect(result).toBe(RegexSafety.Unsafe);
        jest.useRealTimers();
    });
});
