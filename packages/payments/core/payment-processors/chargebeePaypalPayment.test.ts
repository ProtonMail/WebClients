import { chargebeeValidationErrorName } from '@proton/chargebee/lib/types';

import { createPaymentTokenV5Paypal } from '../createPaymentToken';
import type { ChargebeeIframeEvents, ChargebeeIframeHandles } from '../interface';
import { ChargebeePaypalPaymentProcessor } from './chargebeePaypalPayment';

jest.mock('../createPaymentToken', () => ({
    createPaymentTokenV5Paypal: jest.fn(),
}));

const mockedCreateToken = jest.mocked(createPaymentTokenV5Paypal);

describe('fetchPaymentToken error contract', () => {
    const buildProcessor = () =>
        new ChargebeePaypalPaymentProcessor(
            jest.fn(),
            jest.fn(),
            { Amount: 100, Currency: 'EUR' as const },
            {} as ChargebeeIframeHandles,
            {} as ChargebeeIframeEvents,
            undefined
        );

    beforeEach(() => jest.clearAllMocks());

    it('rejects with the ignorable error flagged so it is not reported to Sentry', async () => {
        const validationError: any = {
            status: 'failure',
            error: { name: chargebeeValidationErrorName },
        };
        mockedCreateToken.mockRejectedValue(validationError);

        const processor = buildProcessor();
        await expect(processor.fetchPaymentToken()).rejects.toBe(validationError);
        expect(validationError.ignore).toBe(true);
        expect(processor.fetchedPaymentToken).toBe(null);
    });

    it('rejects unexpected errors unflagged', async () => {
        const unexpectedError: Error & { ignore?: boolean } = new Error('boom');
        mockedCreateToken.mockRejectedValue(unexpectedError);

        await expect(buildProcessor().fetchPaymentToken()).rejects.toBe(unexpectedError);
        expect(unexpectedError.ignore).toBeUndefined();
    });
});
