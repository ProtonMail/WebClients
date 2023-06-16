import { queryPaymentMethodStatus, queryPaymentMethods } from '@proton/shared/lib/api/payments';
import { BLACK_FRIDAY } from '@proton/shared/lib/constants';

import { PAYMENT_METHOD_TYPES } from './constants';
import { Autopay, PaymentMethodFlows, PaymentMethodStatus, SavedPaymentMethod } from './interface';
import { PaymentMethods, initializePaymentMethods } from './methods';

let status: PaymentMethodStatus;

beforeEach(() => {
    status = {
        Card: true,
        Paypal: true,
        Apple: true,
        Cash: true,
        Bitcoin: true,
    };
});

describe('getNewMethods()', () => {
    it('should include card when card is available', () => {
        const methods = new PaymentMethods(status, [], 500, '', 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'card')).toBe(true);
    });

    it('should not include card when card is not available', () => {
        status.Card = false;

        const methods = new PaymentMethods(status, [], 500, '', 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'card')).toBe(false);
    });

    // tests for PayPal
    it('should include PayPal when PayPal is available', () => {
        const methods = new PaymentMethods(status, [], 500, '', 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(true);
    });

    it('should not include PayPal when PayPal is not available due to amount less than minimum', () => {
        const methods = new PaymentMethods(status, [], 50, '', 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(false);
    });

    it('should not include PayPal when already used as payment method', () => {
        const methods = new PaymentMethods(
            status,
            [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
            ],
            500,
            '',
            'subscription'
        );

        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(false);
    });

    it('should include Bitcoin when Bitcoin is available', () => {
        const methods = new PaymentMethods(status, [], 500, '', 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });

    it('should not include Bitcoin when Bitcoin is not available due to coupon', () => {
        const methods = new PaymentMethods(status, [], 500, BLACK_FRIDAY.COUPON_CODE, 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it.each(['signup', 'human-verification'] as PaymentMethodFlows[])(
        'should not include Bitcoin when Bitcoin is not available due to flow %s',
        (flow) => {
            const methods = new PaymentMethods(status, [], 500, '', flow);

            expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
        }
    );

    it('should not include bitcoin due to amount less than minimum', () => {
        const methods = new PaymentMethods(status, [], 50, '', 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it('should include Cash when Cash is available', () => {
        const methods = new PaymentMethods(status, [], 500, '', 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(true);
    });

    it('should not include Cash when Cash is not available due to coupon', () => {
        const methods = new PaymentMethods(status, [], 500, BLACK_FRIDAY.COUPON_CODE, 'subscription');

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
    });

    it.each(['signup', 'signup-pass', 'human-verification'] as PaymentMethodFlows[])(
        'should not include Cash when Cash is not available due to flow %s',
        (flow) => {
            const methods = new PaymentMethods(status, [], 500, '', flow);

            expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
        }
    );
});

describe('getUsedMethods()', () => {
    it('should return used methods: paypal and cards', () => {
        const methods = new PaymentMethods(
            status,
            [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
                {
                    ID: '2',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 501,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '12',
                        ExpYear: '2030',
                        ZIP: '12345',
                        Country: 'US',
                        Last4: '1234',
                        Brand: 'Visa',
                    },
                },
                // one more card
                {
                    ID: '3',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 502,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '11',
                        ExpYear: '2031',
                        ZIP: '12345',
                        Country: 'US',
                        Last4: '4242',
                        Brand: 'Visa',
                    },
                },
            ],
            500,
            '',
            'subscription'
        );

        expect(methods.getUsedMethods().some((method) => method.type === 'paypal')).toBe(true);
        expect(methods.getUsedMethods().some((method) => method.value === '1')).toBe(true);
        expect(methods.getUsedMethods().filter((method) => method.type === 'card').length).toBe(2);
        expect(methods.getUsedMethods().some((method) => method.value === '2')).toBe(true);
        expect(methods.getUsedMethods().some((method) => method.value === '3')).toBe(true);
    });
});

describe('getAvailablePaymentMethods()', () => {
    it('should return combination of new and used methods', () => {
        const methods = new PaymentMethods(
            status,
            [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
                {
                    ID: '2',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 501,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '12',
                        ExpYear: '2030',
                        ZIP: '12345',
                        Country: 'US',
                        Last4: '1234',
                        Brand: 'Visa',
                    },
                },
                // one more card
                {
                    ID: '3',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 502,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '11',
                        ExpYear: '2031',
                        ZIP: '12345',
                        Country: 'US',
                        Last4: '4242',
                        Brand: 'Visa',
                    },
                },
            ],
            500,
            '',
            'subscription'
        );

        const availableMethods = methods.getAvailablePaymentMethods();

        expect(availableMethods.usedMethods.some((method) => method.type === 'paypal')).toBe(true);
        expect(availableMethods.usedMethods.some((method) => method.value === '1')).toBe(true);
        expect(availableMethods.usedMethods.filter((method) => method.type === 'card').length).toBe(2);
        expect(availableMethods.usedMethods.some((method) => method.value === '2')).toBe(true);
        expect(availableMethods.usedMethods.some((method) => method.value === '3')).toBe(true);

        // if paypal already saved, it can't be a new method too
        expect(availableMethods.methods.some((method) => method.type === 'paypal')).toBe(false);
        expect(availableMethods.methods.some((method) => method.type === 'card')).toBe(true);
    });
});

describe('getLastUsedMethod()', () => {
    it('should return last used method', () => {
        const methods = new PaymentMethods(
            status,
            [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
                {
                    ID: '2',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 501,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '12',
                        ExpYear: '2030',
                        ZIP: '12345',
                        Country: 'US',
                        Last4: '1234',
                        Brand: 'Visa',
                    },
                },
                // one more card
                {
                    ID: '3',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 502,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '11',
                        ExpYear: '2031',
                        ZIP: '12345',
                        Country: 'US',
                        Last4: '4242',
                        Brand: 'Visa',
                    },
                },
            ],
            500,
            '',
            'subscription'
        );

        const lastUsedMethod = methods.getLastUsedMethod();

        expect(lastUsedMethod).toEqual({
            type: PAYMENT_METHOD_TYPES.PAYPAL,
            paymentMethodId: '1',
            value: '1',
            isSaved: true,
            isExpired: false,
        });
    });
});

describe('getSavedMethodById()', () => {
    it('should return the correct saved method by id', () => {
        const methods = new PaymentMethods(
            status,
            [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
                {
                    ID: '2',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 501,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '12',
                        ExpYear: '2030',
                        ZIP: '12345',
                        Country: 'US',
                        Last4: '1234',
                        Brand: 'Visa',
                    },
                },
                // one more card
                {
                    ID: '3',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 502,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '11',
                        ExpYear: '2031',
                        ZIP: '12345',
                        Country: 'US',
                        Last4: '4242',
                        Brand: 'Visa',
                    },
                },
            ],
            500,
            '',
            'subscription'
        );

        const savedMethod = methods.getSavedMethodById('2');

        expect(savedMethod).toEqual({
            ID: '2',
            Type: PAYMENT_METHOD_TYPES.CARD,
            Order: 501,
            Autopay: Autopay.ENABLE,
            Details: {
                Name: 'Arthur Morgan',
                ExpMonth: '12',
                ExpYear: '2030',
                ZIP: '12345',
                Country: 'US',
                Last4: '1234',
                Brand: 'Visa',
            },
        });
    });
});

describe('initializePaymentMethods()', () => {
    it('should correctly initialize payment methods', async () => {
        const apiMock = jest.fn();
        const paymentMethodStatus: PaymentMethodStatus = {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
        };

        const paymentMethods: SavedPaymentMethod[] = [
            {
                ID: '1',
                Type: PAYMENT_METHOD_TYPES.CARD,
                Order: 500,
                Autopay: Autopay.ENABLE,
                Details: {
                    Name: 'Arthur Morgan',
                    ExpMonth: '12',
                    ExpYear: '2030',
                    ZIP: '12345',
                    Country: 'US',
                    Last4: '1234',
                    Brand: 'Visa',
                },
            },
        ];

        apiMock.mockImplementation(({ url }) => {
            if (url === queryPaymentMethods().url) {
                return {
                    PaymentMethods: paymentMethods,
                };
            }

            if (url === queryPaymentMethodStatus().url) {
                return paymentMethodStatus;
            }
        });

        const methods = await initializePaymentMethods(
            apiMock,
            undefined,
            true,
            500,
            'coupon',
            'subscription' as PaymentMethodFlows
        );

        expect(methods).toBeDefined();
        expect(methods.flow).toEqual('subscription');
        expect(methods.amount).toEqual(500);
        expect(methods.coupon).toEqual('coupon');
        expect(methods.getAvailablePaymentMethods().methods.length).toBeGreaterThan(0);
    });

    it('should correctly initialize payment methods when user is not authenticated', async () => {
        const apiMock = jest.fn();

        const paymentMethodStatus: PaymentMethodStatus = {
            Card: true,
            Paypal: true,
            Apple: true,
            Cash: true,
            Bitcoin: true,
        };

        apiMock.mockImplementation(({ url }) => {
            if (url === queryPaymentMethodStatus().url) {
                return paymentMethodStatus;
            }
        });

        const methods = await initializePaymentMethods(
            apiMock,
            undefined,
            false,
            500,
            'coupon',
            'subscription' as PaymentMethodFlows
        );

        expect(methods).toBeDefined();
        expect(methods.flow).toEqual('subscription');
        expect(methods.amount).toEqual(500);
        expect(methods.coupon).toEqual('coupon');
        expect(methods.getAvailablePaymentMethods().methods.length).toBeGreaterThan(0);
    });
});
