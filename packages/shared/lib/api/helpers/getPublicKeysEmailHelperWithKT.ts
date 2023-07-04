import { CryptoProxy } from '@proton/crypto';

import { KEY_FLAG, RECIPIENT_TYPES } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { hasBit } from '../../helpers/bitset';
import {
    Api,
    ApiKeysConfig,
    KT_VERIFICATION_STATUS,
    ProcessedApiKey,
    VerifyOutboundPublicKeys,
} from '../../interfaces';
import { ApiKeySource, KeyWithFlags, KeyWithFlagsAndSource, getAndVerifyApiKeys } from './getAndVerifyApiKeys';

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID, KEY_GET_INVALID_KT } = API_CUSTOM_ERROR_CODES;
const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID, KEY_GET_INVALID_KT];

const supportsMail = (flags: number): Boolean => {
    return !hasBit(flags, KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT);
};

const getMailCapableKeys = (keys: KeyWithFlags[]) => {
    return keys.filter(({ flags }) => supportsMail(flags));
};

const getInternalKeys = (keys: KeyWithFlagsAndSource[]) => {
    return keys.filter(({ source }) => source === ApiKeySource.PROTON);
};
const getExternalKeys = (keys: KeyWithFlagsAndSource[]) => {
    return keys.filter(({ source }) => source !== ApiKeySource.PROTON);
};

const importKeys = async (keys: KeyWithFlags[]): Promise<ProcessedApiKey[]> => {
    return Promise.all(
        keys.map(async ({ armoredKey, flags }): Promise<ProcessedApiKey> => {
            return {
                armoredKey,
                flags,
                publicKey: await CryptoProxy.importPublicKey({ armoredKey }),
            };
        })
    );
};

const getPublicKeysEmailHelperWithKT = async (
    api: Api,
    Email: string,
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys,
    silence = false,
    noCache = false
): Promise<ApiKeysConfig> => {
    try {
        const { addressKeys, catchAllKeys, unverifiedKeys, addressKTResult, catchAllKTResult, ...rest } =
            await getAndVerifyApiKeys(api, Email, true, verifyOutboundPublicKeys, silence, noCache);

        // First we use verified internal address keys
        const mailCapableAddressKeys = addressKeys.filter((key) => supportsMail(key.flags));

        if (mailCapableAddressKeys.length != 0) {
            return {
                publicKeys: await importKeys(mailCapableAddressKeys),
                ktVerificationResult: addressKTResult,
                RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
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
                const status = verificationFailed
                    ? KT_VERIFICATION_STATUS.VERIFICATION_FAILED
                    : KT_VERIFICATION_STATUS.UNVERIFIED_KEYS;
                return {
                    publicKeys: await importKeys(mailCapableUnverifiedInternalKeys),
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
                    publicKeys: await importKeys(mailCapableCatchAllKeys),
                    ktVerificationResult,
                    RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                    ...rest,
                };
            }
        }

        const ktVerificationResult = {
            status: verificationFailed
                ? KT_VERIFICATION_STATUS.VERIFICATION_FAILED
                : KT_VERIFICATION_STATUS.UNVERIFIED_KEYS,
            keysChangedRecently,
        };

        // Finally we check if there are external unverified keys
        if (unverifiedKeys) {
            const mailCapableUnverifiedExternalKeys = getMailCapableKeys(getExternalKeys(unverifiedKeys));
            if (mailCapableUnverifiedExternalKeys.length != 0) {
                const firstUnverifiedKey = mailCapableUnverifiedExternalKeys[0];
                return {
                    publicKeys: await importKeys([firstUnverifiedKey]),
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
