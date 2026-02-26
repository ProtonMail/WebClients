import { c } from 'ttag';

import { ktKeyVerificationFailureTelemetryAndMetrics, ktSentryReport } from '@proton/key-transparency/helpers';

import type { Api, ApiKeysConfig, KTUserContext } from '../../interfaces';
import { KT_VERIFICATION_STATUS, KeyTransparencyActivation } from '../../interfaces';
import getPublicKeysEmailHelperWithKT from './getPublicKeysEmailHelperWithKT';

export const KEY_VERIFICATION_ERROR_MESSAGE = c('loc_nightly: Key verification error')
    .t`Unable to verify this address at this time`;

/**
 * Ask the API for public keys for a given email address. The response will contain keys both
 * for internal users and for external users with e.g. WKD keys
 */
const getPublicKeysEmailHelper = async ({
    email,
    internalKeysOnly = false,
    includeInternalKeysWithE2EEDisabledForMail = false,
    api,
    ktUserContext,
    silence,
    noCache,
}: {
    email: string;
    internalKeysOnly?: boolean;
    api: Api;
    ktUserContext: KTUserContext;
    /**
     * Whether to return internal keys which cannot be used for email encryption, as the owner has disabled E2EE.
     * These keys may still be used for e.g. calendar sharing or message verification.
     **/
    includeInternalKeysWithE2EEDisabledForMail?: boolean;
    silence?: boolean;
    noCache?: boolean;
}): Promise<ApiKeysConfig> => {
    if (ktUserContext.ktActivation === KeyTransparencyActivation.DISABLED) {
        const { ktVerificationResult, ...resultWithoutKT } = await getPublicKeysEmailHelperWithKT({
            email,
            internalKeysOnly,
            includeInternalKeysWithE2EEDisabledForMail,
            api,
            ktUserContext,
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
        ktUserContext,
        silence,
        noCache,
    });
    if (result.ktVerificationResult?.status === KT_VERIFICATION_STATUS.VERIFICATION_FAILED) {
        const visible = ktUserContext.ktActivation === KeyTransparencyActivation.SHOW_UI;
        ktSentryReport('Key verification error', { email });
        await ktKeyVerificationFailureTelemetryAndMetrics(api, visible);
        if (visible) {
            return {
                publicKeys: [],
                ktVerificationResult: result.ktVerificationResult,
                Errors: [KEY_VERIFICATION_ERROR_MESSAGE],
            };
        }
    }
    if (ktUserContext.ktActivation === KeyTransparencyActivation.LOG_ONLY) {
        return {
            ...result,
            ktVerificationResult: undefined,
        };
    }
    return result;
};

export default getPublicKeysEmailHelper;
