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
    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(captureMessage).mockClear();
        jest.spyOn(console, 'error').mockImplementation(noop);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('groups an instant rejection apart from a user cancel', async () => {
        const error = new DOMException('Not allowed', 'NotAllowedError');

        expect(await fail(error, 100)).toMatchObject({
            fingerprint: ['Security key auth', 'NotAllowedError', 'instant'],
            tags: { fido2Error: 'NotAllowedError', fido2Timing: 'instant', fido2Extension: false },
        });

        jest.mocked(captureMessage).mockClear();

        expect(await fail(error, 1500)).toMatchObject({
            fingerprint: ['Security key auth', 'NotAllowedError', 'user'],
            tags: { fido2Timing: 'user' },
            extra: { durationMs: 1500 },
        });
    });

    it('groups errors thrown by a browser extension apart from ours', async () => {
        const error = new Error('Something went wrong.');
        error.stack = 'Error\n    at Messenger.<anonymous> (chrome-extension://abc/content/fido2-page-script.js:1:1)';

        expect(await fail(error, 100)).toMatchObject({
            fingerprint: ['Security key auth', 'extension', 'instant'],
            tags: { fido2Error: 'Error', fido2Extension: true },
        });
    });

    it('reads the focus before the security key prompt opens', async () => {
        jest.spyOn(document, 'hasFocus').mockReturnValueOnce(false).mockReturnValue(true);

        expect(await fail(new DOMException('Not allowed', 'NotAllowedError'), 100)).toMatchObject({
            extra: { hasFocusAtStart: false },
        });
    });
});
