import { PAYMENT_TOKEN_STATUS } from './constants';
import { type EnsureTokenChargeableTranslations, ensureTokenChargeable } from './ensureTokenChargeable';

let tab: { closed: boolean; close: () => any };

const translations: EnsureTokenChargeableTranslations = {
    processAbortedError: 'Process aborted',
    paymentProcessCanceledError: 'Payment process canceled',
    paymentProcessFailedError: 'Payment process failed',
    paymentProcessConsumedError: 'Payment process consumed',
    paymentProcessNotSupportedError: 'Payment process not supported',
    unknownPaymentTokenStatusError: 'Unknown payment token status',
    tabClosedError: 'Tab closed',
};

describe('process', () => {
    let ApprovalURL = 'https://example.proton.me';
    let ReturnHost = 'https://return.proton.me';
    let Token = 'some-payment-token-222';
    let api: jest.Mock;
    let signal: AbortSignal;

    beforeEach(() => {
        jest.clearAllMocks();
        tab = { closed: false, close: jest.fn() };
        jest.spyOn(window, 'open').mockReturnValue(tab as any);
        jest.spyOn(window, 'removeEventListener');
        jest.spyOn(window, 'addEventListener');

        api = jest.fn();
        signal = {
            aborted: false,
            reason: null,
            any: jest.fn(),
            onabort: jest.fn(),
            throwIfAborted: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        };
    });

    it('should open the ApprovalURL', () => {
        tab.closed = true; // prevents the test from hanging because of an unhandled promise
        ensureTokenChargeable({ api, ApprovalURL, ReturnHost, signal, Token }, translations).catch(() => {});

        expect(window.open).toHaveBeenCalledWith(ApprovalURL);
    });

    it('should add abort listener to the signal', async () => {
        const promise = ensureTokenChargeable({ api, ApprovalURL, ReturnHost, signal, Token }, translations);

        expect(signal.addEventListener).toHaveBeenCalledTimes(1);
        const signalAddEventListenerMock = signal.addEventListener as jest.Mock;
        expect(signalAddEventListenerMock.mock.lastCall[0]).toEqual('abort');
        expect(typeof signalAddEventListenerMock.mock.lastCall[1]).toBe('function');

        expect(window.addEventListener).toHaveBeenCalledTimes(1);
        const windowAddEventListenerMock = window.addEventListener as jest.Mock;
        expect(windowAddEventListenerMock.mock.lastCall[0]).toEqual('message');
        expect(typeof windowAddEventListenerMock.mock.lastCall[1]).toEqual('function');
        const onMessage = windowAddEventListenerMock.mock.lastCall[1];

        const abort = signalAddEventListenerMock.mock.lastCall[1];

        abort();

        expect(window.removeEventListener).toHaveBeenCalledWith('message', onMessage, false);
        expect(signal.removeEventListener).toHaveBeenCalledWith('abort', abort);
        expect(tab.close).toHaveBeenCalled();
        await expect(promise).rejects.toEqual(new Error('Process aborted'));
    });

    it('should resolve if Status is STATUS_CHARGEABLE', async () => {
        tab.closed = true;
        api.mockResolvedValue({
            Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
        });

        const promise = ensureTokenChargeable({ api, ApprovalURL, ReturnHost, signal, Token }, translations);

        await expect(promise).resolves.toEqual(undefined);
    });

    it.each([
        PAYMENT_TOKEN_STATUS.STATUS_PENDING,
        PAYMENT_TOKEN_STATUS.STATUS_FAILED,
        PAYMENT_TOKEN_STATUS.STATUS_CONSUMED,
        PAYMENT_TOKEN_STATUS.STATUS_NOT_SUPPORTED,
    ])('should reject if Status is %s', async (Status) => {
        tab.closed = true;
        api.mockResolvedValue({
            Status,
        });

        const promise = ensureTokenChargeable({ api, ApprovalURL, ReturnHost, signal, Token }, translations);

        await expect(promise).rejects.toEqual({ tryAgain: true });
    });

    it('should re-try to confirm until the tab is closed', async () => {
        api.mockResolvedValue({
            Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
        });

        const delayListening = 10;
        const promise = ensureTokenChargeable(
            { api, ApprovalURL, ReturnHost, signal, Token },
            translations,
            delayListening
        );
        jest.runAllTimers();

        tab.closed = true;

        await expect(promise).resolves.toEqual(undefined);
    });
});
