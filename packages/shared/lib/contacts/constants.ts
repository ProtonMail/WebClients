export const VCARD_KEY_FIELDS = ['key', 'x-pm-mimetype', 'x-pm-encrypt', 'x-pm-sign', 'x-pm-scheme', 'x-pm-tls'];
export const CLEAR_FIELDS = ['version', 'prodid', 'categories'];
export const SIGNED_FIELDS = ['version', 'prodid', 'fn', 'uid', 'email'].concat(VCARD_KEY_FIELDS);

export enum CRYPTO_PROCESSING_TYPES {
    SUCCESS,
    SIGNATURE_NOT_VERIFIED,
    FAIL_TO_READ,
    FAIL_TO_LOAD,
    FAIL_TO_DECRYPT
}
