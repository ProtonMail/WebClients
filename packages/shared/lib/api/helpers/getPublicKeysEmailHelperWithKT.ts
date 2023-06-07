import { CryptoProxy } from '@proton/crypto';
import { KTPublicKeyStatus } from '@proton/key-transparency/lib';

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

const { KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID } = API_CUSTOM_ERROR_CODES;
const EMAIL_ERRORS = [KEY_GET_ADDRESS_MISSING, KEY_GET_DOMAIN_MISSING_MX, KEY_GET_INPUT_INVALID];

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

const getKTVerificationStatus = (status: KTPublicKeyStatus | undefined): KT_VERIFICATION_STATUS | undefined => {
    switch (status) {
        case undefined:
            return undefined;
        case KTPublicKeyStatus.VERIFIED_PRESENT:
            return KT_VERIFICATION_STATUS.VERIFIED_KEYS;
        case KTPublicKeyStatus.VERIFIED_ABSENT:
        case KTPublicKeyStatus.VERIFICATION_SKIPPED:
            return KT_VERIFICATION_STATUS.UNVERIFIED_KEYS;
        default:
            return KT_VERIFICATION_STATUS.VERIFICATION_FAILED;
    }
};

const getPublicKeysEmailHelperWithKT = async (
    api: Api,
    Email: string,
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys,
    silence = false,
    noCache = false
): Promise<ApiKeysConfig> => {
    try {
        const { addressKeys, catchAllKeys, unverifiedKeys, addressKTStatus, catchAllKTStatus, ...rest } =
            await getAndVerifyApiKeys(api, Email, true, verifyOutboundPublicKeys, silence, noCache);

        // First we use verified internal address keys
        const mailCapableAddressKeys = addressKeys.filter((key) => supportsMail(key.flags));

        if (mailCapableAddressKeys.length != 0) {
            return {
                publicKeys: await importKeys(mailCapableAddressKeys),
                ktVerificationStatus: addressKTStatus ? getKTVerificationStatus(addressKTStatus) : undefined,
                RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                ...rest,
            };
        }

        // Then we check if there are unverified internal address keys
        if (unverifiedKeys) {
            const mailCapableUnverifiedInternalKeys = getMailCapableKeys(getInternalKeys(unverifiedKeys));
            if (mailCapableUnverifiedInternalKeys.length != 0) {
                const ktVerificationStatus =
                    addressKTStatus === KTPublicKeyStatus.VERIFICATION_FAILED
                        ? KT_VERIFICATION_STATUS.VERIFICATION_FAILED
                        : KT_VERIFICATION_STATUS.UNVERIFIED_KEYS;

                return {
                    publicKeys: await importKeys(mailCapableUnverifiedInternalKeys),
                    ktVerificationStatus,
                    RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                    ...rest,
                };
            }
        }
        // Then we check if there are internal catchall keys
        if (catchAllKeys) {
            const mailCapableCatchAllKeys = getMailCapableKeys(catchAllKeys);
            if (mailCapableCatchAllKeys.length != 0) {
                const ktVerificationStatus =
                    addressKTStatus === KTPublicKeyStatus.VERIFICATION_FAILED
                        ? KT_VERIFICATION_STATUS.VERIFICATION_FAILED
                        : getKTVerificationStatus(catchAllKTStatus);

                return {
                    publicKeys: await importKeys(mailCapableCatchAllKeys),
                    ktVerificationStatus,
                    RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                    ...rest,
                };
            }
        }

        const verificationFailed =
            addressKTStatus === KTPublicKeyStatus.VERIFICATION_FAILED ||
            catchAllKTStatus === KTPublicKeyStatus.VERIFICATION_FAILED;
        const ktVerificationStatus = verificationFailed
            ? KT_VERIFICATION_STATUS.VERIFICATION_FAILED
            : KT_VERIFICATION_STATUS.UNVERIFIED_KEYS;

        // Finally we check if there are external unverified keys
        if (unverifiedKeys) {
            const mailCapableUnverifiedExternalKeys = getMailCapableKeys(getExternalKeys(unverifiedKeys));
            if (mailCapableUnverifiedExternalKeys.length != 0) {
                const firstUnverifiedKey = mailCapableUnverifiedExternalKeys[0];
                return {
                    publicKeys: await importKeys([firstUnverifiedKey]),
                    ktVerificationStatus,
                    RecipientType: RECIPIENT_TYPES.TYPE_EXTERNAL,
                    ...rest,
                };
            }
        }
        return {
            publicKeys: [],
            RecipientType: RECIPIENT_TYPES.TYPE_EXTERNAL,
            ktVerificationStatus,
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
