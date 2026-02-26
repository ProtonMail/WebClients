import type { HumanVerificationResult } from '@proton/components';
import { isTokenPayment } from '@proton/payments';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCreateUser, queryCreateUserExternal } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { mergeHeaders, withVerificationHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api, User } from '@proton/shared/lib/interfaces';
import { srpVerify } from '@proton/shared/lib/srp';

import { getHVHeadersBasedOnSignupMode, getPaymentTokenForExternalUsers } from '../helper';
import type { SignupActionResponse, SignupCacheResult, SignupHVMode, SignupInviteParameters } from '../interfaces';
import { SignupType } from '../interfaces';

const getReferralDataQuery = (referralData: SignupCacheResult['referralData']) => {
    if (referralData) {
        return {
            ReferralID: referralData.invite,
            ReferralIdentifier: referralData.referrer,
        };
    }
};

const getTokenPayment = (tokenPayment: string | undefined) => {
    return tokenPayment ? { TokenPayment: tokenPayment } : undefined;
};

const getSignupTypeQuery = (accountData: SignupCacheResult['accountData']) => {
    if (accountData.signupType === SignupType.Proton) {
        return { Domain: accountData.domain };
    }
};

export const handleCreateUser = async ({
    cache,
    api,
    mode,
    invite,
}: {
    cache: SignupCacheResult;
    api: Api;
    mode?: SignupHVMode;
    invite?: SignupInviteParameters;
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

    const paymentToken =
        isTokenPayment(subscriptionData.payment) && subscriptionData.checkResult.AmountDue > 0
            ? subscriptionData.payment.Details.Token
            : undefined;

    if (signupType === SignupType.Proton) {
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
            const response = await srpVerify<
                Response & {
                    humanVerificationResult?: HumanVerificationResult;
                }
            >({
                api,
                credentials: { password },
                config: {
                    output: 'raw',
                    ...withVerificationHeaders(
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
                },
            });
            const humanVerificationResult = response.humanVerificationResult;
            const { User } = await response.json();
            return {
                cache: {
                    ...cache,
                    userData: {
                        User,
                    },
                    ...(humanVerificationResult ? { humanVerificationResult } : undefined),
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
            throw error;
        }
    }

    if (signupType === SignupType.External || signupType === SignupType.BringYourOwnEmail) {
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
                            // To create a BYOE user, we shouldn't pass an email
                            Email: signupType !== SignupType.BringYourOwnEmail ? email : undefined,
                            Payload: payload,
                            ...(() => {
                                if (
                                    invite &&
                                    ((invite.type === 'wallet' && invite.data.preVerifiedAddressToken) ||
                                        (invite.type === 'drive' && invite.data.preVerifiedAddressToken) ||
                                        (invite.type === 'pass' && invite.data.preVerifiedAddressToken) ||
                                        (invite.type === 'lumo' && invite.data.preVerifiedAddressToken) ||
                                        (invite.type === 'porkbun' && invite.data.preVerifiedAddressToken))
                                ) {
                                    return {
                                        TokenPreVerifiedAddress: invite.data.preVerifiedAddressToken,
                                    };
                                }
                            })(),
                            ...getPaymentTokenForExternalUsers(mode, paymentToken),
                        },
                        productParam
                    )
                ),
                getHVHeadersBasedOnSignupMode(mode, paymentToken)
            ),
        });
        return {
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
