import { isTokenPayment } from '@proton/components/payments/core';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCreateUser, queryCreateUserExternal } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import {
    getCroHeaders,
    getOwnershipVerificationHeaders,
    mergeHeaders,
    withVerificationHeaders,
} from '@proton/shared/lib/fetch/headers';
import { Api, User } from '@proton/shared/lib/interfaces';
import { srpVerify } from '@proton/shared/lib/srp';

import {
    HumanVerificationTrigger,
    SignupActionResponse,
    SignupCacheResult,
    SignupSteps,
    SignupType,
} from '../interfaces';
import { hvHandler } from './helpers';

const getReferralDataQuery = (referralData: SignupCacheResult['referralData']) => {
    if (referralData) {
        return {
            ReferralID: referralData.invite,
            ReferralIdentifier: referralData.referrer,
        };
    }
};

export const getTokenPayment = (tokenPayment: string | undefined) => {
    return tokenPayment ? { TokenPayment: tokenPayment } : undefined;
};

const getSignupTypeQuery = (accountData: SignupCacheResult['accountData']) => {
    if (accountData.signupType === SignupType.Username) {
        return { Domain: accountData.domain };
    }
};

export const handleCreateUser = async ({
    cache,
    api,
    mode,
}: {
    cache: SignupCacheResult;
    api: Api;
    mode?: 'cro';
}): Promise<SignupActionResponse> => {
    const {
        accountData: { signupType, username, email, password, payload },
        subscriptionData,
        accountData,
        humanVerificationResult,
        inviteData,
        referralData,
        clientType,
        productParam,
    } = cache;

    const paymentToken = isTokenPayment(subscriptionData.payment) ? subscriptionData.payment.Details.Token : undefined;

    if (signupType === SignupType.Username) {
        const humanVerificationParameters = (() => {
            if (humanVerificationResult) {
                return {
                    token: humanVerificationResult.token,
                    tokenType: humanVerificationResult.tokenType,
                };
            }
            if (inviteData) {
                return {
                    token: `${inviteData.selector}:${inviteData.token}`,
                    tokenType: 'invite' as const,
                };
            }
        })();
        try {
            const { User } = await srpVerify<{ User: User }>({
                api,
                credentials: { password },
                config: withVerificationHeaders(
                    humanVerificationParameters?.token,
                    humanVerificationParameters?.tokenType,
                    queryCreateUser(
                        {
                            Type: clientType,
                            Username: username,
                            Payload: payload,
                            ...getTokenPayment(paymentToken),
                            ...getSignupTypeQuery(accountData),
                            ...getReferralDataQuery(referralData),
                        },
                        productParam
                    )
                ),
            });
            return {
                to: SignupSteps.CreatingAccount,
                cache: {
                    ...cache,
                    userData: {
                        User,
                    },
                },
            };
        } catch (error) {
            const { code } = getApiError(error);
            if (
                code === API_CUSTOM_ERROR_CODES.USER_CREATE_TOKEN_INVALID &&
                humanVerificationParameters?.tokenType === 'invite'
            ) {
                // Automatically try again if the invite was invalid for some reason, HV will be prompted.
                return handleCreateUser({
                    cache: {
                        ...cache,
                        inviteData: undefined,
                    },
                    api,
                    mode,
                });
            }
            const humanVerificationData = hvHandler(error, HumanVerificationTrigger.UserCreation);
            return {
                cache: {
                    ...cache,
                    humanVerificationData,
                },
                to: SignupSteps.HumanVerification,
            };
        }
    }

    if (signupType === SignupType.Email) {
        const { User } = await srpVerify<{ User: User }>({
            api,
            credentials: { password },
            config: mergeHeaders(
                withVerificationHeaders(
                    humanVerificationResult?.token,
                    humanVerificationResult?.tokenType,
                    queryCreateUserExternal(
                        {
                            Type: clientType,
                            Email: email,
                            Payload: payload,
                            ...(mode === 'cro' && paymentToken
                                ? {
                                      Token: paymentToken,
                                      TokenType: 'payment',
                                  }
                                : getTokenPayment(paymentToken)),
                        },
                        productParam
                    )
                ),
                (() => {
                    if (mode === 'cro') {
                        return paymentToken ? getCroHeaders(paymentToken) : getOwnershipVerificationHeaders('lax');
                    }
                    return {};
                })()
            ),
        });
        return {
            to: SignupSteps.CreatingAccount,
            cache: {
                ...cache,
                userData: {
                    User,
                },
            },
        };
    }

    throw new Error('Unknown signup type');
};
