import type { Checkpoint } from './checkpoints';

const sendUnhandledErrorMessage = jest.fn();

jest.mock('./chargebee-entry', () => ({
    initialize: jest.fn(),
    toReportableError: (error: any) => error,
}));

jest.mock('./message-bus', () => ({
    getMessageBus: () => ({ sendUnhandledErrorMessage }),
}));

/**
 * The limit counts per page, so each test needs a fresh copy of the module. The listener is taken
 * as it registers rather than triggered through `window`, which would pile up one listener per copy.
 */
function loadIframeDocument() {
    jest.resetModules();
    sendUnhandledErrorMessage.mockClear();

    const addEventListener = jest.spyOn(window, 'addEventListener');
    require('./main');
    const registration = addEventListener.mock.calls.find(([type]) => type === 'error');
    addEventListener.mockRestore();

    const onError = registration![1] as (event: ErrorEvent) => void;
    const { getCheckpoints } = require('./checkpoints');

    return {
        throwInsideTheIframe: (message: string) =>
            onError(new ErrorEvent('error', { message, error: new Error(message) })),
        windowErrors: (): Checkpoint[] => getCheckpoints().filter(({ name }: Checkpoint) => name === 'window_error'),
    };
}

it('should report an uncaught error with the stage it happened at', () => {
    const { throwInsideTheIframe } = loadIframeDocument();

    throwInsideTheIframe('Cannot read properties of undefined');

    expect(sendUnhandledErrorMessage).toHaveBeenCalledTimes(1);
    expect(sendUnhandledErrorMessage.mock.calls[0][0].message).toBe('Cannot read properties of undefined');
    expect(sendUnhandledErrorMessage.mock.calls[0][1]).toBe('none');
});

it('should report every throw of a session that stays under the limit', () => {
    const { throwInsideTheIframe } = loadIframeDocument();

    for (let index = 0; index < 10; index++) {
        throwInsideTheIframe('Chargebee threw once');
    }

    expect(sendUnhandledErrorMessage).toHaveBeenCalledTimes(10);
});

it('should stop reporting a repeating throw, so one loop cannot outgrow a Sentry event', () => {
    const { throwInsideTheIframe } = loadIframeDocument();

    for (let index = 0; index < 250; index++) {
        throwInsideTheIframe('Chargebee retry loop threw');
    }

    // Ten reports leave the iframe; the remaining 240 throws cost nothing.
    expect(sendUnhandledErrorMessage).toHaveBeenCalledTimes(10);
});

it('should keep counting the throws it no longer reports', () => {
    const { throwInsideTheIframe, windowErrors } = loadIframeDocument();

    for (let index = 0; index < 30; index++) {
        throwInsideTheIframe('Chargebee retry loop threw');
    }

    expect(windowErrors().pop()?.data.occurrence).toBe(30);
});
