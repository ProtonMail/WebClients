import { OpenPGPKey, serverTime, canKeyEncrypt } from 'pmcrypto';
import { c } from 'ttag';
import { KEY_FLAG, MIME_TYPES_MORE, PGP_SCHEMES_MORE, RECIPIENT_TYPES } from '../constants';
import { canonizeEmailByGuess, canonizeInternalEmail } from '../helpers/email';
import isTruthy from '../helpers/isTruthy';
import { toBitMap } from '../helpers/object';
import { ApiKeysConfig, ContactPublicKeyModel, PublicKeyConfigs, PublicKeyModel } from '../interfaces';
import { hasBit } from '../helpers/bitset';

const { TYPE_INTERNAL } = RECIPIENT_TYPES;

/**
 * Check if some API key data belongs to an internal user
 */
export const getIsInternalUser = ({ RecipientType }: ApiKeysConfig): boolean => RecipientType === TYPE_INTERNAL;

/**
 * Test if no key is enabled
 */
export const isDisabledUser = (config: ApiKeysConfig): boolean =>
    getIsInternalUser(config) && !config.Keys.some(({ Flags }) => hasBit(Flags, KEY_FLAG.FLAG_NOT_OBSOLETE));

export const getEmailMismatchWarning = (publicKey: OpenPGPKey, emailAddress: string, isInternal: boolean): string[] => {
    const canonicalEmail = isInternal ? canonizeInternalEmail(emailAddress) : canonizeEmailByGuess(emailAddress);
    const users = publicKey.users || [];
    const keyEmails = users.reduce<string[]>((acc, { userId = {} } = {}) => {
        if (!userId?.userid) {
            // userId can be set to null
            return acc;
        }
        const [, email = userId.userid] = /<([^>]*)>/.exec(userId.userid) || [];
        // normalize the email
        acc.push(email);
        return acc;
    }, []);
    const canonicalKeyEmails = keyEmails.map((email) =>
        isInternal ? canonizeInternalEmail(email) : canonizeEmailByGuess(email)
    );
    if (!canonicalKeyEmails.includes(canonicalEmail)) {
        const keyUserIds = keyEmails.join(', ');
        return [c('PGP key warning').t`Email address not found among user ids defined in sending key (${keyUserIds})`];
    }
    return [];
};

/**
 * Sort list of keys retrieved from the API. Trusted keys take preference.
 * For two keys such that both are either trusted or not, non-verify-only keys take preference
 */
export const sortApiKeys = (
    keys: OpenPGPKey[] = [],
    trustedFingerprints: Set<string>,
    verifyOnlyFingerprints: Set<string>
): OpenPGPKey[] =>
    keys
        .reduce<OpenPGPKey[][]>(
            (acc, key) => {
                const fingerprint = key.getFingerprint();
                // calculate order through a bitmap
                const index = toBitMap({
                    isVerificationOnly: verifyOnlyFingerprints.has(fingerprint),
                    isNotTrusted: !trustedFingerprints.has(fingerprint),
                });
                acc[index].push(key);
                return acc;
            },
            Array.from({ length: 4 }).map(() => [])
        )
        .flat();

/**
 * Sort list of pinned keys retrieved from the API. Keys that can be used for sending take preference
 */
export const sortPinnedKeys = (keys: OpenPGPKey[] = [], encryptionCapableFingerprints: Set<string>): OpenPGPKey[] =>
    keys
        .reduce<OpenPGPKey[][]>(
            (acc, key) => {
                const fingerprint = key.getFingerprint();
                // calculate order through a bitmap
                const index = toBitMap({
                    cannotSend: !encryptionCapableFingerprints.has(fingerprint),
                });
                acc[index].push(key);
                return acc;
            },
            Array.from({ length: 2 }).map(() => [])
        )
        .flat();

/**
 * Given a public key, return true if it is capable of encrypting messages.
 * This includes checking that the key is neither expired nor revoked.
 */
export const getKeyEncryptionCapableStatus = async (publicKey: OpenPGPKey, timestamp?: number): Promise<boolean> => {
    const now = timestamp || +serverTime();
    return canKeyEncrypt(publicKey, new Date(now));
};

/**
 * Given a public key retrieved from the API, return true if it has been marked as obsolete, and it is thus
 * verification-only. Return false if it's marked valid for encryption. Return undefined otherwise
 */
export const getKeyVerificationOnlyStatus = (publicKey: OpenPGPKey, config: ApiKeysConfig): boolean | undefined => {
    const fingerprint = publicKey.getFingerprint();
    const index = config.publicKeys.findIndex((publicKey) => publicKey?.getFingerprint() === fingerprint);
    if (index === -1) {
        return undefined;
    }
    return !hasBit(config.Keys[index].Flags, KEY_FLAG.FLAG_NOT_OBSOLETE);
};

/**
 * Check if a public key is valid for sending according to the information stored in a public key model
 * We rely only on the fingerprint of the key to do this check
 */
export const getIsValidForSending = (
    fingerprint: string,
    publicKeyModel: PublicKeyModel | ContactPublicKeyModel
): boolean => {
    const { verifyOnlyFingerprints, encryptionCapableFingerprints } = publicKeyModel;
    return !verifyOnlyFingerprints.has(fingerprint) && encryptionCapableFingerprints.has(fingerprint);
};

/**
 * For a given email address and its corresponding public keys (retrieved from the API and/or the corresponding vCard),
 * construct the contact public key model, which reflects the content of the vCard.
 */
export const getContactPublicKeyModel = async ({
    emailAddress,
    apiKeysConfig,
    pinnedKeysConfig,
}: Omit<PublicKeyConfigs, 'mailSettings'>): Promise<ContactPublicKeyModel> => {
    const {
        pinnedKeys = [],
        encrypt,
        sign,
        scheme: vcardScheme,
        mimeType: vcardMimeType,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
    } = pinnedKeysConfig;
    const trustedFingerprints = new Set<string>();
    const encryptionCapableFingerprints = new Set<string>();

    // prepare keys retrieved from the vCard
    await Promise.all(
        pinnedKeys.map(async (publicKey) => {
            const fingerprint = publicKey.getFingerprint();
            const canEncrypt = await getKeyEncryptionCapableStatus(publicKey);
            trustedFingerprints.add(fingerprint);
            if (canEncrypt) {
                encryptionCapableFingerprints.add(fingerprint);
            }
        })
    );
    const orderedPinnedKeys = sortPinnedKeys(pinnedKeys, encryptionCapableFingerprints);

    // prepare keys retrieved from the API
    const isInternalUser = getIsInternalUser(apiKeysConfig);
    const isExternalUser = !isInternalUser;
    const verifyOnlyFingerprints = new Set<string>();
    const apiKeys = apiKeysConfig.publicKeys.filter(isTruthy);
    await Promise.all(
        apiKeys.map(async (publicKey) => {
            const fingerprint = publicKey.getFingerprint();
            if (getKeyVerificationOnlyStatus(publicKey, apiKeysConfig)) {
                verifyOnlyFingerprints.add(publicKey.getFingerprint());
            }
            const canEncrypt = await getKeyEncryptionCapableStatus(publicKey);
            if (canEncrypt) {
                encryptionCapableFingerprints.add(fingerprint);
            }
        })
    );

    const orderedApiKeys = sortApiKeys(apiKeys, trustedFingerprints, verifyOnlyFingerprints);

    return {
        encrypt,
        sign,
        scheme: vcardScheme || PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        mimeType: vcardMimeType || MIME_TYPES_MORE.AUTOMATIC,
        emailAddress,
        publicKeys: { apiKeys: orderedApiKeys, pinnedKeys: orderedPinnedKeys },
        trustedFingerprints,
        verifyOnlyFingerprints,
        encryptionCapableFingerprints,
        isPGPExternal: isExternalUser,
        isPGPInternal: isInternalUser,
        isPGPExternalWithWKDKeys: isExternalUser && !!apiKeys.length,
        isPGPExternalWithoutWKDKeys: isExternalUser && !apiKeys.length,
        pgpAddressDisabled: isDisabledUser(apiKeysConfig),
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings: apiKeysConfig.Warnings,
        emailAddressErrors: apiKeysConfig.Errors,
    };
};
