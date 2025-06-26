import type { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { binaryStringToArray, decodeBase64 } from '@proton/crypto/lib/utils';
import isTruthy from '@proton/utils/isTruthy';

import { MIME_TYPES, PGP_SCHEMES } from '../constants';
import { uint8ArrayToBase64String } from '../helpers/encoding';
import type { MimeTypeVcard, PinnedKeysConfig } from '../interfaces';
import type { VCardContact, VCardProperty } from '../interfaces/contacts/VCard';
import { compareVCardPropertyByPref, createContactPropertyUid } from './properties';

/**
 * The only values allowed for a PGP scheme stored in a vCard are
 * '' for default PGP scheme (meaning we should use the PGPScheme from mailSettings when composing email)
 * 'pgp-mime' for PGP-Inline scheme
 * 'pgp-mime' for PGP-MIME scheme
 */
export const getPGPSchemeVcard = (scheme: string): PGP_SCHEMES | undefined => {
    // ugly code; typescript to be blamed
    if (Object.values(PGP_SCHEMES).includes(scheme as PGP_SCHEMES)) {
        return scheme as PGP_SCHEMES;
    }
    return undefined;
};
/**
 * The only values allowed for a MIME type stored in a vCard are
 * '' for automatic format (meaning we should use DraftMIMEType from mailSettings when composing email)
 * 'text/plain' for plain text format
 */
export const getMimeTypeVcard = (mimeType: string): MimeTypeVcard | undefined => {
    return mimeType === MIME_TYPES.PLAINTEXT ? mimeType : undefined;
};

export const getKeyVCard = async (keyValue: string): Promise<PublicKeyReference | undefined> => {
    const [, base64 = ''] = keyValue.split(',');
    const key = binaryStringToArray(decodeBase64(base64));

    if (key.length) {
        const publicKey = await CryptoProxy.importPublicKey({ binaryKey: key });
        return publicKey;
    }
};

/**
 * Given an array of vCard properties, extract the keys and key-related fields relevant for an email address
 */
export const getKeyInfoFromProperties = async (
    vCardContact: VCardContact,
    emailGroup: string
): Promise<Omit<PinnedKeysConfig, 'isContactSignatureVerified' | 'isContact'>> => {
    const getByGroup = <T>(properties: VCardProperty<T>[] = []): VCardProperty<T> | undefined =>
        properties.find(({ group }) => group === emailGroup);

    const pinnedKeyPromises = (vCardContact.key || [])
        .filter(({ group }) => group === emailGroup)
        .sort(compareVCardPropertyByPref)
        .map(async ({ value }) => getKeyVCard(value));
    const pinnedKeys = (await Promise.all(pinnedKeyPromises)).filter(isTruthy);

    const encryptToPinned =
        'x-pm-encrypt' in vCardContact ? getByGroup(vCardContact['x-pm-encrypt'])?.value : undefined;
    const encryptToUntrusted =
        'x-pm-encrypt-untrusted' in vCardContact
            ? getByGroup(vCardContact['x-pm-encrypt-untrusted'])?.value
            : undefined;

    const scheme = getByGroup(vCardContact['x-pm-scheme'])?.value;
    const mimeType = getByGroup(vCardContact['x-pm-mimetype'])?.value;
    const sign = getByGroup(vCardContact['x-pm-sign'])?.value;

    return { pinnedKeys, encryptToPinned, encryptToUntrusted, scheme, mimeType, sign };
};

interface VcardPublicKey {
    publicKey: PublicKeyReference;
    group: string;
    index: number;
}

/**
 * Transform a key into a vCard property
 */
export const toKeyProperty = async ({ publicKey, group, index }: VcardPublicKey): Promise<VCardProperty<string>> => {
    const binaryKey = await CryptoProxy.exportPublicKey({ key: publicKey, format: 'binary' });
    return {
        field: 'key',
        value: `data:application/pgp-keys;base64,${uint8ArrayToBase64String(binaryKey)}`,
        group,
        params: { pref: String(index + 1) }, // order is important
        uid: createContactPropertyUid(),
    };
};
