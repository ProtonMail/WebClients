import { Payment, TokenPayment } from '@proton/components/containers/payments/interface';
import { CLIENT_TYPES, CYCLE, PAYMENT_METHOD_TYPES, TOKEN_TYPES } from '@proton/shared/lib/constants';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

import { SignupCacheResult, SignupType, SubscriptionData } from '../interfaces';
import { handleCreateUser } from './handleCreateUser';
import { handlePayment } from './signupActions';

jest.mock('./handleCreateUser');

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
                    Additions: null,
                    PeriodEnd: 999,
                },
            };

            const cache: SignupCacheResult = {
                setupVPN: false,
                accountData: {
                    username: 'user123',
                    domain: 'proton.me',
                    email: 'user123@proton.me',
                    password: 'secure123',
                    recoveryEmail: 'user123@gmail.com',
                    signupType: SignupType.VPN,
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
            };

            const result = handlePayment({
                api: () => Promise.resolve(null as any),
                cache,
                subscriptionData,
            });

            expect(result).toEqual('handleCreateUser-result');
        });

        it('should use payment token for human verification if it exists: VPN', () => {
            handleCreateUserMock.mockReturnValue('handleCreateUser-result');

            const payment: TokenPayment = {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'payment-token-123',
                },
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
                    Additions: null,
                    PeriodEnd: 999,
                },
                payment,
            };

            const cache: SignupCacheResult = {
                setupVPN: false,
                accountData: {
                    username: 'user123',
                    domain: 'proton.me',
                    email: 'user123@proton.me',
                    password: 'secure123',
                    recoveryEmail: 'user123@gmail.com',
                    signupType: SignupType.VPN,
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
            };

            const api = () => Promise.resolve(null as any);

            handlePayment({
                api,
                cache,
                subscriptionData,
            });

            expect(handleCreateUserMock).toHaveBeenCalledWith({
                cache: {
                    ...cache,
                    humanVerificationResult: {
                        token: 'payment-token-123',
                        tokenType: TOKEN_TYPES.PAYMENT,
                    },
                    subscriptionData,
                },
                api,
            });
        });

        it('should use payment token for human verification if it exists: Username', () => {
            handleCreateUserMock.mockReturnValue('handleCreateUser-result');

            const payment: TokenPayment = {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'payment-token-123',
                },
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
                    Additions: null,
                    PeriodEnd: 999,
                },
                payment,
            };

            const cache: SignupCacheResult = {
                setupVPN: false,
                accountData: {
                    username: 'user123',
                    domain: 'proton.me',
                    email: 'user123@proton.me',
                    password: 'secure123',
                    signupType: SignupType.Username,
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
            };

            const api = () => Promise.resolve(null as any);

            handlePayment({
                api,
                cache,
                subscriptionData,
            });

            expect(handleCreateUserMock).toHaveBeenCalledWith({
                cache: {
                    ...cache,
                    humanVerificationResult: {
                        token: 'payment-token-123',
                        tokenType: TOKEN_TYPES.PAYMENT,
                    },
                    subscriptionData,
                },
                api,
            });
        });

        it('should not use payment token for human verification if it does not exist: Username', () => {
            handleCreateUserMock.mockReturnValue('handleCreateUser-result');

            const payment: Payment = {} as any;

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
                    Additions: null,
                    PeriodEnd: 999,
                },
                payment,
            };

            const humanVerificationResult = {
                tokenType: 'captcha' as HumanVerificationMethodType,
                token: 'token-123',
            };

            const cache: SignupCacheResult = {
                setupVPN: false,
                accountData: {
                    username: 'user123',
                    domain: 'proton.me',
                    email: 'user123@proton.me',
                    password: 'secure123',
                    signupType: SignupType.Username,
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
                humanVerificationResult,
            };

            const api = () => Promise.resolve(null as any);

            handlePayment({
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
