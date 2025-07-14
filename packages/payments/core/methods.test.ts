import { ChargebeeEnabled, UNPAID_STATE } from '@proton/shared/lib/interfaces';
import { buildSubscription, buildUser } from '@proton/testing/builders';

import {
    Autopay,
    CYCLE,
    FREE_SUBSCRIPTION,
    MIN_APPLE_PAY_AMOUNT,
    MIN_BITCOIN_AMOUNT,
    MIN_PAYPAL_AMOUNT_CHARGEBEE,
    MethodStorage,
    PAYMENT_METHOD_TYPES,
    PLANS,
    signupFlows,
} from './constants';
import {
    type PaymentMethodFlow,
    type PaymentMethodStatus,
    type PaymentsApi,
    type SavedPaymentMethod,
} from './interface';
import { PaymentMethods, initializePaymentMethods } from './methods';
import { BillingPlatform } from './subscription/constants';

const TEST_CURRENCY = 'USD' as const;

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
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'card')).toBe(true);
    });

    it('should not include card when card is not available', () => {
        status.Card = false;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'card')).toBe(false);
    });

    // tests for PayPal
    it('should include PayPal when PayPal is available', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(true);
    });

    it('should not include PayPal when PayPal is not available due to amount less than minimum', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 50,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(false);
    });

    it('should not include PayPal when already used as payment method', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                    External: MethodStorage.INTERNAL,
                },
            ],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(false);
    });

    it('should include Bitcoin when Bitcoin is available', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });

    it.each(['signup'] as PaymentMethodFlow[])(
        'should not include Bitcoin when Bitcoin is not available due to flow %s',
        (flow) => {
            const methods = new PaymentMethods({
                paymentMethodStatus: status,
                paymentMethods: [],
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: undefined,
                billingPlatform: undefined,
                chargebeeUserExists: undefined,
                billingAddress: undefined,
                enableSepa: true,
            });

            expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
        }
    );

    it('should not include bitcoin due to amount less than minimum', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 50,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it('should include Cash when Cash is available', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(true);
    });

    it.each(['signup', 'signup-pass', 'signup-pass-upgrade', 'signup-wallet'] as PaymentMethodFlow[])(
        'should not include Cash when Cash is not available due to flow %s',
        (flow) => {
            const methods = new PaymentMethods({
                paymentMethodStatus: status,
                paymentMethods: [],
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: undefined,
                billingPlatform: undefined,
                chargebeeUserExists: undefined,
                billingAddress: undefined,
                enableSepa: true,
            });

            expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
        }
    );

    it('should return chargebee methods when they are enabled', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)).toBe(
            true
        );
        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL)).toBe(
            true
        );
    });

    it('should not return chargebee methods when they are disabled', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)).toBe(
            false
        );
        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL)).toBe(
            false
        );
    });
});

describe('getUsedMethods()', () => {
    it('should return used methods: paypal and cards', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                    External: MethodStorage.INTERNAL,
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
                    External: MethodStorage.INTERNAL,
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
                    External: MethodStorage.INTERNAL,
                },
            ],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getUsedMethods().some((method) => method.type === 'paypal')).toBe(true);
        expect(methods.getUsedMethods().some((method) => method.value === '1')).toBe(true);
        expect(methods.getUsedMethods().filter((method) => method.type === 'card').length).toBe(2);
        expect(methods.getUsedMethods().some((method) => method.value === '2')).toBe(true);
        expect(methods.getUsedMethods().some((method) => method.value === '3')).toBe(true);
    });
});

describe('getAvailablePaymentMethods()', () => {
    it('should return combination of new and used methods', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                    External: MethodStorage.INTERNAL,
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
                    External: MethodStorage.INTERNAL,
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
                    External: MethodStorage.INTERNAL,
                },
            ],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

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
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                    External: MethodStorage.INTERNAL,
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
                    External: MethodStorage.INTERNAL,
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
                    External: MethodStorage.INTERNAL,
                },
            ],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        const lastUsedMethod = methods.getLastUsedMethod();

        expect(lastUsedMethod).toEqual({
            type: PAYMENT_METHOD_TYPES.PAYPAL,
            paymentMethodId: '1',
            value: '1',
            isSaved: true,
            isExpired: false,
            isDefault: false,
        });
    });
});

describe('getSavedMethodById()', () => {
    it('should return the correct saved method by id', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                    External: MethodStorage.INTERNAL,
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
                    External: MethodStorage.INTERNAL,
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
                    External: MethodStorage.INTERNAL,
                },
                // external card
                {
                    ID: '4',
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Order: 503,
                    Autopay: Autopay.ENABLE,
                    Details: {
                        Name: 'Arthur Morgan',
                        ExpMonth: '10',
                        ExpYear: '2029',
                        ZIP: '54321',
                        Country: 'US',
                        Last4: '4242',
                        Brand: 'Visa',
                    },
                    External: MethodStorage.EXTERNAL,
                },
            ],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

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
            External: MethodStorage.INTERNAL,
        });

        const externalMethod = methods.getSavedMethodById('4');

        expect(externalMethod).toEqual({
            ID: '4',
            Type: PAYMENT_METHOD_TYPES.CARD,
            Order: 503,
            Autopay: Autopay.ENABLE,
            Details: {
                Name: 'Arthur Morgan',
                ExpMonth: '10',
                ExpYear: '2029',
                ZIP: '54321',
                Country: 'US',
                Last4: '4242',
                Brand: 'Visa',
            },
            External: MethodStorage.EXTERNAL,
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
                External: MethodStorage.INTERNAL,
            },
        ];

        apiMock.mockImplementation(({ url }) => {
            if (url === 'payments/v5/methods') {
                return {
                    PaymentMethods: paymentMethods,
                };
            }

            if (url === 'payments/v4/status') {
                return {
                    VendorStatus: paymentMethodStatus,
                };
            }
            if (url === 'payments/v5/status') {
                return {
                    VendorStatus: paymentMethodStatus,
                };
            }
        });

        const methods = await initializePaymentMethods({
            api: apiMock,
            maybePaymentMethodStatus: undefined,
            maybePaymentMethods: undefined,
            isAuthenticated: true,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: 'coupon',
            flow: 'subscription' as PaymentMethodFlow,
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            paymentsApi: {
                statusExtendedAutomatic: () => paymentMethodStatus,
            } as any as PaymentsApi,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: false,
        });

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
            if (url === 'payments/v4/status') {
                return paymentMethodStatus;
            }
            if (url === 'payments/v5/status') {
                return paymentMethodStatus;
            }
        });

        const methods = await initializePaymentMethods({
            api: apiMock,
            maybePaymentMethodStatus: undefined,
            maybePaymentMethods: undefined,
            isAuthenticated: false,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: 'coupon',
            flow: 'subscription' as PaymentMethodFlow,
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            paymentsApi: {
                statusExtendedAutomatic: () => paymentMethodStatus,
            } as any as PaymentsApi,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: false,
        });

        expect(methods).toBeDefined();
        expect(methods.flow).toEqual('subscription');
        expect(methods.amount).toEqual(500);
        expect(methods.coupon).toEqual('coupon');
        expect(methods.getAvailablePaymentMethods().methods.length).toBeGreaterThan(0);
    });
});

describe('Cash', () => {
    it('should display cash', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(true);
    });

    it('should not display cash if status is false', () => {
        const st = { ...status, Cash: false };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: st,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
    });

    it.each(signupFlows)('should not display cash in signup flows', (flow) => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
    });

    it('should not display cash if user buys Pass Lifetime', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
    });

    it('should display cash if user does not buy Pass Lifetime', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            planIDs: {
                [PLANS.MAIL]: 1, // Using a different plan
            },
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(true);
    });

    it('should not display cash if coupon is present', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: 'coupon',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
    });
});

describe('Chargebee Bitcoin', () => {
    it('should display bitcoin', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should not display bitcoin if status is false', () => {
        const st = { ...status, Bitcoin: false };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: st,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it.each([
        'invoice',
        'signup',
        'signup-v2',
        'signup-v2-upgrade',
        'signup-vpn',
        'add-card',
        'add-paypal',
    ] as PaymentMethodFlow[])('should not display bitcoin in %s flow', (flow) => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should not display bitcoin if amount is less than minimum', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: MIN_BITCOIN_AMOUNT - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it.each([PLANS.MAIL_PRO, PLANS.DRIVE_PRO, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024])(
        'should not display bitcoin for b2b plans',
        (plan) => {
            const flow: PaymentMethodFlow = 'subscription';

            const methods = new PaymentMethods({
                paymentMethodStatus: status,
                paymentMethods: [],
                chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: plan,
                billingPlatform: undefined,
                chargebeeUserExists: undefined,
                billingAddress: undefined,
                enableSepa: true,
            });

            expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
        }
    );

    it('should return false if INHOUSE_FORCED', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should return false in the migration condition', () => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === false
        const flow: PaymentMethodFlow = 'credit';

        const chargebeeUserExists = 0;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should return true for splitted users', () => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === true
        const flow: PaymentMethodFlow = 'credit';

        const chargebeeUserExists = 1;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should disable bitcoin if user buys Pass Lifetime and has positive credit balance', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser({
                Credit: 100,
            }),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should allow using bitcoin if user buys Pass Lifetime and has no credit balance', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should disable bitcoin if user buys pass lifetime in one currency but subscription has another currency', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: 'EUR',
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
            subscription: buildSubscription({
                planName: PLANS.BUNDLE,
                cycle: CYCLE.YEARLY,
                currency: 'USD',
            }),
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should allow using bitcoin if user buys pass lifetime in one currency and subscription has the same currency', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
            subscription: buildSubscription({
                planName: PLANS.BUNDLE,
                cycle: CYCLE.YEARLY,
                currency: TEST_CURRENCY,
            }),
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should allow bitcoin if user has free subscription and buys pass lifetime', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
            subscription: FREE_SUBSCRIPTION,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should allow bitcoin if user has free subscription and buys regular plan', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser(),
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            subscription: FREE_SUBSCRIPTION,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should not display bitcoin if user has unpaid invoices', () => {
        const user = buildUser({
            Delinquent: UNPAID_STATE.AVAILABLE,
        });

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            user,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should display bitcoin if user is not delinquent', () => {
        const user = buildUser({
            Delinquent: UNPAID_STATE.NOT_UNPAID,
        });

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            user,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should display bitcoin if user is delinquent and the flow is credit', () => {
        const flow: PaymentMethodFlow = 'credit';

        const user = buildUser({
            Delinquent: UNPAID_STATE.AVAILABLE,
        });

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });
});

describe('Bitcoin', () => {
    it('should NOT be present when chargebee-bitcoin is available', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it('should be available when INHOUSE_FORCED', () => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });

    it('should return true in the migration condition', () => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === false

        const flow: PaymentMethodFlow = 'credit';

        const chargebeeUserExists = 0;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });

    it('should not display bitcoin if status is false', () => {
        const st = { ...status, Bitcoin: false };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: st,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it.each([
        'invoice',
        'signup',
        'signup-v2',
        'signup-v2-upgrade',
        'signup-vpn',
        'add-card',
        'add-paypal',
    ] as PaymentMethodFlow[])('should not display bitcoin in %s flow', (flow) => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it('should not display bitcoin if amount is less than minimum', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: MIN_BITCOIN_AMOUNT - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it.each([PLANS.MAIL_PRO, PLANS.DRIVE_PRO, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024])(
        'should not display bitcoin for b2b plans',
        (plan) => {
            const flow: PaymentMethodFlow = 'subscription';

            const methods = new PaymentMethods({
                paymentMethodStatus: status,
                paymentMethods: [],
                chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: plan,
                billingPlatform: undefined,
                chargebeeUserExists: undefined,
                billingAddress: undefined,
                enableSepa: true,
            });

            expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
        }
    );

    it('should not display bitcoin if user has unpaid invoices', () => {
        const user = buildUser({
            Delinquent: UNPAID_STATE.AVAILABLE,
        });

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            user,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it('should display bitcoin if user is not delinquent', () => {
        const user = buildUser({
            Delinquent: UNPAID_STATE.NOT_UNPAID,
        });

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            user,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });

    it('should not display bitcoin if user has unpaid invoices', () => {
        const user = buildUser({
            Delinquent: UNPAID_STATE.AVAILABLE,
        });

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            user,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it('should display bitcoin if user is not delinquent', () => {
        const user = buildUser({
            Delinquent: UNPAID_STATE.NOT_UNPAID,
        });

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            user,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });
});

// Mock browser helper functions
jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isSafari: jest.fn(),
    isMobile: jest.fn().mockReturnValue(false),
    getBrowser: jest.fn().mockReturnValue({ name: 'Chrome', version: '90.0.0' }),
    getOS: jest.fn().mockReturnValue({ name: 'macOS', version: '10.15' }),
    isAndroid: jest.fn().mockReturnValue(false),
    isIos: jest.fn().mockReturnValue(false),
    isDesktop: jest.fn().mockReturnValue(true),
    isChromiumBased: jest.fn().mockReturnValue(true),
    isFirefox: jest.fn().mockReturnValue(false),
}));

describe('Apple Pay', () => {
    let mockIsSafari: jest.MockedFunction<() => boolean>;

    beforeEach(() => {
        const { isSafari } = require('@proton/shared/lib/helpers/browser');
        mockIsSafari = isSafari as jest.MockedFunction<() => boolean>;
        mockIsSafari.mockReturnValue(true); // Default to Safari
    });

    afterEach(() => {
        mockIsSafari.mockRestore();
    });

    it('should display Apple Pay when all conditions are met', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: MIN_APPLE_PAY_AMOUNT,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
            enableApplePay: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(true);
    });

    it('should not display Apple Pay when canUseApplePay is false', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: MIN_APPLE_PAY_AMOUNT,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: false,
            enableApplePay: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
    });

    it('should not display Apple Pay when not running in Safari', () => {
        mockIsSafari.mockReturnValue(false);
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: MIN_APPLE_PAY_AMOUNT,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
            enableApplePay: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
    });

    it('should not display Apple Pay when amount is below minimum', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: MIN_APPLE_PAY_AMOUNT - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
            enableApplePay: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
    });

    it.each([
        'signup',
        'signup-pass',
        'signup-pass-upgrade',
        'signup-wallet',
        'signup-v2',
        'signup-v2-upgrade',
        'signup-vpn',
        'subscription',
    ] as PaymentMethodFlow[])('should display Apple Pay for allowed flow %s', (flow) => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: MIN_APPLE_PAY_AMOUNT,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
            enableApplePay: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(true);
    });

    it.each(['credit', 'invoice', 'add-card', 'add-paypal'] as PaymentMethodFlow[])(
        'should not display Apple Pay for disallowed flow %s',
        (flow) => {
            const methods = new PaymentMethods({
                paymentMethodStatus: status,
                paymentMethods: [],
                chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
                amount: MIN_APPLE_PAY_AMOUNT,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: undefined,
                billingPlatform: undefined,
                chargebeeUserExists: undefined,
                billingAddress: undefined,
                enableSepa: true,
                canUseApplePay: true,
                enableApplePay: true,
            });

            expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(
                false
            );
        }
    );

    it('should display Apple Pay with Chargebee enabled', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: MIN_APPLE_PAY_AMOUNT,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
            enableApplePay: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(true);
    });

    it('should not display Apple Pay when canUseApplePay is undefined (defaults to false)', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: MIN_APPLE_PAY_AMOUNT,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            enableApplePay: true,
            // canUseApplePay: undefined - testing default behavior
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
    });

    it('should display Apple Pay even with high amount', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: MIN_APPLE_PAY_AMOUNT * 10, // Much higher than minimum
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
            enableApplePay: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(true);
    });
});

describe('Chargebee card', () => {
    it('should display chargebee card', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(true);
    });

    it('should disable CB card if INHOUSE_FORCED', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(false);
        expect(methods.getNewMethods().some((method) => method.type === 'card')).toBe(true);
    });

    it.each(['credit', 'add-card'])('should disable CB card for on-session migration users', (flow) => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === false

        const chargebeeUserExists = 0;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow as PaymentMethodFlow,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(false);
        expect(methods.getNewMethods().some((method) => method.type === 'card')).toBe(true);
    });

    it.each(['credit', 'add-card'])('should enable CB card for splitted users', (flow) => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === true

        const chargebeeUserExists = 1;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow as PaymentMethodFlow,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(true);
        expect(methods.getNewMethods().some((method) => method.type === 'card')).toBe(false);
    });

    it('should not display chargebee card if status is false', () => {
        const st = { ...status, Card: false };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: st,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(false);
    });

    it('should display the chargebee card if CHARGEBEE_FORCED even if flow is not supported', () => {
        const flow: PaymentMethodFlow = 'invoice';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(true);
    });

    it('should display the chargebee card if CHARGEBEE_FORCED even if disabled for B2B', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(true);
    });
});

describe('Chargebee PayPal', () => {
    it('should display chargebee paypal', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });

    it('should disable CB paypal if INHOUSE_FORCED', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(false);
        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(true);
    });

    it('should disable CB paypal for on-session migration users', () => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === false

        const flow = 'credit';

        const chargebeeUserExists = 0;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow as PaymentMethodFlow,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(false);
        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(true);
    });

    it.each(['credit', 'add-paypal'])('should enable CB paypal for splitted users', (flow) => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === true

        const chargebeeUserExists = 1;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow as PaymentMethodFlow,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(true);
        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(false);
    });

    it('should not render paypal if there is already one saved', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [
                {
                    ID: '123',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
            ],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Chargebee,
            chargebeeUserExists: 1,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should disable paypal if the amount is too low', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: MIN_PAYPAL_AMOUNT_CHARGEBEE - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should enable paypal for unpaid invoice even if the amount is too low', () => {
        const flow: PaymentMethodFlow = 'invoice';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: MIN_PAYPAL_AMOUNT_CHARGEBEE - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });

    it('should disable paypal if status is false', () => {
        const st = { ...status, Paypal: false };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: st,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });
});

describe('SEPA', () => {
    it('should not display SEPA for inhouse forced users', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should display SEPA', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(true);
    });

    it.each([
        'signup-pass',
        'signup',
        'signup-v2',
        'signup-pass-upgrade',
        'signup-v2-upgrade',
        'signup-vpn',
        'signup-wallet',
    ] as PaymentMethodFlow[])('should offer SEPA for %s flow', (flow) => {
        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(true);
    });

    it('should not offer SEPA if the country is not supported', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: { CountryCode: 'US' },
            enableSepa: true,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not display SEPA if feature is disabled', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const enableSepaFalse = false;

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: enableSepaFalse,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not display SEPA if B2C plan is selected', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not display SEPA if no plan is selected', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = new PaymentMethods({
            paymentMethodStatus: status,
            paymentMethods: [],
            chargebeeEnabled: ChargebeeEnabled.CHARGEBEE_FORCED,
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });
});
