import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCreateUser, queryCreateUserExternal } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { withVerificationHeaders } from '@proton/shared/lib/fetch/headers';
import { Api, User } from '@proton/shared/lib/interfaces';
import { srpVerify } from '@proton/shared/lib/srp';

import {
    HumanVerificationTrigger,
    SignupActionResponse,
    SignupCacheResult,
    SignupSteps,
    SignupType,
} from '../interfaces';
import { getReferralDataQuery, getSignupTypeQuery, hvHandler } from './signupActions';

export const handleCreateUser = async ({
    cache,
    api,
}: {
    cache: SignupCacheResult;
    api: Api;
}): Promise<SignupActionResponse> => {
    const {
        accountData: { signupType, username, email, password, payload },
        accountData,
        humanVerificationResult,
        inviteData,
        referralData,
        clientType,
        setupVPN,
    } = cache;

    if (signupType === SignupType.Username || signupType === SignupType.VPN) {
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
                            ...getSignupTypeQuery(accountData, setupVPN),
                            ...getReferralDataQuery(referralData),
                        },
                        cache.productParam
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
            config: withVerificationHeaders(
                cache.humanVerificationResult?.token,
                cache.humanVerificationResult?.tokenType,
                queryCreateUserExternal(
                    {
                        Type: clientType,
                        Email: email,
                        Payload: payload,
                    },
                    cache.productParam
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
    }

    throw new Error('Unknown signup type');
};
