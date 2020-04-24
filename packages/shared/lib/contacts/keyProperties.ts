import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64, getKeys, OpenPGPKey } from 'pmcrypto';
import { DRAFT_MIME_TYPES, PGP_SCHEMES } from '../constants';
import { noop } from '../helpers/function';
import isTruthy from '../helpers/isTruthy';
import { MimeTypeVcard, PinnedKeysConfig, PublicKeyWithPref } from '../interfaces';
import { ContactProperties, ContactProperty } from '../interfaces/contacts';
import { VCARD_KEY_FIELDS } from './constants';
import { sortByPref } from './properties';

/**
 * The only values allowed for a PGP scheme stored in a vCard are
 * '' for default PGP scheme (meaning we should use the PGPScheme from mailSettings when composing email)
 * 'pgp-mime' for PGP-Inline scheme
 * 'pgp-mime' for PGP-MIME scheme
 */
const getPGPSchemeVcard = (scheme: string): PGP_SCHEMES | undefined => {
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
const getMimeTypeVcard = (mimeType: string): MimeTypeVcard | undefined => {
    return mimeType === DRAFT_MIME_TYPES.PLAINTEXT ? mimeType : undefined;
};
/**
 * Given an array of vCard properties, extract the keys and key-related fields relevant for an email address
 */
export const getKeyInfoFromProperties = async (
    properties: ContactProperties,
    emailGroup: string
): Promise<Omit<PinnedKeysConfig, 'isContactSignatureVerified'>> => {
    const { pinnedKeyPromises, mimeType, encrypt, scheme, sign } = properties
        .filter(({ field, group }) => VCARD_KEY_FIELDS.includes(field) && group === emailGroup)
        .reduce<{
            pinnedKeyPromises: Promise<PublicKeyWithPref | undefined>[];
            encrypt?: boolean;
            sign?: boolean;
            scheme?: PGP_SCHEMES;
            mimeType?: MimeTypeVcard;
        }>(
            (acc, { field, value, pref }) => {
                if (field === 'key' && value) {
                    const [, base64 = ''] = (value as string).split(',');
                    const key = binaryStringToArray(decodeBase64(base64));

                    if (key.length) {
                        const promise = getKeys(key)
                            .then(([publicKey]) => ({ publicKey, pref }))
                            .catch(noop);
                        acc.pinnedKeyPromises.push(promise);
                    }

                    return acc;
                }
                if (field === 'x-pm-encrypt' && value) {
                    acc.encrypt = value === 'true';
                    return acc;
                }
                if (field === 'x-pm-sign' && value) {
                    acc.sign = value === 'true';
                    return acc;
                }
                if (field === 'x-pm-scheme' && value) {
                    acc.scheme = getPGPSchemeVcard(value as string);
                    return acc;
                }
                if (field === 'x-pm-mimetype' && value) {
                    acc.mimeType = getMimeTypeVcard(value as string);
                    return acc;
                }
                return acc;
            },
            {
                // Default values
                pinnedKeyPromises: [],
                encrypt: undefined,
                sign: undefined,
                scheme: undefined,
                mimeType: undefined
            }
        );
    const rawPinnedKeys = (await Promise.all(pinnedKeyPromises)).filter(isTruthy);
    const pinnedKeys = rawPinnedKeys.sort(sortByPref).map(({ publicKey }) => publicKey);

    return { pinnedKeys, encrypt, scheme, mimeType, sign };
};

interface VcardPublicKey {
    publicKey: OpenPGPKey;
    group: string;
    index: number;
}

/**
 * Transform a key into a vCard property
 */
export const toKeyProperty = ({ publicKey, group, index }: VcardPublicKey): ContactProperty => ({
    field: 'key',
    value: `data:application/pgp-keys;base64,${encodeBase64(
        arrayToBinaryString(publicKey.toPacketlist().write() as Uint8Array)
    )}`,
    group,
    pref: index + 1 // order is important
});
