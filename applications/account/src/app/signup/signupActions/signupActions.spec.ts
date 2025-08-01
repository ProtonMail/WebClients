import type { ExtendedTokenPayment } from '@proton/payments';
import { CYCLE, DEFAULT_TAX_BILLING_ADDRESS, PAYMENT_METHOD_TYPES } from '@proton/payments';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { type HumanVerificationMethodType, SubscriptionMode } from '@proton/shared/lib/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import type { SignupCacheResult, SubscriptionData } from '../interfaces';
import { SignupType } from '../interfaces';
import { handleCreateUser } from './handleCreateUser';
import { handlePayment } from './signupActions';

jest.mock('./handleCreateUser');
jest.mock('@proton/components', () => ({
    __esModule: true,
    useOpenDrawerOnLoad: jest.fn(() => [{}]),
}));

describe('signupActions', () => {
    let handleCreateUserMock: jest.Mock;

    beforeEach(() => {
        handleCreateUserMock = handleCreateUser as jest.Mock;
        handleCreateUserMock.mockReset();
    });

    describe('handlePayment', () => {
        it('should return result from handleCreateUser', () => {
            handleCreateUserMock.mockReturnValue('handleCreateUser-result');

            const subscriptionData: SubscriptionData = {
                currency: 'EUR',
                cycle: CYCLE.MONTHLY,
                skipUpsell: false,
                planIDs: { mail2022: 1 },
                checkResult: {
                    Amount: 1000,
                    AmountDue: 1000,
                    Coupon: null,
                    Currency: 'EUR',
                    Cycle: CYCLE.MONTHLY,
                    PeriodEnd: 999,
                    SubscriptionMode: SubscriptionMode.Regular,
                    BaseRenewAmount: null,
                    RenewCycle: null,
                },
                billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
                zipCodeValid: true,
            };

            const cache: SignupCacheResult = {
                type: 'signup',
                accountData: {
                    username: 'user123',
                    domain: 'proton.me',
                    email: 'user123@proton.me',
                    password: 'secure123',
                    signupType: SignupType.Proton,
                    payload: undefined,
                },
                subscriptionData,
                persistent: true,
                trusted: true,
                clientType: CLIENT_TYPES.MAIL,
                ignoreExplore: true,
                productParam: undefined,
                inviteData: undefined,
                referralData: undefined,
                ktActivation: KeyTransparencyActivation.DISABLED,
                appName: APPS.PROTONACCOUNT,
            };

            const result = handlePayment({
                api: () => Promise.resolve(null as any),
                cache,
                subscriptionData,
            });

            expect(result).toEqual('handleCreateUser-result');
        });

        it('should use payment token for human verification if it exists: VPN', async () => {
            handleCreateUserMock.mockReturnValue('handleCreateUser-result');

            const payment: ExtendedTokenPayment = {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'payment-token-123',
                },
                paymentsVersion: 'v4',
                paymentProcessorType: 'card',
            };

            const subscriptionData: SubscriptionData = {
                currency: 'EUR',
                cycle: CYCLE.MONTHLY,
                skipUpsell: false,
                planIDs: { mail2022: 1 },
                checkResult: {
                    Amount: 1000,
                    AmountDue: 1000,
                    Coupon: null,
                    Currency: 'EUR',
                    Cycle: CYCLE.MONTHLY,
                    PeriodEnd: 999,
                    SubscriptionMode: SubscriptionMode.Regular,
                    BaseRenewAmount: null,
                    RenewCycle: null,
                },
                payment,
                billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
                zipCodeValid: true,
            };

            const cache: SignupCacheResult = {
                type: 'signup',
                accountData: {
                    username: 'user123',
                    domain: 'proton.me',
                    email: 'user123@proton.me',
                    password: 'secure123',
                    signupType: SignupType.Proton,
                    payload: undefined,
                },
                subscriptionData,
                persistent: true,
                trusted: true,
                clientType: CLIENT_TYPES.MAIL,
                ignoreExplore: true,
                productParam: undefined,
                inviteData: undefined,
                referralData: undefined,
                ktActivation: KeyTransparencyActivation.DISABLED,
                appName: APPS.PROTONACCOUNT,
            };

            const api = () => Promise.resolve(null as any);

            await handlePayment({
                api,
                cache,
                subscriptionData,
            });

            expect(handleCreateUserMock).toHaveBeenCalledWith({
                cache: {
                    ...cache,
                    subscriptionData,
                },
                api,
            });
        });

        it('should use payment token for human verification if it exists: Username', async () => {
            handleCreateUserMock.mockReturnValue('handleCreateUser-result');

            const payment: ExtendedTokenPayment = {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'payment-token-123',
                },
                paymentsVersion: 'v4',
                paymentProcessorType: 'card',
            };

            const subscriptionData: SubscriptionData = {
                currency: 'EUR',
                cycle: CYCLE.MONTHLY,
                skipUpsell: false,
                planIDs: { mail2022: 1 },
                checkResult: {
                    Amount: 1000,
                    AmountDue: 1000,
                    Coupon: null,
                    Currency: 'EUR',
                    Cycle: CYCLE.MONTHLY,
                    PeriodEnd: 999,
                    SubscriptionMode: SubscriptionMode.Regular,
                    BaseRenewAmount: null,
                    RenewCycle: null,
                },
                payment,
                billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
                zipCodeValid: true,
            };

            const cache: SignupCacheResult = {
                type: 'signup',
                accountData: {
                    username: 'user123',
                    domain: 'proton.me',
                    email: 'user123@proton.me',
                    password: 'secure123',
                    signupType: SignupType.Proton,
                    payload: undefined,
                },
                subscriptionData,
                persistent: true,
                trusted: true,
                clientType: CLIENT_TYPES.MAIL,
                ignoreExplore: true,
                productParam: undefined,
                inviteData: undefined,
                referralData: undefined,
                ktActivation: KeyTransparencyActivation.DISABLED,
                appName: APPS.PROTONACCOUNT,
            };

            const api = () => Promise.resolve(null as any);

            await handlePayment({
                api,
                cache,
                subscriptionData,
            });

            expect(handleCreateUserMock).toHaveBeenCalledWith({
                cache: {
                    ...cache,
                    subscriptionData,
                },
                api,
            });
        });

        it('should not use payment token for human verification if it does not exist: Username', async () => {
            handleCreateUserMock.mockReturnValue('handleCreateUser-result');

            const payment = {} as any;

            const subscriptionData: SubscriptionData = {
                currency: 'EUR',
                cycle: CYCLE.MONTHLY,
                skipUpsell: false,
                planIDs: { mail2022: 1 },
                checkResult: {
                    Amount: 1000,
                    AmountDue: 1000,
                    Coupon: null,
                    Currency: 'EUR',
                    Cycle: CYCLE.MONTHLY,
                    PeriodEnd: 999,
                    SubscriptionMode: SubscriptionMode.Regular,
                    BaseRenewAmount: null,
                    RenewCycle: null,
                },
                payment,
                billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
                zipCodeValid: true,
            };

            const humanVerificationResult = {
                tokenType: 'captcha' as HumanVerificationMethodType,
                token: 'token-123',
            };

            const cache: SignupCacheResult = {
                type: 'signup',
                accountData: {
                    username: 'user123',
                    domain: 'proton.me',
                    email: 'user123@proton.me',
                    password: 'secure123',
                    signupType: SignupType.Proton,
                    payload: undefined,
                },
                subscriptionData,
                persistent: true,
                trusted: true,
                clientType: CLIENT_TYPES.MAIL,
                ignoreExplore: true,
                productParam: undefined,
                inviteData: undefined,
                referralData: undefined,
                ktActivation: KeyTransparencyActivation.DISABLED,
                appName: APPS.PROTONACCOUNT,
                humanVerificationResult,
            };

            const api = () => Promise.resolve(null as any);

            await handlePayment({
                api,
                cache,
                subscriptionData,
            });

            expect(handleCreateUserMock).toHaveBeenCalledWith({
                cache: {
                    ...cache,
                    humanVerificationResult,
                    subscriptionData,
                },
                api,
            });
        });
    });
});
