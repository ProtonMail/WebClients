import { c } from 'ttag';

import { VerifyPayment, createPaymentToken, process } from '@proton/components/containers/payments/paymentTokenHelper';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';

import { TokenPaymentMethod, WrappedCardPayment } from './interface';

let tab: { closed: boolean; close: () => any };

beforeAll(() => {
    jest.useFakeTimers();
});

afterAll(() => {
    jest.useRealTimers();
});

beforeEach(() => {
    jest.clearAllMocks();

    tab = { closed: false, close: jest.fn() };
    jest.spyOn(window, 'open').mockReturnValue(tab as any);
    jest.spyOn(window, 'removeEventListener');
    jest.spyOn(window, 'addEventListener');
});

describe('process', () => {
    let ApprovalURL = 'https://example.proton.me';
    let ReturnHost = 'https://return.proton.me';
    let Token = 'some-payment-token-222';
    let api: jest.Mock;
    let signal: AbortSignal;

    beforeEach(() => {
        api = jest.fn();
        signal = {
            aborted: false,
            reason: null,
            onabort: jest.fn(),
            throwIfAborted: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        };
    });

    it('should open the ApprovalURL', () => {
        tab.closed = true; // prevents the test from hanging because of an unhandled promise
        process({ api, ApprovalURL, ReturnHost, signal, Token }).catch(() => {});

        expect(window.open).toHaveBeenCalledWith(ApprovalURL);
    });

    it('should add abort listener to the signal', async () => {
        const promise = process({ api, ApprovalURL, ReturnHost, signal, Token });

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
        await expect(promise).rejects.toEqual(new Error(c('Error').t`Process aborted`));
    });

    it('should resolve if Status is STATUS_CHARGEABLE', async () => {
        tab.closed = true;
        api.mockResolvedValue({
            Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
        });

        const promise = process({ api, ApprovalURL, ReturnHost, signal, Token });

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

        const promise = process({ api, ApprovalURL, ReturnHost, signal, Token });

        await expect(promise).rejects.toEqual({ tryAgain: true });
    });

    it('should re-try to confirm until the tab is closed', async () => {
        api.mockResolvedValue({
            Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
        });

        const delayListening = 10;
        const promise = process({ api, ApprovalURL, ReturnHost, signal, Token }, delayListening);
        jest.runAllTimers();

        tab.closed = true;

        await expect(promise).resolves.toEqual(undefined);
    });
});

describe('createPaymentToken', () => {
    let verify: VerifyPayment;
    let api: Api;

    beforeEach(() => {
        jest.clearAllMocks();

        verify = jest.fn();
        api = jest.fn();
    });

    it('should return the params as is if it is TokenPaymentMethod', async () => {
        const params: TokenPaymentMethod = {
            Payment: {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'token123',
                },
            },
        };

        const result = await createPaymentToken({
            params,
            verify,
            api,
        });

        expect(result).toEqual(params);
    });

    it('should return the params if the token is already chargable', async () => {
        const params: WrappedCardPayment = {
            Payment: {
                Type: PAYMENT_METHOD_TYPES.CARD,
                Details: {
                    Name: 'John Doe',
                    Number: '4242424242424242',
                    ExpMonth: '12',
                    ExpYear: '2032',
                    CVC: '123',
                    ZIP: '12345',
                    Country: 'US',
                },
            },
        };

        (api as any).mockReturnValue(
            Promise.resolve({
                Token: 'some-payment-token-222',
                Status: PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE,
            })
        );

        const result = await createPaymentToken({
            params,
            verify,
            api,
        });

        expect(result).toEqual({
            Payment: {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'some-payment-token-222',
                },
            },
        });
    });

    it('should call verify() if the token is not chargable', async () => {
        const params: WrappedCardPayment = {
            Payment: {
                Type: PAYMENT_METHOD_TYPES.CARD,
                Details: {
                    Name: 'John Doe',
                    Number: '4242424242424242',
                    ExpMonth: '12',
                    ExpYear: '2032',
                    CVC: '123',
                    ZIP: '12345',
                    Country: 'US',
                },
            },
        };

        (api as any).mockReturnValue(
            Promise.resolve({
                Token: 'some-payment-token-222',
                Status: PAYMENT_TOKEN_STATUS.STATUS_PENDING,
                ApprovalURL: 'https://example.proton.me',
                ReturnHost: 'https://return.proton.me',
            })
        );

        const verifyResult: TokenPaymentMethod = {
            Payment: {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'some-payment-token-222',
                },
            },
        };

        (verify as any).mockReturnValue(verifyResult);

        const result = await createPaymentToken({
            params,
            verify,
            api,
        });

        expect(verify).toHaveBeenCalledWith({
            Payment: params.Payment,
            Token: 'some-payment-token-222',
            ApprovalURL: 'https://example.proton.me',
            ReturnHost: 'https://return.proton.me',
        });

        expect(result).toEqual(verifyResult);
    });
});
