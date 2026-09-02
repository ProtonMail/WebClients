import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { UNPAID_STATE } from '@proton/shared/lib/interfaces';
import { buildUser } from '@proton/testing/builders/user';

import {
    getMinApplePayAmount,
    getMinBitcoinAmount,
    getMinGooglePayAmount,
    getMinPaypalAmountChargebee,
} from '../amount-limits';
import {
    Autopay,
    COUPON_CODES,
    CYCLE,
    DEFAULT_PAYMENT_VENDOR_STATES,
    FREE_SUBSCRIPTION,
    PAYMENT_METHOD_TYPES,
    PLANS,
    signupFlows,
} from '../constants';
import type {
    Currency,
    PaymentMethodFlow,
    PaymentStatus,
    PlainPaymentMethodType,
    SavedPaymentMethod,
} from '../interface';
import type { PaymentMethodsContext } from './paymentMethodAvailability';
import { getNewMethods, getUsedMethods, isMethodTypeEnabled } from './paymentMethodAvailability';

const TEST_CURRENCY = 'USD' as const;

let status: PaymentStatus;

beforeEach(() => {
    status = {
        CountryCode: 'CH',
        VendorStates: { ...DEFAULT_PAYMENT_VENDOR_STATES },
    };
});

const buildContext = (context: PaymentMethodsContext) => context;

/**
 * Adding a value to PaymentMethodFlow breaks compilation here until it's classified in every flow matrix below.
 */
const ALL_FLOWS = Object.keys({
    invoice: true,
    signup: true,
    'signup-pass': true,
    'signup-pass-upgrade': true,
    'signup-wallet': true,
    'signup-v2': true,
    'signup-v2-upgrade': true,
    'signup-vpn': true,
    credit: true,
    subscription: true,
    'add-card': true,
    'add-paypal': true,
    'reservation-donation': true,
} satisfies Record<PaymentMethodFlow, true>) as PaymentMethodFlow[];

const ALL_METHOD_TYPES: PlainPaymentMethodType[] = Object.values(PAYMENT_METHOD_TYPES);

const SEPA_COUNTRIES = [
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
    'IS',
    'LI',
    'NO',
    'CH',
    'GB',
    'AD',
    'MC',
    'SM',
    'VA',
] as const;

const buildMethods = (overrides: Partial<PaymentMethodsContext> = {}) =>
    buildContext({
        paymentStatus: status,
        paymentMethods: [],
        amount: 500,
        currency: TEST_CURRENCY,
        coupon: '',
        flow: 'subscription',
        selectedPlanName: undefined,
        billingAddress: undefined,
        enableSepa: true,
        ...overrides,
    });

/** Every method is available under these params, so a single overridden field is the only reason for exclusion. */
const permissive: Partial<PaymentMethodsContext> = {
    amount: 100_000,
    canUseApplePay: true,
    canUseGooglePay: true,
    enableSepa: true,
    enableSepaB2C: true,
    billingAddress: { CountryCode: 'CH', State: '' },
    enablePaypalRegionalCurrenciesBatch3: true,
    enablePaypalKrw: true,
};

const newTypes = (overrides: Partial<PaymentMethodsContext> = {}) =>
    getNewMethods(buildMethods(overrides)).map(({ type }) => type as PlainPaymentMethodType);

const hasNewMethod = (type: PlainPaymentMethodType, overrides: Partial<PaymentMethodsContext> = {}) =>
    newTypes(overrides).includes(type);

describe('getNewMethods()', () => {
    it('should include card when card is available', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-card')).toBe(true);
    });

    it('should not include card when card is not available', () => {
        status.VendorStates.Card = false;

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-card')).toBe(false);
    });

    // tests for PayPal
    it('should include PayPal when PayPal is available', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });

    it('should not include PayPal when PayPal is not available due to amount less than minimum', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 50,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should not include PayPal when already used as payment method', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
            ],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should include Bitcoin when Bitcoin is available', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it.each(['signup'] as PaymentMethodFlow[])(
        'should not include Bitcoin when Bitcoin is not available due to flow %s',
        (flow) => {
            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: undefined,
                billingAddress: undefined,
                enableSepa: true,
            });

            expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
        }
    );

    it('should not include bitcoin due to amount less than minimum', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 50,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should include Cash when Cash is available', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'cash')).toBe(true);
    });

    it.each(['signup', 'signup-pass', 'signup-pass-upgrade', 'signup-wallet'] as PaymentMethodFlow[])(
        'should not include Cash when Cash is not available due to flow %s',
        (flow) => {
            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: undefined,
                billingAddress: undefined,
                enableSepa: true,
            });

            expect(getNewMethods(methods).some((method) => method.type === 'cash')).toBe(false);
        }
    );

    it('should return chargebee methods when they are enabled', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)).toBe(true);
        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL)).toBe(
            true
        );
    });
});

describe('getUsedMethods()', () => {
    it('should return used methods: paypal and cards', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
                {
                    ID: '2',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getUsedMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(true);
        expect(getUsedMethods(methods).some((method) => method.value === '1')).toBe(true);
        expect(getUsedMethods(methods).filter((method) => method.type === 'chargebee-card').length).toBe(2);
        expect(getUsedMethods(methods).some((method) => method.value === '2')).toBe(true);
        expect(getUsedMethods(methods).some((method) => method.value === '3')).toBe(true);
    });
});

describe('getUsedMethods() and getNewMethods() combined', () => {
    it('should not offer a new method that is already saved', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
                {
                    ID: '2',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        const usedMethods = getUsedMethods(methods);
        const newMethods = getNewMethods(methods);

        expect(usedMethods.some((method) => method.type === 'chargebee-paypal')).toBe(true);
        expect(usedMethods.some((method) => method.value === '1')).toBe(true);
        expect(usedMethods.filter((method) => method.type === 'chargebee-card').length).toBe(2);
        expect(usedMethods.some((method) => method.value === '2')).toBe(true);
        expect(usedMethods.some((method) => method.value === '3')).toBe(true);

        // if paypal already saved, it can't be a new method too
        expect(newMethods.some((method) => method.type === 'chargebee-paypal')).toBe(false);
        expect(newMethods.some((method) => method.type === 'chargebee-card')).toBe(true);
    });
});

describe('getUsedMethods() ordering', () => {
    it('should return the saved methods in their original order', () => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [
                {
                    ID: '1',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
                {
                    ID: '2',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
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
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getUsedMethods(methods).map(({ value }) => value)).toEqual(['1', '2', '3']);
        expect(getUsedMethods(methods)[0]).toEqual({
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            paymentMethodId: '1',
            value: '1',
            isSaved: true,
            isExpired: false,
            isDefault: false,
        });
    });
});

describe('Cash', () => {
    it('should display cash', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'cash')).toBe(true);
    });

    it('should not display cash if status is false', () => {
        const st = { ...status, VendorStates: { ...status.VendorStates, Cash: false } };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: st,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'cash')).toBe(false);
    });

    it.each(signupFlows)('should not display cash in signup flows', (flow) => {
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'cash')).toBe(false);
    });

    it('should display cash if user does not buy Pass Lifetime', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            planIDs: {
                [PLANS.MAIL]: 1, // Using a different plan
            },
        });

        expect(getNewMethods(methods).some((method) => method.type === 'cash')).toBe(true);
    });

    it('should not display cash if coupon is present', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: 'coupon',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'cash')).toBe(false);
    });
});

describe('Chargebee Bitcoin', () => {
    it('should display bitcoin', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should not display bitcoin if status is false', () => {
        const st = { ...status, VendorStates: { ...status.VendorStates, Bitcoin: false } };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: st,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
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
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should not display bitcoin if amount is less than minimum', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinBitcoinAmount(TEST_CURRENCY) - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it.each([PLANS.MAIL_PRO, PLANS.DRIVE_PRO, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024])(
        'should not display bitcoin for b2b plans',
        (plan) => {
            const flow: PaymentMethodFlow = 'subscription';

            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: plan,
                billingAddress: undefined,
                enableSepa: true,
            });

            expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
        }
    );

    it('should disable bitcoin if user buys Pass Lifetime and has positive credit balance', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser({
                Credit: 100,
            }),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should allow using bitcoin if user buys Pass Lifetime and has no credit balance', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should disable bitcoin if user buys pass lifetime in one currency but subscription has another currency', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: 'EUR',
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
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

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should allow using bitcoin if user buys pass lifetime in one currency and subscription has the same currency', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
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

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should allow bitcoin if user has free subscription and buys pass lifetime', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser(),
            planIDs: {
                [PLANS.PASS_LIFETIME]: 1,
            },
            subscription: FREE_SUBSCRIPTION,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should allow bitcoin if user has free subscription and buys regular plan', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user: buildUser(),
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            subscription: FREE_SUBSCRIPTION,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
    });

    it('should not display bitcoin if user has unpaid invoices', () => {
        const user = buildUser({
            Delinquent: UNPAID_STATE.AVAILABLE,
        });

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: 'subscription',
            user,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(false);
    });

    it('should display bitcoin if user is delinquent and the flow is credit', () => {
        const flow: PaymentMethodFlow = 'credit';

        const user = buildUser({
            Delinquent: UNPAID_STATE.AVAILABLE,
        });

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            user,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-bitcoin')).toBe(true);
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

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinApplePayAmount(TEST_CURRENCY),
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(true);
    });

    it('should not display Apple Pay when canUseApplePay is false', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinApplePayAmount(TEST_CURRENCY),
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: false,
        });

        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
    });

    it('should not display Apple Pay when amount is below minimum', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinApplePayAmount(TEST_CURRENCY) - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
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
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinApplePayAmount(TEST_CURRENCY),
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(true);
    });

    it.each(['credit', 'invoice', 'add-card', 'add-paypal'] as PaymentMethodFlow[])(
        'should not display Apple Pay for disallowed flow %s',
        (flow) => {
            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: getMinApplePayAmount(TEST_CURRENCY),
                currency: TEST_CURRENCY,
                coupon: '',
                flow: flow,
                selectedPlanName: undefined,
                billingAddress: undefined,
                enableSepa: true,
                canUseApplePay: true,
            });

            expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
        }
    );

    it('should display Apple Pay with Chargebee enabled', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinApplePayAmount(TEST_CURRENCY),
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(true);
    });

    it('should not display Apple Pay when canUseApplePay is undefined (defaults to false)', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinApplePayAmount(TEST_CURRENCY),
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,

            // canUseApplePay: undefined - testing default behavior
        });

        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
    });

    it('should display Apple Pay even with high amount', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinApplePayAmount(TEST_CURRENCY) * 10, // Much higher than minimum
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            canUseApplePay: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(true);
    });
});

describe('Chargebee card', () => {
    it('should display chargebee card', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-card')).toBe(true);
    });

    it('should not display chargebee card if status is false', () => {
        const st = { ...status, VendorStates: { ...status.VendorStates, Card: false } };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: st,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-card')).toBe(false);
    });

    it('should display the chargebee card if CHARGEBEE_FORCED even if flow is not supported', () => {
        const flow: PaymentMethodFlow = 'invoice';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-card')).toBe(true);
    });

    it('should display the chargebee card if CHARGEBEE_FORCED even if disabled for B2B', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-card')).toBe(true);
    });
});

describe('Chargebee PayPal', () => {
    it('should display chargebee paypal', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });

    it('should not render paypal if there is already one saved', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [
                {
                    ID: '123',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                    Order: 500,
                    Details: {
                        BillingAgreementID: 'BA-123',
                        PayerID: '123',
                        Payer: '123',
                    },
                },
            ],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should disable paypal if the amount is too low', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinPaypalAmountChargebee(TEST_CURRENCY) - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should enable paypal for unpaid invoice even if the amount is too low', () => {
        const flow: PaymentMethodFlow = 'invoice';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: getMinPaypalAmountChargebee(TEST_CURRENCY) - 1,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });

    it('should disable paypal if status is false', () => {
        const st = { ...status, VendorStates: { ...status.VendorStates, Paypal: false } };
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: st,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should disable paypal for KRW currency when enablePaypalKrw is false', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500000,
            currency: 'KRW',
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            enablePaypalKrw: false,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(false);
    });

    it('should enable paypal for KRW currency when enablePaypalKrw is true', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500000,
            currency: 'KRW',
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            enablePaypalKrw: true,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });

    it('should not affect non-KRW currencies when enablePaypalKrw is false', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: 'EUR',
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: undefined,
            enableSepa: true,
            enablePaypalKrw: false,
        });

        expect(getNewMethods(methods).some((method) => method.type === 'chargebee-paypal')).toBe(true);
    });
});

describe('Trial mode payment method restrictions', () => {
    describe('when isTrial is true', () => {
        it('should only display Chargebee Card payment method', () => {
            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: 'subscription',
                selectedPlanName: undefined,
                billingAddress: { CountryCode: 'CH', State: '' },
                enableSepa: true,
                enableSepaB2C: true,
                canUseApplePay: true,
                isTrial: true,
            });

            const newMethods = getNewMethods(methods);
            const methodTypes = newMethods.map((method) => method.type);

            // Only Chargebee Card should be available
            expect(methodTypes).toEqual([PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]);
            expect(newMethods.some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)).toBe(true);
        });

        it('should not display Cash when isTrial is true', () => {
            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: 'subscription',
                selectedPlanName: undefined,
                billingAddress: undefined,
                enableSepa: true,
                isTrial: true,
            });

            expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CASH)).toBe(false);
        });

        it('should not display SEPA Direct Debit when isTrial is true', () => {
            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: 'subscription',
                selectedPlanName: PLANS.MAIL_PRO,
                billingAddress: { CountryCode: 'CH', State: '' },
                enableSepa: true,
                isTrial: true,
            });

            expect(
                getNewMethods(methods).some(
                    (method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
                )
            ).toBe(false);
        });

        it('should not display Bitcoin when isTrial is true', () => {
            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: 'subscription',
                selectedPlanName: undefined,
                billingAddress: undefined,
                enableSepa: true,
                isTrial: true,
            });

            expect(
                getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN)
            ).toBe(false);
        });

        it('should not display PayPal when isTrial is true', () => {
            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: 500,
                currency: TEST_CURRENCY,
                coupon: '',
                flow: 'subscription',
                selectedPlanName: undefined,
                billingAddress: undefined,
                enableSepa: true,
                isTrial: true,
            });

            expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL)).toBe(
                false
            );
        });

        it('should not display Apple Pay when isTrial is true', () => {
            const { isSafari } = require('@proton/shared/lib/helpers/browser');
            const mockIsSafari = isSafari as jest.MockedFunction<() => boolean>;
            mockIsSafari.mockReturnValue(true);

            const methods = buildContext({
                paymentStatus: status,
                paymentMethods: [],
                amount: getMinApplePayAmount(TEST_CURRENCY),
                currency: TEST_CURRENCY,
                coupon: '',
                flow: 'subscription',
                selectedPlanName: undefined,
                billingAddress: undefined,
                enableSepa: true,
                canUseApplePay: true,
                isTrial: true,
            });

            expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.APPLE_PAY)).toBe(false);
        });
    });
});

describe('SEPA', () => {
    it('should display SEPA', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
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
        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(true);
    });

    it('should not offer SEPA if the country is not supported', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingAddress: { CountryCode: 'US' },
            enableSepa: true,
        });

        expect(
            getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not display SEPA if feature is disabled', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const enableSepaFalse = false;

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL_PRO,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: enableSepaFalse,
        });

        expect(
            getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not display SEPA if B2C plan is selected', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: PLANS.MAIL,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not display SEPA if no plan is selected', () => {
        const flow: PaymentMethodFlow = 'subscription';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow: flow,
            selectedPlanName: undefined,
            billingAddress: { CountryCode: 'CH' },
            enableSepa: true,
        });

        expect(
            getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should not include SEPA when in trial mode', () => {
        const flow: PaymentMethodFlow = 'signup-v2';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow,
            selectedPlanName: PLANS.BUNDLE_PRO_2024,
            billingAddress: { CountryCode: 'DE', State: '' },
            enableSepa: true,
            enableSepaB2C: true,
            isTrial: true,
        });

        expect(
            getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(false);
    });

    it('should include SEPA when not in trial mode', () => {
        const flow: PaymentMethodFlow = 'signup-v2';

        const methods = buildContext({
            paymentStatus: status,
            paymentMethods: [],
            amount: 500,
            currency: TEST_CURRENCY,
            coupon: '',
            flow,
            selectedPlanName: PLANS.BUNDLE_PRO_2024,
            billingAddress: { CountryCode: 'DE', State: '' },
            enableSepa: true,
            enableSepaB2C: true,
            isTrial: false,
        });

        expect(
            getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)
        ).toBe(true);
    });
});

it('should not display Google Pay when in trial mode', () => {
    const flow: PaymentMethodFlow = 'signup-v2';

    const methods = buildContext({
        paymentStatus: status,
        paymentMethods: [],
        amount: 500,
        currency: TEST_CURRENCY,
        coupon: '',
        flow,
        selectedPlanName: PLANS.BUNDLE_PRO_2024,
        billingAddress: { CountryCode: 'DE', State: '' },
        enableSepa: true,
        isTrial: true,
    });

    expect(getNewMethods(methods).some((method) => method.type === PAYMENT_METHOD_TYPES.GOOGLE_PAY)).toBe(false);
});

describe('isMethodTypeEnabled()', () => {
    const offerableTypes: PlainPaymentMethodType[] = [
        PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
        PAYMENT_METHOD_TYPES.CASH,
        PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        PAYMENT_METHOD_TYPES.APPLE_PAY,
        PAYMENT_METHOD_TYPES.GOOGLE_PAY,
    ];

    it.each(ALL_METHOD_TYPES)('should report availability of %s', (type) => {
        expect(isMethodTypeEnabled(buildMethods(permissive), type)).toBe(offerableTypes.includes(type));
    });

    // SEPA direct debit is the only method that is not gated by a vendor state
    const vendorGatedTypes = offerableTypes.filter((type) => type !== PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT);

    it.each(vendorGatedTypes)('should report %s as disabled when all vendor states are off', (type) => {
        const vendorStates = {
            Card: false,
            Paypal: false,
            Apple: false,
            Cash: false,
            Bitcoin: false,
            Google: false,
            Ideal: false,
        };

        const context = buildMethods({ ...permissive, paymentStatus: { ...status, VendorStates: vendorStates } });

        expect(isMethodTypeEnabled(context, type)).toBe(false);
    });

    it.each(ALL_METHOD_TYPES)('should agree with getNewMethods for %s', (type) => {
        expect(isMethodTypeEnabled(buildMethods(permissive), type)).toBe(hasNewMethod(type, permissive));
    });
});

describe('getUsedMethods() saved method types', () => {
    const cardDetails = {
        Name: 'Arthur Morgan',
        ExpMonth: '12',
        ExpYear: '2030',
        ZIP: '12345',
        Country: 'US',
        Last4: '1234',
        Brand: 'Visa',
    };

    const savedMethod = (Type: PlainPaymentMethodType, extra: Record<string, unknown> = {}) =>
        ({ ID: Type, Type, Order: 500, Details: cardDetails, ...extra }) as unknown as SavedPaymentMethod;

    const savableTypes: PlainPaymentMethodType[] = [
        PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
        PAYMENT_METHOD_TYPES.APPLE_PAY,
        PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
    ];

    it.each(ALL_METHOD_TYPES)('should keep a saved %s only if it is a savable type', (Type) => {
        const usedMethods = getUsedMethods(buildMethods({ paymentMethods: [savedMethod(Type)] }));

        expect(usedMethods.map(({ type }) => type)).toEqual(savableTypes.includes(Type) ? [Type] : []);
    });

    it.each([
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, 'Card'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, 'Paypal'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, 'Card'],
        [PAYMENT_METHOD_TYPES.APPLE_PAY, 'Apple'],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, 'Google'],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, 'Ideal'],
    ] as [PlainPaymentMethodType, keyof PaymentStatus['VendorStates']][])(
        'should drop a saved %s when the %s vendor state is off',
        (Type, vendor) => {
            const paymentStatus = { ...status, VendorStates: { ...status.VendorStates, [vendor]: false } };

            expect(getUsedMethods(buildMethods({ paymentStatus, paymentMethods: [savedMethod(Type)] }))).toEqual([]);
        }
    );

    it.each(ALL_FLOWS)('should keep a saved SEPA direct debit in flow %s only if the flow supports it', (flow) => {
        const supportedFlows: PaymentMethodFlow[] = [
            'signup',
            'signup-pass',
            'signup-pass-upgrade',
            'signup-wallet',
            'signup-v2',
            'signup-v2-upgrade',
            'signup-vpn',
            'subscription',
        ];

        const usedMethods = getUsedMethods(
            buildMethods({ flow, paymentMethods: [savedMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)] })
        );

        expect(usedMethods.length).toBe(supportedFlows.includes(flow) ? 1 : 0);
    });

    it('should return an empty list when every vendor state is off', () => {
        const vendorStates = {
            Card: false,
            Paypal: false,
            Apple: false,
            Cash: false,
            Bitcoin: false,
            Google: false,
            Ideal: false,
        };

        const context = buildMethods({
            paymentStatus: { ...status, VendorStates: vendorStates },
            paymentMethods: savableTypes.map((type) => savedMethod(type)),
        });

        expect(getUsedMethods(context)).toEqual([]);
    });

    it('should mark an expired card as expired and a fresh card as not expired', () => {
        const paymentMethods = [
            savedMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, {
                ID: 'expired',
                Details: { ...cardDetails, ExpMonth: '01', ExpYear: '2020' },
            }),
            savedMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, { ID: 'fresh' }),
        ];

        expect(
            getUsedMethods(buildMethods({ paymentMethods })).map(({ value, isExpired }) => ({ value, isExpired }))
        ).toEqual([
            { value: 'expired', isExpired: true },
            { value: 'fresh', isExpired: false },
        ]);
    });

    it('should never mark a non-card method as expired', () => {
        const paymentMethods = [
            savedMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, { Details: { ExpMonth: '01', ExpYear: '2020' } }),
        ];

        expect(getUsedMethods(buildMethods({ paymentMethods }))[0].isExpired).toBe(false);
    });

    it('should default isDefault to false when IsDefault is absent and preserve the input order', () => {
        const paymentMethods = [
            savedMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, { ID: 'first' }),
            savedMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, { ID: 'second', IsDefault: true }),
        ];

        expect(getUsedMethods(buildMethods({ paymentMethods }))).toEqual([
            {
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                paymentMethodId: 'first',
                value: 'first',
                isSaved: true,
                isExpired: false,
                isDefault: false,
            },
            {
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                paymentMethodId: 'second',
                value: 'second',
                isSaved: true,
                isExpired: false,
                isDefault: true,
            },
        ]);
    });

    it('should return an empty list when there are no saved methods', () => {
        expect(getUsedMethods(buildMethods({ paymentMethods: [] }))).toEqual([]);
    });
});

describe('availability per flow', () => {
    const allowedFlowsByMethod: Record<string, PaymentMethodFlow[]> = {
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: ALL_FLOWS,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: ALL_FLOWS,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: [
            'signup-pass',
            'signup-pass-upgrade',
            'signup-wallet',
            'credit',
            'subscription',
        ],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: [
            'signup',
            'signup-pass',
            'signup-pass-upgrade',
            'signup-wallet',
            'signup-v2',
            'signup-v2-upgrade',
            'signup-vpn',
            'subscription',
        ],
        [PAYMENT_METHOD_TYPES.CASH]: ALL_FLOWS.filter((flow) => !signupFlows.includes(flow)),
        [PAYMENT_METHOD_TYPES.APPLE_PAY]: [
            'signup',
            'signup-pass',
            'signup-pass-upgrade',
            'signup-wallet',
            'signup-v2',
            'signup-v2-upgrade',
            'signup-vpn',
            'subscription',
        ],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: [
            'signup',
            'signup-pass',
            'signup-pass-upgrade',
            'signup-wallet',
            'signup-v2',
            'signup-v2-upgrade',
            'signup-vpn',
            'subscription',
            'reservation-donation',
        ],
    };

    describe.each(Object.entries(allowedFlowsByMethod))('%s', (type, allowedFlows) => {
        it.each(ALL_FLOWS)('flow %s', (flow) => {
            expect(hasNewMethod(type as PlainPaymentMethodType, { ...permissive, flow })).toBe(
                allowedFlows.includes(flow)
            );
        });
    });

    it('should offer every method at once when nothing restricts them', () => {
        expect(newTypes(permissive)).toEqual([
            PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
            PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            PAYMENT_METHOD_TYPES.CASH,
            PAYMENT_METHOD_TYPES.APPLE_PAY,
            PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        ]);
    });
});

describe('minimum amounts per currency', () => {
    const minimums: [PlainPaymentMethodType, (currency: Currency) => number][] = [
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, getMinBitcoinAmount],
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, getMinPaypalAmountChargebee],
        [PAYMENT_METHOD_TYPES.APPLE_PAY, getMinApplePayAmount],
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY, getMinGooglePayAmount],
    ];

    describe.each(['USD', 'EUR', 'CHF', 'BRL', 'JPY', 'KRW'] as Currency[])('%s', (currency) => {
        it.each(minimums)('%s is available from its minimum amount', (type, getMinAmount) => {
            const minAmount = getMinAmount(currency);

            expect(hasNewMethod(type, { ...permissive, currency, amount: minAmount })).toBe(true);
            expect(hasNewMethod(type, { ...permissive, currency, amount: minAmount - 1 })).toBe(false);
        });
    });

    it('should ignore the PayPal minimum for the invoice flow', () => {
        const belowMinimum = getMinPaypalAmountChargebee(TEST_CURRENCY) - 1;

        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, { amount: belowMinimum, flow: 'invoice' })).toBe(
            true
        );
    });
});

describe('PayPal regional currencies', () => {
    describe.each(['HKD', 'SGD', 'JPY', 'PLN'] as Currency[])('%s', (currency) => {
        it.each([true, false])('is gated behind enablePaypalRegionalCurrenciesBatch3=%s', (enabled) => {
            const available = hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, {
                ...permissive,
                currency,
                enablePaypalRegionalCurrenciesBatch3: enabled,
            });

            expect(available).toBe(enabled);
        });

        it('is not gated behind enablePaypalKrw', () => {
            const available = hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, {
                ...permissive,
                currency,
                enablePaypalKrw: false,
            });

            expect(available).toBe(true);
        });
    });

    it.each([true, false])('KRW is gated behind enablePaypalKrw=%s', (enabled) => {
        const available = hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, {
            ...permissive,
            currency: 'KRW',
            enablePaypalKrw: enabled,
        });

        expect(available).toBe(enabled);
    });

    it('should ignore both flags for currencies that are not gated', () => {
        const available = hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, {
            ...permissive,
            currency: 'EUR',
            enablePaypalRegionalCurrenciesBatch3: false,
            enablePaypalKrw: false,
        });

        expect(available).toBe(true);
    });
});

describe('SEPA billing country', () => {
    it.each(SEPA_COUNTRIES)('should offer SEPA for %s', (CountryCode) => {
        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, {
                ...permissive,
                billingAddress: { CountryCode, State: '' },
            })
        ).toBe(true);
    });

    it.each(['US', 'CA', 'AU', 'JP', ''])('should not offer SEPA for %s', (CountryCode) => {
        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, {
                ...permissive,
                billingAddress: { CountryCode, State: '' },
            })
        ).toBe(false);
    });

    it('should not offer SEPA without a billing address', () => {
        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, {
                ...permissive,
                billingAddress: undefined,
            })
        ).toBe(false);
    });
});

describe('iDEAL', () => {
    const idealEnabled: Partial<PaymentMethodsContext> = {
        ...permissive,
        enableIdeal: true,
        billingAddress: { CountryCode: 'NL', State: '' },
    };

    it('should offer iDEAL when the billing country is the Netherlands', () => {
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, idealEnabled)).toBe(true);
    });

    it('should not offer iDEAL when the feature flag is disabled', () => {
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, { ...idealEnabled, enableIdeal: false })).toBe(false);
    });

    it.each(['CH', 'US', ''])('should not offer iDEAL when the billing country is %s', (CountryCode) => {
        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, {
                ...idealEnabled,
                billingAddress: { CountryCode, State: '' },
            })
        ).toBe(false);
    });

    it('should not offer iDEAL without a billing address', () => {
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, { ...idealEnabled, billingAddress: undefined })).toBe(
            false
        );
    });

    it('should not offer iDEAL when the vendor state is off', () => {
        const paymentStatus = { ...status, VendorStates: { ...status.VendorStates, Ideal: false } };

        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, { ...idealEnabled, paymentStatus })).toBe(false);
    });

    it('should not offer iDEAL when it is already a saved method', () => {
        const savedIdeal = { ID: '1', Type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, Order: 500 } as SavedPaymentMethod;

        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, { ...idealEnabled, paymentMethods: [savedIdeal] })
        ).toBe(false);
    });

    it('should not offer iDEAL in trial mode', () => {
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, { ...idealEnabled, isTrial: true })).toBe(false);
    });
});

describe('SEPA audience gating', () => {
    it.each([
        [PLANS.BUNDLE_PRO_2024, true, true],
        [PLANS.BUNDLE_PRO_2024, false, true],
        [PLANS.BUNDLE, true, true],
        [PLANS.BUNDLE, false, false],
        [undefined, true, true],
        [undefined, false, false],
    ] as [PLANS | undefined, boolean, boolean][])(
        'plan %s with enableSepaB2C=%s should offer SEPA: %s',
        (selectedPlanName, enableSepaB2C, expected) => {
            expect(
                hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, {
                    ...permissive,
                    selectedPlanName,
                    enableSepaB2C,
                })
            ).toBe(expected);
        }
    );
});

describe('Black Friday 2025 coupon', () => {
    const gatedTypes: PlainPaymentMethodType[] = [
        PAYMENT_METHOD_TYPES.CASH,
        PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
    ];

    it.each(gatedTypes)('should disable %s', (type) => {
        expect(hasNewMethod(type, { ...permissive, coupon: COUPON_CODES.BLACK_FRIDAY_2025 })).toBe(false);
    });

    it('should be matched case insensitively', () => {
        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, {
                ...permissive,
                coupon: COUPON_CODES.BLACK_FRIDAY_2025.toLowerCase(),
            })
        ).toBe(false);
    });

    it('should not disable SEPA for a regular coupon', () => {
        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, {
                ...permissive,
                coupon: 'ANY_COUPON',
            })
        ).toBe(true);
    });

    it('should not disable bitcoin', () => {
        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, {
                ...permissive,
                coupon: COUPON_CODES.BLACK_FRIDAY_2025,
            })
        ).toBe(true);
    });
});

describe('Cash coupons', () => {
    it('should be disabled by any coupon, not only the Black Friday ones', () => {
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CASH, { ...permissive, coupon: 'ANY_COUPON' })).toBe(false);
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CASH, { ...permissive, coupon: '' })).toBe(true);
    });
});

describe('Google Pay', () => {
    it('should be offered when all conditions are met', () => {
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.GOOGLE_PAY, permissive)).toBe(true);
    });

    it('should not be offered when the vendor state is off', () => {
        const paymentStatus = { ...status, VendorStates: { ...status.VendorStates, Google: false } };

        expect(hasNewMethod(PAYMENT_METHOD_TYPES.GOOGLE_PAY, { ...permissive, paymentStatus })).toBe(false);
    });

    it.each([false, undefined])('should not be offered when canUseGooglePay is %s', (canUseGooglePay) => {
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.GOOGLE_PAY, { ...permissive, canUseGooglePay })).toBe(false);
    });

    it('should be offered for reservation-donation while Apple Pay is not', () => {
        const overrides = { ...permissive, flow: 'reservation-donation' as PaymentMethodFlow };

        expect(hasNewMethod(PAYMENT_METHOD_TYPES.GOOGLE_PAY, overrides)).toBe(true);
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.APPLE_PAY, overrides)).toBe(false);
    });
});

describe('bitcoin delinquency', () => {
    it('should be offered when there is no user at all', () => {
        expect(hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, { ...permissive, user: undefined })).toBe(true);
    });

    it('should be offered to a user with credit balance who buys no plan at all', () => {
        expect(
            hasNewMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, {
                ...permissive,
                user: buildUser({ Credit: 100 }),
                planIDs: undefined,
            })
        ).toBe(true);
    });
});

describe('trial mode', () => {
    it('should leave the card as the only new method even when everything else would be available', () => {
        expect(newTypes({ ...permissive, isTrial: true })).toEqual([PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]);
    });
});
