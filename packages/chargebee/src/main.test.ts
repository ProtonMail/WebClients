import { vi } from 'vitest';

import type { Checkpoint } from './checkpoints';

const { sendUnhandledErrorMessage } = vi.hoisted(() => ({ sendUnhandledErrorMessage: vi.fn() }));

vi.mock('./chargebee-entry', () => ({
    initialize: vi.fn(),
    toReportableError: (error: any) => error,
}));

vi.mock('./message-bus', () => ({
    getMessageBus: () => ({ sendUnhandledErrorMessage }),
}));

/**
 * The limit counts per page, so each test needs a fresh copy of the module. The listener is taken
 * as it registers rather than triggered through `window`, which would pile up one listener per copy.
 */
async function loadIframeDocument() {
    vi.resetModules();
    sendUnhandledErrorMessage.mockClear();

    const addEventListener = vi.spyOn(window, 'addEventListener');
    await import('./main');
    const registration = addEventListener.mock.calls.find(([type]) => type === 'error');
    addEventListener.mockRestore();

    const onError = registration![1] as (event: ErrorEvent) => void;
    const { getCheckpoints } = await import('./checkpoints');

    return {
        throwInsideTheIframe: (message: string, filename = 'https://js.chargebee.com/v2/chargebee.js') =>
            onError(
                new ErrorEvent('error', {
                    message,
                    filename,
                    error: new Error(message),
                })
            ),
        throwOpaqueCrossOriginError: () =>
            onError(
                new ErrorEvent('error', {
                    message: 'Script error.',
                    filename: '',
                })
            ),
        windowErrors: (): Checkpoint[] => getCheckpoints().filter(({ name }: Checkpoint) => name === 'window_error'),
    };
}

it('should report an uncaught error with the stage it happened at', async () => {
    const { throwInsideTheIframe } = await loadIframeDocument();

    throwInsideTheIframe('Cannot read properties of undefined');

    expect(sendUnhandledErrorMessage).toHaveBeenCalledTimes(1);
    expect(sendUnhandledErrorMessage.mock.calls[0][0].message).toBe('Cannot read properties of undefined');
    expect(sendUnhandledErrorMessage.mock.calls[0][1]).toBe('none');
});

it.each(['chrome-extension://abc/inject.js', 'moz-extension://abc/content.js', 'blob:https://account-api.proton.me/1'])(
    'should not report a throw from a browser extension script (%s)',
    async (filename) => {
        const { throwInsideTheIframe, windowErrors } = await loadIframeDocument();

        throwInsideTheIframe('Cannot redefine property: ethereum', filename);

        expect(sendUnhandledErrorMessage).not.toHaveBeenCalled();
        expect(windowErrors()).toHaveLength(1);
    }
);

it('should still report an opaque cross-origin "Script error.", since chargebee.js throws those too', async () => {
    const { throwOpaqueCrossOriginError } = await loadIframeDocument();

    throwOpaqueCrossOriginError();

    expect(sendUnhandledErrorMessage).toHaveBeenCalledTimes(1);
});

it('should not let browser extension throws use up the report limit', async () => {
    const { throwInsideTheIframe } = await loadIframeDocument();

    for (let index = 0; index < 20; index++) {
        throwInsideTheIframe('Cannot redefine property: ethereum', 'chrome-extension://abc/inject.js');
    }
    throwInsideTheIframe('Chargebee threw after the extension');

    expect(sendUnhandledErrorMessage).toHaveBeenCalledTimes(1);
});

it('should report every throw of a session that stays under the limit', async () => {
    const { throwInsideTheIframe } = await loadIframeDocument();

    for (let index = 0; index < 10; index++) {
        throwInsideTheIframe('Chargebee threw once');
    }

    expect(sendUnhandledErrorMessage).toHaveBeenCalledTimes(10);
});

it('should stop reporting a repeating throw, so one loop cannot outgrow a Sentry event', async () => {
    const { throwInsideTheIframe } = await loadIframeDocument();

    for (let index = 0; index < 250; index++) {
        throwInsideTheIframe('Chargebee retry loop threw');
    }

    // Ten reports leave the iframe; the remaining 240 throws cost nothing.
    expect(sendUnhandledErrorMessage).toHaveBeenCalledTimes(10);
});

it('should keep counting the throws it no longer reports', async () => {
    const { throwInsideTheIframe, windowErrors } = await loadIframeDocument();

    for (let index = 0; index < 30; index++) {
        throwInsideTheIframe('Chargebee retry loop threw');
    }

    expect(windowErrors().pop()?.data.occurrence).toBe(30);
});
