// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import type { Fido2ActionContext } from './useFido2Action';
import { useFido2Action } from './useFido2Action';

vi.mock('@proton/shared/lib/helpers/sentry', () => ({ captureMessage: vi.fn() }));

const fail = async (error: Error, afterMs: number, context: Fido2ActionContext = 'auth') => {
    const { result } = renderHook(() => useFido2Action());
    await act(async () => {
        const run = result.current.runFido2Action(
            () => new Promise((_, reject) => setTimeout(() => reject(error), afterMs)),
            context
        );
        vi.advanceTimersByTime(afterMs);
        await expect(run).rejects.toBe(error);
    });
    expect(result.current.fidoError).toBe(error.name);
    return vi.mocked(captureMessage).mock.calls[0]?.[1];
};

describe('useFido2Action', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(captureMessage).mockClear();
        vi.spyOn(console, 'error').mockImplementation(noop);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('groups an instant rejection apart from a user cancel', async () => {
        const error = new DOMException('Not allowed', 'NotAllowedError');

        expect(await fail(error, 100)).toMatchObject({
            fingerprint: ['Security key auth', 'NotAllowedError', 'instant'],
            tags: { fido2Error: 'NotAllowedError', fido2Timing: 'instant', fido2Extension: false },
        });

        vi.mocked(captureMessage).mockClear();

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

    it('does not report a cancelled registration, which the backend metrics count', async () => {
        const error = new DOMException('Not allowed', 'NotAllowedError');

        await fail(error, 1500, 'registration');
        expect(captureMessage).not.toHaveBeenCalled();

        expect(await fail(error, 100, 'registration')).toMatchObject({
            fingerprint: ['Security key registration', 'NotAllowedError', 'instant'],
        });
    });

    it('reads the focus before the security key prompt opens', async () => {
        vi.spyOn(document, 'hasFocus').mockReturnValueOnce(false).mockReturnValue(true);

        expect(await fail(new DOMException('Not allowed', 'NotAllowedError'), 100)).toMatchObject({
            extra: { hasFocusAtStart: false },
        });
    });
});
