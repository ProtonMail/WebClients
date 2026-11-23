import { queryCreateUser, queryCreateUserExternal } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { CLIENT_TYPES } from '@proton/shared/lib/constants';
import { mergeHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { srpVerify } from '@proton/shared/lib/srp';

import {
    getHVHeadersBasedOnSignupMode,
    getPaymentTokenForExternalUsers,
    getTokenPayment,
} from '../../../signup/helper';
import type { AccountData, SignupHumanVerification, SignupInviteParameters } from '../../../signup/interfaces';
import { SignupType } from '../../../signup/interfaces';

const getSignupTypeQuery = (accountData: AccountData) => {
    if (accountData.signupType === SignupType.Proton) {
        return { Domain: accountData.domain };
    }
};

/**
 * Returns additional headers for browsers that integrate Pass.
 * The `x-pm-browser` header identifies the browser.
 * This will be sent during account creation to inform the backend.
 */
const getBrowserHeaders = (): Record<string, string> => {
    // For helium
    if ((window as any).chrome?.helium !== undefined) {
        return { 'x-pm-browser': 'helium' };
    }
    return {};
};

export const handleCreateUser = async ({
    accountData,
    paymentToken,
    productParam,
    clientType,
    api,
    invite,
    visitorId,
    hvMode,
}: {
    accountData: AccountData;
    clientType: CLIENT_TYPES;
    paymentToken: string | undefined;
    productParam: ProductParam | undefined;
    api: Api;
    invite: SignupInviteParameters | undefined;
    visitorId: string | undefined;
    hvMode: SignupHumanVerification | undefined;
}) => {
    const { username, email, password, signupType, payload } = accountData;
    if (signupType === SignupType.Proton) {
        await srpVerify({
            api,
            credentials: { password },
            config: mergeHeaders(
                queryCreateUser(
                    {
                        Type: clientType,
                        Username: username,
                        Payload: payload,
                        VisitorId: visitorId,
                        ...getTokenPayment(paymentToken),
                        ...getSignupTypeQuery(accountData),
                    },
                    productParam
                ),
                getBrowserHeaders()
            ),
        });
        return;
    }

    if (signupType === SignupType.External) {
        await srpVerify({
            api,
            credentials: { password },
            config: mergeHeaders(
                queryCreateUserExternal(
                    {
                        Type: clientType,
                        Email: email,
                        Payload: payload,
                        ...(invite && 'preVerifiedAddressToken' in invite.data && invite.data.preVerifiedAddressToken
                            ? { TokenPreVerifiedAddress: invite.data.preVerifiedAddressToken }
                            : undefined),
                        VisitorId: visitorId,
                        ...getPaymentTokenForExternalUsers(hvMode, paymentToken),
                    },
                    productParam
                ),
                { ...getBrowserHeaders(), ...getHVHeadersBasedOnSignupMode(hvMode, paymentToken) }
            ),
        });
        return;
    }

    throw new Error('Unknown signup type');
};
