import { act, renderHook } from '@testing-library/react';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { useFido2Action } from './useFido2Action';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({ captureMessage: jest.fn() }));

const fail = async (error: unknown, afterMs: number) => {
    const { result } = renderHook(() => useFido2Action());
    await act(async () => {
        const run = result.current.runFido2Action(
            () => new Promise((_, reject) => setTimeout(() => reject(error), afterMs)),
            'auth'
        );
        jest.advanceTimersByTime(afterMs);
        await expect(run).rejects.toBe(error);
    });
    return jest.mocked(captureMessage).mock.calls[0][1];
};

describe('useFido2Action', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(captureMessage).mockClear();
        consoleError = jest.spyOn(console, 'error').mockImplementation(noop);
    });

    afterEach(() => {
        jest.useRealTimers();
        consoleError.mockRestore();
    });

    it('groups an instant rejection apart from a user cancel', async () => {
        const error = new DOMException('Not allowed', 'NotAllowedError');

        expect(await fail(error, 100)).toMatchObject({
            fingerprint: ['Security key auth', 'NotAllowedError', 'instant'],
            tags: { fido2Error: 'NotAllowedError', fido2Timing: 'instant', fido2Extension: false },
        });

        jest.mocked(captureMessage).mockClear();

        expect(await fail(error, 5000)).toMatchObject({
            fingerprint: ['Security key auth', 'NotAllowedError', 'user'],
            tags: { fido2Timing: 'user' },
            extra: { durationMs: 5000 },
        });
    });

    it('flags errors thrown by a browser extension', async () => {
        const error = new Error('Something went wrong.');
        error.stack = 'Error\n    at Messenger.<anonymous> (chrome-extension://abc/content/fido2-page-script.js:1:1)';

        expect(await fail(error, 100)).toMatchObject({
            fingerprint: ['Security key auth', 'Error', 'instant'],
            tags: { fido2Extension: true },
        });
    });
});
