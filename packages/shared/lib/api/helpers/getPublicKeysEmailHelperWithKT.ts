import { RECIPIENT_TYPES } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import {
    Api,
    ApiKeysConfig,
    KT_VERIFICATION_STATUS,
    ProcessedApiAddressKey,
    ProcessedApiKey,
    VerifyOutboundPublicKeys,
} from '../../interfaces';
import { getExternalKeys, getInternalKeys, getMailCapableKeys, supportsMail } from '../../keys';
import { getAndVerifyApiKeys } from './getAndVerifyApiKeys';

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID, KEY_GET_INVALID_KT } =
    API_CUSTOM_ERROR_CODES;
const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID, KEY_GET_INVALID_KT];

export const castKeys = (keys: ProcessedApiAddressKey[]): ProcessedApiKey[] => {
    return keys.map(({ armoredPublicKey, flags, publicKeyRef }) => {
        return { armoredKey: armoredPublicKey, flags, publicKey: publicKeyRef };
    });
};

const getFailedOrUnVerified = (failed: boolean) =>
    failed ? KT_VERIFICATION_STATUS.VERIFICATION_FAILED : KT_VERIFICATION_STATUS.UNVERIFIED_KEYS;

const getPublicKeysEmailHelperWithKT = async ({
    email,
    internalKeysOnly,
    api,
    verifyOutboundPublicKeys,
    silence,
    noCache,
}: {
    email: string;
    internalKeysOnly: boolean;
    api: Api;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
    silence?: boolean;
    noCache?: boolean;
}): Promise<ApiKeysConfig> => {
    try {
        const { addressKeys, catchAllKeys, unverifiedKeys, addressKTResult, catchAllKTResult, ...rest } =
            await getAndVerifyApiKeys({
                api,
                email,
                internalKeysOnly,
                verifyOutboundPublicKeys,
                silence,
                noCache,
            });

        // First we use verified internal address keys
        const mailCapableAddressKeys = addressKeys.filter((key) => supportsMail(key.flags));

        if (mailCapableAddressKeys.length != 0) {
            return {
                publicKeys: castKeys(mailCapableAddressKeys),
                ktVerificationResult: addressKTResult,
                RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                ...rest,
            };
        }

        const hasDisabledE2EE = addressKeys.some((key) => !supportsMail(key.flags));

        if (hasDisabledE2EE) {
            return {
                publicKeys: [],
                RecipientType: RECIPIENT_TYPES.TYPE_EXTERNAL,
                ktVerificationResult: {
                    status: getFailedOrUnVerified(
                        addressKTResult?.status === KT_VERIFICATION_STATUS.VERIFICATION_FAILED
                    ),
                },
                ...rest,
            };
        }

        const keysChangedRecently = !!addressKTResult?.keysChangedRecently || !!catchAllKTResult?.keysChangedRecently;
        const verificationFailed =
            addressKTResult?.status === KT_VERIFICATION_STATUS.VERIFICATION_FAILED ||
            catchAllKTResult?.status === KT_VERIFICATION_STATUS.VERIFICATION_FAILED;

        // Then we check if there are unverified internal address keys
        if (unverifiedKeys) {
            const mailCapableUnverifiedInternalKeys = getMailCapableKeys(getInternalKeys(unverifiedKeys));
            if (mailCapableUnverifiedInternalKeys.length != 0) {
                const status = getFailedOrUnVerified(verificationFailed);
                return {
                    publicKeys: castKeys(mailCapableUnverifiedInternalKeys),
                    ktVerificationResult: { status, keysChangedRecently },
                    RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                    ...rest,
                };
            }
        }

        // Then we check if there are internal catchall keys
        if (catchAllKeys) {
            const mailCapableCatchAllKeys = getMailCapableKeys(catchAllKeys);
            if (mailCapableCatchAllKeys.length != 0) {
                const status = verificationFailed
                    ? KT_VERIFICATION_STATUS.VERIFICATION_FAILED
                    : catchAllKTResult?.status;
                const ktVerificationResult = catchAllKTResult ? { status: status!, keysChangedRecently } : undefined;
                return {
                    publicKeys: castKeys(mailCapableCatchAllKeys),
                    ktVerificationResult,
                    RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                    ...rest,
                };
            }
        }

        const ktVerificationResult = {
            status: getFailedOrUnVerified(verificationFailed),
            keysChangedRecently,
        };

        // Finally we check if there are external unverified keys
        if (unverifiedKeys) {
            const mailCapableUnverifiedExternalKeys = getMailCapableKeys(getExternalKeys(unverifiedKeys));
            if (mailCapableUnverifiedExternalKeys.length != 0) {
                const firstUnverifiedKey = mailCapableUnverifiedExternalKeys[0];
                return {
                    publicKeys: castKeys([firstUnverifiedKey]),
                    ktVerificationResult,
                    RecipientType: RECIPIENT_TYPES.TYPE_EXTERNAL,
                    ...rest,
                };
            }
        }
        return {
            publicKeys: [],
            RecipientType: RECIPIENT_TYPES.TYPE_EXTERNAL,
            ktVerificationResult,
            ...rest,
        };
    } catch (error: any) {
        const { data = {} } = error;
        if (EMAIL_ERRORS.includes(data.Code)) {
            return {
                publicKeys: [],
                Errors: [data.Error],
            };
        }
        throw error;
    }
};

export default getPublicKeysEmailHelperWithKT;
