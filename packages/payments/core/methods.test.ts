import { MIN_BITCOIN_AMOUNT, MIN_PAYPAL_AMOUNT_CHARGEBEE, UNPAID_STATE } from '@proton/payments';
import { queryPaymentMethods } from '@proton/shared/lib/api/payments';
import { BillingPlatform, ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { buildSubscription, buildUser } from '@proton/testing/builders';

import { Autopay, FREE_SUBSCRIPTION, MethodStorage, PAYMENT_METHOD_TYPES, PLANS, signupFlows } from './constants';
import {
    type PaymentMethodFlows,
    type PaymentMethodStatus,
    type PaymentsApi,
    type SavedPaymentMethod,
} from './interface';
import { PaymentMethods, initializePaymentMethods } from './methods';

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

const undefinedBillingAddress = undefined;
const enableSepaTrue = true;

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });

    it.each(['signup'] as PaymentMethodFlows[])(
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
                disableNewPaymentMethods: false,
                billingAddress: undefinedBillingAddress,
                enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(true);
    });

    it.each(['signup', 'signup-pass', 'signup-pass-upgrade'] as PaymentMethodFlows[])(
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
                disableNewPaymentMethods: false,
                billingAddress: undefinedBillingAddress,
                enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            if (url === queryPaymentMethods().url) {
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
            flow: 'subscription' as PaymentMethodFlows,
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            paymentsApi: {
                statusExtendedAutomatic: () => paymentMethodStatus,
            } as any as PaymentsApi,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            disableNewPaymentMethods: false,
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
            flow: 'subscription' as PaymentMethodFlows,
            chargebeeEnabled: ChargebeeEnabled.INHOUSE_FORCED,
            paymentsApi: {
                statusExtendedAutomatic: () => paymentMethodStatus,
            } as any as PaymentsApi,
            selectedPlanName: undefined,
            billingPlatform: undefined,
            chargebeeUserExists: undefined,
            disableNewPaymentMethods: false,
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
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(true);
    });

    it('should not display cash if status is false', () => {
        const st = { ...status, Cash: false };
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
    });

    it('should not display cash if user buys Pass Lifetime', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(false);
    });

    it('should display cash if user does not buy Pass Lifetime', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
            planIDs: {
                [PLANS.MAIL]: 1, // Using a different plan
            },
        });

        expect(methods.getNewMethods().some((method) => method.type === 'cash')).toBe(true);
    });
});

describe('Chargebee Bitcoin', () => {
    it('should display bitcoin', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should not display bitcoin if status is false', () => {
        const st = { ...status, Bitcoin: false };
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
    ] as PaymentMethodFlows[])('should not display bitcoin in %s flow', (flow) => {
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should not display bitcoin if amount is less than minimum', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it.each([PLANS.MAIL_PRO, PLANS.DRIVE_PRO, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024])(
        'should not display bitcoin for b2b plans',
        (plan) => {
            const flow: PaymentMethodFlows = 'subscription';

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
                disableNewPaymentMethods: false,
                billingAddress: undefinedBillingAddress,
                enableSepa: enableSepaTrue,
            });

            expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
        }
    );

    it('should return false if INHOUSE_FORCED', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should return false in the migration condition', () => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === false
        const flow: PaymentMethodFlows = 'credit';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should return true for splitted users', () => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === true
        const flow: PaymentMethodFlows = 'credit';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should disable bitcoin if user buys Pass Lifetime and has positive credit balance', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should disable bitcoin if user buys pass lifetime in one currency but subscription has another currency', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
            subscription: buildSubscription({
                Currency: 'USD',
            }),
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should allow using bitcoin if user buys pass lifetime in one currency and subscription has the same currency', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
            subscription: buildSubscription({
                Currency: TEST_CURRENCY,
            }),
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should allow bitcoin if user has free subscription and buys pass lifetime', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
            subscription: FREE_SUBSCRIPTION,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should allow bitcoin if user has free subscription and buys regular plan', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });

    it('should return true in the migration condition', () => {
        // chargebeeEnabled === CHARGEBEE_FORCED, BillingPlatform.Proton, chargebeeUserExists === false

        const flow: PaymentMethodFlows = 'credit';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });

    it('should not display bitcoin if status is false', () => {
        const st = { ...status, Bitcoin: false };
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
    ] as PaymentMethodFlows[])('should not display bitcoin in %s flow', (flow) => {
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it('should not display bitcoin if amount is less than minimum', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(false);
    });

    it.each([PLANS.MAIL_PRO, PLANS.DRIVE_PRO, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024])(
        'should not display bitcoin for b2b plans',
        (plan) => {
            const flow: PaymentMethodFlows = 'subscription';

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
                disableNewPaymentMethods: false,
                billingAddress: undefinedBillingAddress,
                enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'bitcoin')).toBe(true);
    });
});

describe('Chargebee card', () => {
    it('should display chargebee card', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(true);
    });

    it('should disable CB card if INHOUSE_FORCED', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            flow: flow as PaymentMethodFlows,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            flow: flow as PaymentMethodFlows,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(true);
        expect(methods.getNewMethods().some((method) => method.type === 'card')).toBe(false);
    });

    it('should not display chargebee card if status is false', () => {
        const st = { ...status, Card: false };
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(false);
    });

    it('should display the chargebee card if CHARGEBEE_FORCED even if flow is not supported', () => {
        const flow: PaymentMethodFlows = 'invoice';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(true);
    });

    it('should display the chargebee card if CHARGEBEE_FORCED even if disabled for B2B', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-card')).toBe(true);
    });
});

describe('Chargebee PayPal', () => {
    it('should display chargebee paypal', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });

    it('should disable CB paypal if INHOUSE_FORCED', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            flow: flow as PaymentMethodFlows,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
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
            flow: flow as PaymentMethodFlows,
            selectedPlanName: undefined,
            billingPlatform: BillingPlatform.Proton,
            chargebeeUserExists: chargebeeUserExists,
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(true);
        expect(methods.getNewMethods().some((method) => method.type === 'paypal')).toBe(false);
    });

    it('should not render paypal if there is already one saved', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should disable paypal if the amount is too low', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should enable paypal for unpaid invoice even if the amount is too low', () => {
        const flow: PaymentMethodFlows = 'invoice';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });

    it('should disable paypal if status is false', () => {
        const st = { ...status, Paypal: false };
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: undefinedBillingAddress,
            enableSepa: enableSepaTrue,
        });

        expect(methods.getNewMethods().some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });
});

it('should not have new payment methods if they are disabled', () => {
    const flow: PaymentMethodFlows = 'invoice';

    const disableNewPaymentMethods = true;

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
        disableNewPaymentMethods: disableNewPaymentMethods,
        billingAddress: undefinedBillingAddress,
        enableSepa: enableSepaTrue,
    });

    expect(methods.getNewMethods().length).toBe(0);
});

describe('SEPA', () => {
    it('should not display SEPA for inhouse forced users', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: enableSepaTrue,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should display SEPA', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: enableSepaTrue,
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
    ] as PaymentMethodFlows[])('should not offer SEPA for %s flow', (flow) => {
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
            disableNewPaymentMethods: false,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: enableSepaTrue,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not offer SEPA if the country is not supported', () => {
        const flow: PaymentMethodFlows = 'subscription';

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
            disableNewPaymentMethods: false,
            billingAddress: { CountryCode: 'US' },
            enableSepa: enableSepaTrue,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not display SEPA if feature is disabled', () => {
        const flow: PaymentMethodFlows = 'subscription';

        const enableSepaFalse = false;

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
            disableNewPaymentMethods: false,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: enableSepaFalse,
        });

        expect(
            methods.getNewMethods().some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });
});
