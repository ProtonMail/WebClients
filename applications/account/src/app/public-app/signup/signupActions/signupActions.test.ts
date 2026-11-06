import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import type { SignupContextSubscriptionData } from '../../signupCtx/context/helpers/handleSetupUser';
import { handleSetupUser as handleSetupUserSignupCtx } from '../../signupCtx/context/helpers/handleSetupUser';
import type { SignupCacheResult, SubscriptionData } from '../interfaces';
import { SignupType } from '../interfaces';
import { handleSetupUser as handleSetupUserLegacy } from './signupActions';

jest.mock('@proton/shared/lib/srp', () => ({
    srpAuth: jest.fn(async () => ({ json: async () => ({ UID: 'uid', AccessToken: 'token' }) })),
}));
jest.mock('@proton/shared/lib/authentication/persistedSessionHelper', () => ({
    persistSession: jest.fn(async () => ({})),
}));
jest.mock('@proton/key-transparency/shared/createPreAuthKTVerifier', () => ({
    createPreAuthKTVerifier: () => ({ preAuthKTVerify: jest.fn(), preAuthKTCommit: jest.fn(async () => {}) }),
}));

const subscribeUrl = 'payments/v5/subscription';

const paymentToken = {
    Type: 'token',
    Details: { Token: 'payment-token' },
    paymentMethodType: 'card',
    paymentMethodValue: 'card',
} as any;

const billingAddress = { CountryCode: 'CH', State: null };

const baseSubscriptionData = {
    currency: 'EUR',
    cycle: CYCLE.YEARLY,
    planIDs: { [PLANS.MAIL]: 1 },
    billingAddress,
    vatNumber: undefined,
} as const;

const checkResult = (overrides: object = {}) =>
    ({ AmountDue: 4788, Coupon: null, SubscriptionMode: SubscriptionMode.Regular, ...overrides }) as any;

const accountData = {
    username: 'user',
    email: '',
    domain: 'proton.me',
    password: 'password',
    signupType: SignupType.Proton,
} as any;

const runLegacy = (subscriptionData: Partial<SubscriptionData>, cache: Partial<SignupCacheResult> = {}) =>
    handleSetupUserLegacy({
        cache: {
            accountData,
            subscriptionData: { ...baseSubscriptionData, payment: paymentToken, ...subscriptionData },
            persistent: false,
            productParam: 'generic',
            ktActivation: {},
            ...cache,
        } as any,
        api: apiMock,
        canGenerateMnemonic: false,
        setupKeys: false,
        reportPaymentSuccess: jest.fn(),
        reportPaymentFailure: jest.fn(),
    });

const runSignupCtx = (subscriptionData: Partial<SignupContextSubscriptionData>, referralData?: any) =>
    handleSetupUserSignupCtx({
        accountData,
        api: apiMock,
        persistent: false,
        trusted: false,
        subscriptionData: { ...baseSubscriptionData, paymentToken, ...subscriptionData } as any,
        productParam: 'generic',
        keyTransparencyActivation: {} as any,
        traceSignupSentryError: jest.fn(),
        referralData,
        referralRegistrationPlan: undefined,
        build: 'proton-account',
        telemetryContext: 'other',
    });

const getSubscribeCalls = () =>
    apiMock.mock.calls.map(([config]) => config).filter((config) => config.url === subscribeUrl);

beforeEach(() => {
    jest.clearAllMocks();
    clearApiMocks();
    addApiMock('core/v4/addresses', () => ({ Addresses: [], Total: 0 }));
    addApiMock('core/v4/users', () => ({ User: { ID: 'user-id', Name: 'user' } }));
    addApiMock(subscribeUrl, () => ({ Subscription: { ID: 'sub-id' } }), 'post');
});

/**
 * Regression for P2-2727 / P2-2741: both signup flows create the subscription through their own copy of
 * `handleSubscribeUser`. These tests pin the request body sent to the backend from the outer `handleSetupUser`
 * of each flow, so the unification can be verified to keep the payloads unchanged.
 */
describe('signup subscription creation', () => {
    describe.each([
        ['signupActions (single signup)', runLegacy],
        ['signupCtx', runSignupCtx],
    ] as const)('%s', (_, run) => {
        it('creates the subscription with the plan, cycle, currency, amount and payment token', async () => {
            await run({ checkResult: checkResult() });

            const calls = getSubscribeCalls();
            expect(calls).toHaveLength(1);
            expect(calls[0].method).toBe('post');
            expect(calls[0].data).toEqual(
                expect.objectContaining({
                    Plans: { [PLANS.MAIL]: 1 },
                    Currency: 'EUR',
                    Cycle: CYCLE.YEARLY,
                    Amount: 4788,
                    PaymentToken: 'payment-token',
                })
            );
            expect(calls[0].data).not.toHaveProperty('Codes');
            expect(calls[0].data).not.toHaveProperty('StartTrial');
        });

        it('sends the coupon returned by the check as Codes', async () => {
            await run({ checkResult: checkResult({ Coupon: { Code: 'WELCOME', Description: '' } }) });

            expect(getSubscribeCalls()[0].data.Codes).toEqual(['WELCOME']);
        });

        it('does not create a subscription for free plan IDs', async () => {
            await run({ planIDs: {}, checkResult: checkResult({ AmountDue: 0 }) });

            expect(getSubscribeCalls()).toHaveLength(0);
        });
    });

    describe('signupActions (single signup)', () => {
        it('starts a trial when the check result is in trial mode', async () => {
            await runLegacy({ checkResult: checkResult({ SubscriptionMode: SubscriptionMode.Trial }) });

            expect(getSubscribeCalls()[0].data.StartTrial).toBe(true);
        });

        it('redeems the provisioning token in the same request', async () => {
            await runLegacy({ checkResult: checkResult() }, { provisioningToken: 'provisioning' } as any);

            expect(getSubscribeCalls()[0].data.ProvisioningToken).toBe('provisioning');
        });

        it('does not create a subscription for referrals', async () => {
            await runLegacy({ checkResult: checkResult() }, { referralData: { code: 'ref' } } as any);

            expect(getSubscribeCalls()).toHaveLength(0);
        });
    });

    describe('signupCtx', () => {
        it('starts a trial when the subscription data requests it', async () => {
            await runSignupCtx({ checkResult: checkResult(), trial: true });

            expect(getSubscribeCalls()[0].data.StartTrial).toBe(true);
        });

        it('does not create a subscription for referrals', async () => {
            await runSignupCtx({ checkResult: checkResult() }, { code: 'ref' });

            expect(getSubscribeCalls()).toHaveLength(0);
        });
    });
});
