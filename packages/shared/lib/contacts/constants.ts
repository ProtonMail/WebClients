// BACK-END DATA
import { BASE_SIZE } from '../helpers/size';

export const VCARD_KEY_FIELDS = [
    'key',
    'x-pm-mimetype',
    'x-pm-encrypt',
    'x-pm-encrypt-untrusted',
    'x-pm-sign',
    'x-pm-scheme',
    'x-pm-tls',
];
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
    'anniversary',
    'gender',
    'lang',
    'tz',
    'title',
    'role',
    'photo',
    'logo',
    'org',
    'member',
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

export const API_SAFE_INTERVAL = 100; // API request limit: 100 requests / 10 seconds, so 1 request every 100 ms is safe
export const QUERY_EXPORT_MAX_PAGESIZE = 50; // in GET API route /contacts/export
// Manual limit on number of imported contacts to be sent to the API, so that the response does not take too long
export const ADD_CONTACTS_MAX_SIZE = 10;

// FRONT-END RESTRICTIONS
export const MAX_SIMULTANEOUS_CONTACTS_ENCRYPT = 5;

export const MAX_CONTACTS_PER_USER = 10000;
export const MAX_IMPORT_CONTACTS_STRING = MAX_CONTACTS_PER_USER.toLocaleString();
export const MAX_IMPORT_FILE_SIZE = 10 * BASE_SIZE ** 2;
export const MAX_IMPORT_FILE_SIZE_STRING = '10 MB';
export const MAX_CONTACT_ID_CHARS_DISPLAY = 40;
export const MAX_FILENAME_CHARS_DISPLAY = 100;
export const CONTACT_NAME_MAX_LENGTH = 190;
// We remove one to avoid issue with space when computing the full name
export const CONTACT_FIRST_LAST_NAME_MAX_LENGTH = CONTACT_NAME_MAX_LENGTH / 2 - 1;

export const UID_PREFIX = 'contact-property';
