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

/**
 * This is an Inbox-specific helper, as it discards address keys from external addresses, which are not used by Inbox at the moment.
 * If support for returning such keys is added, it's important to provide a way to distinguish them from Unverified keys (e.g. from WKD)
 * which can also be present for external accounts.
 */
const getPublicKeysEmailHelperWithKT = async ({
    email,
    internalKeysOnly,
    includeInternalKeysWithE2EEDisabledForMail,
    api,
    verifyOutboundPublicKeys,
    silence,
    noCache,
}: {
    email: string;
    internalKeysOnly: boolean;
    includeInternalKeysWithE2EEDisabledForMail: boolean;
    api: Api;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys | null;
    silence?: boolean;
    noCache?: boolean;
}): Promise<ApiKeysConfig> => {
    try {
        const {
            addressKeys,
            catchAllKeys,
            unverifiedKeys,
            addressKTResult,
            catchAllKTResult,
            hasValidProtonMX,
            ...rest
        } = await getAndVerifyApiKeys({
            api,
            email,
            internalKeysOnly,
            verifyOutboundPublicKeys,
            skipVerificationOfExternalDomains: !includeInternalKeysWithE2EEDisabledForMail, // as we know we are in a Mail context
            silence,
            noCache,
        });

        // First we use verified internal address keys from internal recipients.
        // Users with internal custom domains but with bad MX setup will not be properly identifiable if they also don't have address keys
        // valid for mail encryption. For the current uses of this helper, this was deemed ok.
        if (addressKeys.length > 0) {
            const intendedForMailEncryption = !includeInternalKeysWithE2EEDisabledForMail;
            // E2EE is disabled with external forwarding, as well as in some setups with custom addresses.
            // unclear when/if it can happen that some keys have e2ee-disabled and some are not, but for now we cover the case.
            const addressKeysForMailEncryption = addressKeys.filter((key) => supportsMail(key.flags));
            const hasDisabledE2EEForMail = addressKeysForMailEncryption.length === 0;

            if (intendedForMailEncryption && addressKeysForMailEncryption.length > 0) {
                return {
                    publicKeys: castKeys(addressKeysForMailEncryption),
                    ktVerificationResult: addressKTResult,
                    RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL,
                    isCatchAll: false,
                    isInternalWithDisabledE2EEForMail: false,
                    ...rest,
                };
            } else if (intendedForMailEncryption && hasDisabledE2EEForMail && hasValidProtonMX) {
                // All keys are disabled for E2EE in mail, hence the recipient may be treated as external
                return {
                    publicKeys: [],
                    RecipientType: RECIPIENT_TYPES.TYPE_EXTERNAL,
                    isCatchAll: false,
                    isInternalWithDisabledE2EEForMail: true,
                    ktVerificationResult: {
                        status: getFailedOrUnVerified(
                            addressKTResult?.status === KT_VERIFICATION_STATUS.VERIFICATION_FAILED
                        ),
                    },
                    ...rest,
                };
            } else if (!intendedForMailEncryption && (addressKeysForMailEncryption.length > 0 || hasValidProtonMX)) {
                return {
                    publicKeys: castKeys(addressKeys), // we checked `addressKeysForMailEncryption` to determine if the recipient is internal, but we return all keys as that's requested by the caller
                    ktVerificationResult: addressKTResult,
                    RecipientType: RECIPIENT_TYPES.TYPE_INTERNAL, // as e2ee-disabled flags are ignored, then from the perspective of the caller, this is an internal recipient
                    isCatchAll: false,
                    isInternalWithDisabledE2EEForMail: hasDisabledE2EEForMail, // unused, could also be set to undefined
                    ...rest,
                };
            } // else, the recipient is believed external, and no address keys are returned
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
                    isCatchAll: false,
                    isInternalWithDisabledE2EEForMail: false,
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
                    isCatchAll: true,
                    isInternalWithDisabledE2EEForMail: false,
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
                    isCatchAll: false,
                    isInternalWithDisabledE2EEForMail: false,
                    ...rest,
                };
            }
        }
        return {
            publicKeys: [],
            RecipientType: RECIPIENT_TYPES.TYPE_EXTERNAL,
            ktVerificationResult,
            isCatchAll: false,
            isInternalWithDisabledE2EEForMail: false,
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
