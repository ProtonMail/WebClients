import { KeyTransparencyActivation, type VerifyOutboundPublicKeys } from '@proton/shared/lib/interfaces';

import { verifyPublicKeysAddressAndCatchall } from '../verification/verifyKeys';
import { getLatestEpoch } from './getLatestEpoch';
import { ktSentryReportError } from './utils';

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
        ktSentryReportError(error, { context: 'VerifyOutboundPublicKeys' });
        return {};
    });
};
