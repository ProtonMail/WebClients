import { withScope } from '@sentry/browser';

import { captureMessage, getSentryError, traceError } from '@proton/shared/lib/helpers/sentry';

import type { Subscription } from '../core/subscription/interface';
import { capturePaymentMessage, tracePaymentError } from './capture';

jest.mock('@sentry/browser', () => ({ withScope: jest.fn() }));
jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    captureMessage: jest.fn(),
    traceError: jest.fn(),
    getSentryError: jest.fn((error) => error),
}));

const scope = {
    setTag: jest.fn(),
    setTags: jest.fn(),
    setExtra: jest.fn(),
    setExtras: jest.fn(),
    setContext: jest.fn(),
    setLevel: jest.fn(),
    setFingerprint: jest.fn(),
    setTransactionName: jest.fn(),
};

/** Mirrors the real `Hub.withScope`, which re-throws whatever the callback throws. */
const realisticWithScope = (callback: (scope: any) => void) => callback(scope);

beforeEach(() => {
    jest.clearAllMocks();
    (getSentryError as jest.Mock).mockImplementation((error) => error);
    (withScope as jest.Mock).mockImplementation(realisticWithScope);
});

const throwingGetter = () => {
    const exception = {};
    for (const key of ['code', 'name', 'type', 'message', 'displayMessage', 'status', 'error']) {
        Object.defineProperty(exception, key, {
            get() {
                throw new Error(`reading ${key} explodes`);
            },
            enumerable: true,
        });
    }
    return exception;
};

const circular = () => {
    const exception: any = { code: 'Circular', message: 'loops' };
    exception.self = exception;
    return exception;
};

const hostileExceptions: [string, unknown][] = [
    ['an object whose every property getter throws', throwingGetter()],
    ['a circular object', circular()],
    ['an object with no prototype', Object.assign(Object.create(null), { message: 'no proto' })],
    [
        'a proxy that throws on any access',
        new Proxy(
            {},
            {
                get: () => {
                    throw new Error('nope');
                },
            }
        ),
    ],
    ['a frozen object', Object.freeze({ code: 'Frozen' })],
    ['a symbol', Symbol('boom')],
    ['a bigint', BigInt(9007199254740993n)],
    ['a function', () => 'not an error'],
    ['an array', [1, 2, 3]],
    [
        'an error with a throwing message getter',
        Object.defineProperty(new Error('x'), 'message', {
            get() {
                throw new Error('message explodes');
            },
        }),
    ],
];

const malformedSubscriptions: [string, unknown][] = [
    ['plans that are not an array', { Cycle: 1, Currency: 'EUR', Plans: 'nope' }],
    ['a null plans list', { Cycle: 1, Currency: 'EUR', Plans: null }],
    [
        'a self-referencing upcoming subscription',
        (() => {
            const s: any = { Cycle: 1, Currency: 'EUR', Plans: [] };
            s.UpcomingSubscription = s;
            return s;
        })(),
    ],
    [
        'a proxy subscription that throws on access',
        new Proxy(
            {},
            {
                get: () => {
                    throw new Error('nope');
                },
            }
        ),
    ],
];

describe('a capture must never take down the payment flow that reported it', () => {
    it.each(hostileExceptions)('should survive tracing %s', (_label, exception) => {
        expect(() => tracePaymentError(exception, { component: 'create-payment-token' })).not.toThrow();
    });

    it.each(hostileExceptions)('should survive %s as the cause of a message', (_label, cause) => {
        expect(() =>
            capturePaymentMessage('Payments: BIN response failure', { component: 'create-payment-token' }, cause)
        ).not.toThrow();
    });

    it.each(malformedSubscriptions)('should survive %s', (_label, subscription) => {
        expect(() =>
            tracePaymentError(new Error('boom'), {
                component: 'subscription-container',
                subscription: subscription as Subscription,
            })
        ).not.toThrow();
    });

    it('should survive Sentry itself being broken', () => {
        (withScope as jest.Mock).mockImplementation(() => {
            throw new Error('Sentry is not initialised');
        });

        expect(() => tracePaymentError(new Error('boom'), { component: 'create-payment-token' })).not.toThrow();
        expect(() => capturePaymentMessage('boom', { component: 'create-payment-token' })).not.toThrow();
    });

    it('should survive the transport throwing', () => {
        (traceError as jest.Mock).mockImplementation(() => {
            throw new Error('transport is down');
        });
        (captureMessage as jest.Mock).mockImplementation(() => {
            throw new Error('transport is down');
        });

        expect(() => tracePaymentError(new Error('boom'), { component: 'create-payment-token' })).not.toThrow();
        expect(() => capturePaymentMessage('boom', { component: 'create-payment-token' })).not.toThrow();
    });

    it('should survive the filter throwing', () => {
        (getSentryError as jest.Mock).mockImplementation(() => {
            throw new Error('filter is broken');
        });

        expect(() => tracePaymentError(new Error('boom'), { component: 'create-payment-token' })).not.toThrow();
    });

    it('should survive missing options', () => {
        expect(() => tracePaymentError(new Error('boom'), undefined as any)).not.toThrow();
        expect(() => capturePaymentMessage('boom', undefined as any)).not.toThrow();
    });

    it('should still report normally once the hostile cases are out of the way', () => {
        tracePaymentError(new Error('boom'), { component: 'create-payment-token' });

        expect(traceError).toHaveBeenCalledTimes(1);
    });
});
