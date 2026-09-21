import { paymentAttemptRefusedChargebeeErrorName } from '@proton/chargebee/lib/types';

import { createPaymentTokenV5CreditCard } from '../createPaymentToken';
import type { ChargebeeIframeEvents, ChargebeeIframeHandles } from '../interface';
import { ChargebeeCardPaymentProcessor, isPostalCode } from './chargebeeCardPayment';

jest.mock('../createPaymentToken', () => ({
    createPaymentTokenV5CreditCard: jest.fn(),
}));

const mockedCreateToken = jest.mocked(createPaymentTokenV5CreditCard);

describe('postal code', () => {
    it('should validate invalid postal code', () => {
        expect(isPostalCode('')).toBe(false);
        expect(isPostalCode('1')).toBe(false);
        expect(isPostalCode('12')).toBe(false);
    });

    it('should validate us postal code', () => {
        expect(isPostalCode('CA95014')).toBe(true);
    });

    it('should validate polish postal code', () => {
        expect(isPostalCode('31-444')).toBe(true);
    });
});

describe('fetchPaymentToken error contract', () => {
    const buildProcessor = () => {
        const processor = new ChargebeeCardPaymentProcessor(
            jest.fn(),
            jest.fn(),
            { Amount: 100, Currency: 'EUR' as const },
            {
                validateCardForm: jest.fn().mockResolvedValue({ status: 'success', data: {} }),
            } as unknown as ChargebeeIframeHandles,
            {} as ChargebeeIframeEvents,
            false,
            undefined,
            jest.fn(),
            jest.fn(),
            jest.fn()
        );
        processor.setPostalCode('94107');
        return processor;
    };

    beforeEach(() => jest.clearAllMocks());

    it('rejects with the ignorable error flagged so it is not reported to Sentry', async () => {
        const declineError: any = {
            status: 'failure',
            error: { name: paymentAttemptRefusedChargebeeErrorName, code: 'card_declined' },
        };
        mockedCreateToken.mockRejectedValue(declineError);

        const processor = buildProcessor();
        await expect(processor.fetchPaymentToken()).rejects.toBe(declineError);
        expect(declineError.ignore).toBe(true);
        expect(processor.fetchedPaymentToken).toBe(null);
    });

    it('rejects unexpected errors unflagged', async () => {
        const unexpectedError: Error & { ignore?: boolean } = new Error('boom');
        mockedCreateToken.mockRejectedValue(unexpectedError);

        await expect(buildProcessor().fetchPaymentToken()).rejects.toBe(unexpectedError);
        expect(unexpectedError.ignore).toBeUndefined();
    });
});
