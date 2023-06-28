import { Api, ApiKeysConfig, KeyTransparencyActivation, VerifyOutboundPublicKeys } from '../../interfaces';
import getPublicKeysEmailHelperLegacy from './getPublicKeysEmailHelperLegacy';
import getPublicKeysEmailHelperWithKT from './getPublicKeysEmailHelperWithKT';

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
    if (ktActivation === KeyTransparencyActivation.LOG_ONLY) {
        return {
            ...result,
            ktVerificationStatus: undefined,
        };
    }
    return result;
};

export default getPublicKeysEmailHelper;
