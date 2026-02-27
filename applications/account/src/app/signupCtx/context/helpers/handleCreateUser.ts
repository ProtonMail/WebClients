import type { HumanVerificationResult } from '@proton/components';
import { queryCreateUser, queryCreateUserExternal } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { CLIENT_TYPES } from '@proton/shared/lib/constants';
import { mergeHeaders, withVerificationHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api, User } from '@proton/shared/lib/interfaces';
import { srpVerify } from '@proton/shared/lib/srp';

import { getHVHeadersBasedOnSignupMode, getPaymentTokenForExternalUsers } from '../../../signup/helper';
import type {
    AccountData,
    InviteData,
    SignupHumanVerification,
    SignupInviteParameters,
} from '../../../signup/interfaces';
import { SignupType } from '../../../signup/interfaces';

export const getTokenPayment = (tokenPayment: string | undefined) => {
    return tokenPayment ? { TokenPayment: tokenPayment } : undefined;
};

const getSignupTypeQuery = (accountData: AccountData) => {
    if (accountData.signupType === SignupType.Proton) {
        return { Domain: accountData.domain };
    }
};

export const handleCreateUser = async ({
    accountData,
    paymentToken,
    humanVerificationResult,
    inviteData,
    productParam,
    clientType,
    api,
    invite,
    hvMode,
}: {
    accountData: AccountData;
    clientType: CLIENT_TYPES;
    paymentToken: string | undefined;
    humanVerificationResult: HumanVerificationResult | undefined;
    inviteData: InviteData | undefined;
    productParam: ProductParam | undefined;
    api: Api;
    invite: SignupInviteParameters | undefined;
    hvMode: SignupHumanVerification | undefined;
}): Promise<{ user: User; humanVerificationResult: HumanVerificationResult | undefined }> => {
    const { username, email, password, signupType, payload } = accountData;
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
                        },
                        productParam
                    )
                ),
            },
        });

        const { User } = await response.json();
        return {
            user: User,
            humanVerificationResult: response.humanVerificationResult,
        };
    }

    if (signupType === SignupType.External) {
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
                            ...(() => {
                                if (
                                    invite &&
                                    ((invite.type === 'wallet' && invite.data.preVerifiedAddressToken) ||
                                        (invite.type === 'drive' && invite.data.preVerifiedAddressToken) ||
                                        (invite.type === 'pass' && invite.data.preVerifiedAddressToken) ||
                                        (invite.type === 'porkbun' && invite.data.preVerifiedAddressToken))
                                ) {
                                    return {
                                        TokenPreVerifiedAddress: invite.data.preVerifiedAddressToken,
                                    };
                                }
                            })(),
                            ...getPaymentTokenForExternalUsers(hvMode, paymentToken),
                        },
                        productParam
                    )
                ),
                getHVHeadersBasedOnSignupMode(hvMode, paymentToken)
            ),
        });
        return {
            user: User,
            humanVerificationResult: undefined,
        };
    }

    throw new Error('Unknown signup type');
};
