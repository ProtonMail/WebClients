import { c } from 'ttag';

import type { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy, serverTime } from '@proton/crypto';

import { KEY_FLAG, MIME_TYPES_MORE, PGP_SCHEMES_MORE, RECIPIENT_TYPES } from '../constants';
import { hasBit } from '../helpers/bitset';
import { canonicalizeEmailByGuess, canonicalizeInternalEmail, extractEmailFromUserID } from '../helpers/email';
import { toBitMap } from '../helpers/object';
import type { ApiKeysConfig, ContactPublicKeyModel, PublicKeyConfigs, PublicKeyModel } from '../interfaces';
import { getKeyHasFlagsToEncrypt } from './keyFlags';

const { TYPE_INTERNAL } = RECIPIENT_TYPES;

/**
 * Check if some API key data belongs to an internal user
 */
export const getIsInternalUser = ({ RecipientType }: ApiKeysConfig): boolean => RecipientType === TYPE_INTERNAL;

/**
 * Test if no key is enabled
 */
export const isDisabledUser = (config: ApiKeysConfig): boolean =>
    getIsInternalUser(config) && config.publicKeys.every(({ flags }) => !getKeyHasFlagsToEncrypt(flags));

export const getEmailMismatchWarning = (
    publicKey: PublicKeyReference,
    emailAddress: string,
    isInternal: boolean
): string[] => {
    const canonicalEmail = isInternal
        ? canonicalizeInternalEmail(emailAddress)
        : canonicalizeEmailByGuess(emailAddress);
    const userIDs = publicKey.getUserIDs();
    const keyEmails = userIDs.reduce<string[]>((acc, userID) => {
        const email = extractEmailFromUserID(userID) || userID;
        // normalize the email
        acc.push(email);
        return acc;
    }, []);
    const canonicalKeyEmails = keyEmails.map((email) =>
        isInternal ? canonicalizeInternalEmail(email) : canonicalizeEmailByGuess(email)
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
export const sortApiKeys = ({
    keys = [],
    obsoleteFingerprints,
    compromisedFingerprints,
    trustedFingerprints,
    primaryKeyFingerprints,
    preferV6Keys,
}: {
    keys: PublicKeyReference[];
    obsoleteFingerprints: Set<string>;
    compromisedFingerprints: Set<string>;
    trustedFingerprints: Set<string>;
    primaryKeyFingerprints: Set<string>;
    preferV6Keys: boolean;
}): PublicKeyReference[] =>
    keys
        .reduce<PublicKeyReference[][]>(
            (acc, key) => {
                const fingerprint = key.getFingerprint();
                // calculate order through a bitmap
                const index = toBitMap({
                    // give precedence to either v4 or v6 primary key (NB: none of the v6 keys might be primary).
                    // NB: a non-primary v6 key should NOT take precedence over a primary v4 key to avoid breaking e2ee forwarding.
                    isNotPreferredVersion: preferV6Keys ? key.getVersion() !== 6 : key.getVersion() !== 4,
                    isNotPrimary: !primaryKeyFingerprints.has(fingerprint),
                    isObsolete: obsoleteFingerprints.has(fingerprint),
                    isCompromised: compromisedFingerprints.has(fingerprint),
                    isNotTrusted: !trustedFingerprints.has(fingerprint),
                });
                acc[index].push(key);
                return acc;
            },
            Array.from({ length: 32 }).map(() => [])
        )
        .flat();

/**
 * Sort list of pinned keys retrieved from the API. Keys that can be used for sending take preference
 */
export const sortPinnedKeys = ({
    keys = [],
    obsoleteFingerprints,
    compromisedFingerprints,
    encryptionCapableFingerprints,
    preferV6Keys,
}: {
    keys: PublicKeyReference[];
    obsoleteFingerprints: Set<string>;
    compromisedFingerprints: Set<string>;
    encryptionCapableFingerprints: Set<string>;
    preferV6Keys: boolean;
}): PublicKeyReference[] =>
    keys
        .reduce<PublicKeyReference[][]>(
            (acc, key) => {
                const fingerprint = key.getFingerprint();
                // calculate order through a bitmap
                const index = toBitMap({
                    isNotPreferredVersion: preferV6Keys ? key.getVersion() !== 6 : key.getVersion() !== 4,
                    isObsolete: obsoleteFingerprints.has(fingerprint),
                    isCompromised: compromisedFingerprints.has(fingerprint),
                    cannotSend: !encryptionCapableFingerprints.has(fingerprint),
                });
                acc[index].push(key);
                return acc;
            },
            Array.from({ length: 16 }).map(() => [])
        )
        .flat();

/**
 * Given a public key, return true if it is capable of encrypting messages.
 * This includes checking that the key is neither expired nor revoked.
 */
export const getKeyEncryptionCapableStatus = async (publicKey: PublicKeyReference, timestamp?: number) => {
    const now = timestamp || +serverTime();
    return CryptoProxy.canKeyEncrypt({ key: publicKey, date: new Date(now) });
};

/**
 * Check if a public key is valid for sending according to the information stored in a public key model
 * We rely only on the fingerprint of the key to do this check
 */
export const getIsValidForSending = (fingerprint: string, publicKeyModel: PublicKeyModel | ContactPublicKeyModel) => {
    const { compromisedFingerprints, obsoleteFingerprints, encryptionCapableFingerprints } = publicKeyModel;
    return (
        !compromisedFingerprints.has(fingerprint) &&
        !obsoleteFingerprints.has(fingerprint) &&
        encryptionCapableFingerprints.has(fingerprint)
    );
};

const getIsValidForVerifying = (fingerprint: string, compromisedFingerprints: Set<string>) => {
    return !compromisedFingerprints.has(fingerprint);
};

export const getVerifyingKeys = (keys: PublicKeyReference[], compromisedFingerprints: Set<string>) => {
    return keys.filter((key) => getIsValidForVerifying(key.getFingerprint(), compromisedFingerprints));
};

/**
 * For a given email address and its corresponding public keys (retrieved from the API and/or the corresponding vCard),
 * construct the contact public key model, which reflects the content of the vCard.
 */
export const getContactPublicKeyModel = async ({
    emailAddress,
    apiKeysConfig,
    pinnedKeysConfig,
    preferV6Keys,
}: Omit<PublicKeyConfigs, 'mailSettings'>): Promise<ContactPublicKeyModel> => {
    const {
        pinnedKeys = [],
        encryptToPinned,
        encryptToUntrusted,
        sign,
        scheme: vcardScheme,
        mimeType: vcardMimeType,
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
    } = pinnedKeysConfig;
    const trustedFingerprints = new Set<string>();
    const encryptionCapableFingerprints = new Set<string>();
    const obsoleteFingerprints = new Set<string>();
    const compromisedFingerprints = new Set<string>();
    const primaryKeyFingerprints = new Set<string>(); // either one or two keys expected (v4 + maybe v6)

    // prepare keys retrieved from the API
    const isInternalUser = getIsInternalUser(apiKeysConfig);
    const isExternalUser = !isInternalUser;
    const processedApiKeys = apiKeysConfig.publicKeys;
    const apiKeys = processedApiKeys.map(({ publicKey }) => publicKey);
    await Promise.all(
        processedApiKeys.map(async ({ publicKey, flags, primary }) => {
            const fingerprint = publicKey.getFingerprint();
            const canEncrypt = await getKeyEncryptionCapableStatus(publicKey);
            if (canEncrypt) {
                encryptionCapableFingerprints.add(fingerprint);
            }
            if (primary) {
                primaryKeyFingerprints.add(fingerprint);
            }
            if (!hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED)) {
                compromisedFingerprints.add(fingerprint);
            }
            if (!hasBit(flags, KEY_FLAG.FLAG_NOT_OBSOLETE)) {
                obsoleteFingerprints.add(fingerprint);
            }
        })
    );

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
    const orderedPinnedKeys = sortPinnedKeys({
        keys: pinnedKeys,
        obsoleteFingerprints,
        compromisedFingerprints,
        encryptionCapableFingerprints,
        preferV6Keys,
    });

    const orderedApiKeys = sortApiKeys({
        keys: apiKeys,
        trustedFingerprints,
        obsoleteFingerprints,
        compromisedFingerprints,
        primaryKeyFingerprints,
        preferV6Keys,
    });

    let encrypt: boolean | undefined = undefined;
    if (pinnedKeys.length > 0) {
        // Some old contacts with pinned WKD keys did not store the `x-pm-encrypt` flag,
        // since encryption was always enabled, so we treat an 'undefined' flag as 'true'.
        encrypt = encryptToPinned !== false;
    } else if (isExternalUser && apiKeys.length > 0) {
        // Enable encryption by default for contacts with no `x-pm-encrypt-untrusted` flag.
        encrypt = encryptToUntrusted !== false;
    }

    return {
        encrypt,
        sign,
        scheme: vcardScheme || PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        mimeType: vcardMimeType || MIME_TYPES_MORE.AUTOMATIC,
        emailAddress,
        publicKeys: {
            apiKeys: orderedApiKeys,
            pinnedKeys: orderedPinnedKeys,
            verifyingPinnedKeys: getVerifyingKeys(orderedPinnedKeys, compromisedFingerprints),
        },
        isInternalWithDisabledE2EEForMail: !!apiKeysConfig.isInternalWithDisabledE2EEForMail,
        trustedFingerprints,
        obsoleteFingerprints,
        compromisedFingerprints,
        encryptionCapableFingerprints,
        primaryKeyFingerprints,
        isPGPExternal: isExternalUser,
        isPGPInternal: isInternalUser,
        isPGPExternalWithExternallyFetchedKeys: isExternalUser && !!apiKeys.length,
        isPGPExternalWithoutExternallyFetchedKeys: isExternalUser && !apiKeys.length,
        pgpAddressDisabled: isDisabledUser(apiKeysConfig),
        isContact,
        isContactSignatureVerified,
        contactSignatureTimestamp,
        emailAddressWarnings: apiKeysConfig.Warnings,
        emailAddressErrors: apiKeysConfig.Errors,
        ktVerificationResult: apiKeysConfig.ktVerificationResult,
    };
};
