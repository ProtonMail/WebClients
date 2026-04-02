import { KeyTransparencyActivation, type VerifyOutboundPublicKeys } from '@proton/shared/lib/interfaces';

import { verifyPublicKeysAddressAndCatchall } from '../verification/verifyKeys';
import { getLatestEpoch } from './getLatestEpoch';
import { KT_ERROR_TYPE, ktSentryReportError } from './utils';

export const verifyOutboundPublicKeys: VerifyOutboundPublicKeys = async ({
    ktUserContext,
    skipVerificationOfExternalDomains,
    address,
    api,
    email,
    catchAll,
}) => {
    if (ktUserContext.ktActivation === KeyTransparencyActivation.DISABLED) {
        return {};
    }
    return verifyPublicKeysAddressAndCatchall({
        ktUserContext,
        api,
        getLatestEpoch,
        email,
        skipVerificationOfExternalDomains,
        address,
        catchAll,
    }).catch((error) => {
        ktSentryReportError(error, KT_ERROR_TYPE.LOCAL, { context: 'VerifyOutboundPublicKeys' });
        return {};
    });
};
