export const VCARD_KEY_FIELDS = ['key', 'x-pm-mimetype', 'x-pm-encrypt', 'x-pm-sign', 'x-pm-scheme', 'x-pm-tls'];
export const CLEAR_FIELDS = ['version', 'prodid', 'categories'];
export const SIGNED_FIELDS = ['version', 'prodid', 'fn', 'uid', 'email'].concat(VCARD_KEY_FIELDS);

export enum CRYPTO_PROCESSING_TYPES {
    SUCCESS,
    SIGNATURE_NOT_VERIFIED,
    FAIL_TO_READ,
    FAIL_TO_LOAD,
    FAIL_TO_DECRYPT,
}

export enum OVERWRITE {
    // when UID conflict at contact import
    THROW_ERROR_IF_CONFLICT = 0,
    OVERWRITE_CONTACT = 1,
}

export enum CATEGORIES {
    IGNORE = 0,
    INCLUDE = 1,
}

export const OTHER_INFORMATION_FIELDS = [
    'bday',
    'anniversary',
    'gender',
    'lang',
    'tz',
    'geo',
    'title',
    'role',
    'photo',
    'logo',
    'org',
    'member',
    'note',
    'url',
];

export enum PGP_SCHEME_TEXT {
    INLINE = 'PGP/Inline',
    MIME = 'PGP/MIME',
}

export enum ADDRESS_COMPONENTS {
    POST_BOX,
    EXTENDED,
    STREET,
    LOCALITY,
    REGION,
    POSTAL_CODE,
    COUNTRY,
}

export const CONTACT_IMG_SIZE = 180;
