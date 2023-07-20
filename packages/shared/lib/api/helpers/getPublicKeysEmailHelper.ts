import { c } from 'ttag';

import { ktSentryReport } from '@proton/key-transparency/lib';

import {
    Api,
    ApiKeysConfig,
    KT_VERIFICATION_STATUS,
    KeyTransparencyActivation,
    VerifyOutboundPublicKeys,
} from '../../interfaces';
import getPublicKeysEmailHelperLegacy from './getPublicKeysEmailHelperLegacy';
import getPublicKeysEmailHelperWithKT from './getPublicKeysEmailHelperWithKT';

export const KEY_VERIFICATION_ERROR_MESSAGE = c('loc_nightly: Key verification error')
    .t`Unable to verify this address at this time`;

/**
 * Ask the API for public keys for a given email address. The response will contain keys both
 * for internal users and for external users with WKD keys
 */
const getPublicKeysEmailHelper = async (
    api: Api,
    ktActivation: KeyTransparencyActivation,
    Email: string,
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys,
    silence = false,
    noCache = false
): Promise<ApiKeysConfig> => {
    if (ktActivation === KeyTransparencyActivation.DISABLED) {
        return getPublicKeysEmailHelperLegacy(api, Email, silence, noCache);
    }
    const result = await getPublicKeysEmailHelperWithKT(api, Email, verifyOutboundPublicKeys, silence, noCache);
    if (result.ktVerificationResult?.status === KT_VERIFICATION_STATUS.VERIFICATION_FAILED) {
        ktSentryReport('Key verification error', { email: Email });
        if (ktActivation === KeyTransparencyActivation.SHOW_UI) {
            return {
                publicKeys: [],
                ktVerificationResult: result.ktVerificationResult,
                Errors: [KEY_VERIFICATION_ERROR_MESSAGE],
            };
        }
    }
    if (ktActivation === KeyTransparencyActivation.LOG_ONLY) {
        return {
            ...result,
            ktVerificationResult: undefined,
        };
    }
    return result;
};

export default getPublicKeysEmailHelper;
