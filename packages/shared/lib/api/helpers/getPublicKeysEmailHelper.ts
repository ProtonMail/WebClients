import { c } from 'ttag';

import { ktKeyVerificationFailureTelemetry, ktSentryReport } from '@proton/key-transparency/lib';

import {
    Api,
    ApiKeysConfig,
    KT_VERIFICATION_STATUS,
    KeyTransparencyActivation,
    VerifyOutboundPublicKeys,
} from '../../interfaces';
import getPublicKeysEmailHelperWithKT from './getPublicKeysEmailHelperWithKT';

export const KEY_VERIFICATION_ERROR_MESSAGE = c('loc_nightly: Key verification error')
    .t`Unable to verify this address at this time`;

/**
 * Ask the API for public keys for a given email address. The response will contain keys both
 * for internal users and for external users with WKD keys
 */
const getPublicKeysEmailHelper = async ({
    email,
    internalKeysOnly = false,
    includeInternalKeysWithE2EEDisabledForMail = false,
    api,
    ktActivation,
    verifyOutboundPublicKeys,
    silence,
    noCache,
}: {
    email: string;
    internalKeysOnly?: boolean;
    api: Api;
    ktActivation: KeyTransparencyActivation;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    /**
     * Whether to return internal keys which cannot be used for email encryption, as the owner has disabled E2EE.
     * These keys may still be used for e.g. calendar sharing or message verification.
     **/
    includeInternalKeysWithE2EEDisabledForMail?: boolean;
    silence?: boolean;
    noCache?: boolean;
}): Promise<ApiKeysConfig> => {
    if (ktActivation === KeyTransparencyActivation.DISABLED) {
        const { ktVerificationResult, ...resultWithoutKT } = await getPublicKeysEmailHelperWithKT({
            email,
            internalKeysOnly,
            includeInternalKeysWithE2EEDisabledForMail,
            api,
            verifyOutboundPublicKeys: null, // skip KT verification
            silence,
            noCache,
        });

        return resultWithoutKT;
    }
    const result = await getPublicKeysEmailHelperWithKT({
        email,
        internalKeysOnly,
        includeInternalKeysWithE2EEDisabledForMail,
        api,
        verifyOutboundPublicKeys,
        silence,
        noCache,
    });
    if (result.ktVerificationResult?.status === KT_VERIFICATION_STATUS.VERIFICATION_FAILED) {
        const visible = ktActivation === KeyTransparencyActivation.SHOW_UI;
        ktSentryReport('Key verification error', { email });
        await ktKeyVerificationFailureTelemetry(api, visible);
        if (visible) {
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
