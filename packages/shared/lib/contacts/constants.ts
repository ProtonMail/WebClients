// BACK-END DATA
import { BASE_SIZE } from '../constants';

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

export const API_SAFE_INTERVAL = 100; // API request limit: 100 requests / 10 seconds, so 1 request every 100 ms is safe
export const QUERY_EXPORT_MAX_PAGESIZE = 50; // in GET API route /contacts/export
// Manual limit on number of imported contacts to be sent to the API, so that the response does not take too long
export const ADD_CONTACTS_MAX_SIZE = 10;

// FRONT-END RESTRICTIONS
export const MAX_SIMULTANEOUS_CONTACTS_ENCRYPT = 5;

export const MAX_IMPORT_CONTACTS = 10000;
export const MAX_IMPORT_CONTACTS_STRING = "10'000";
export const MAX_IMPORT_FILE_SIZE = 10 * BASE_SIZE ** 2;
export const MAX_IMPORT_FILE_SIZE_STRING = '10 MB';
export const MAX_UID_CHARS_DISPLAY = 43;
export const MAX_FILENAME_CHARS_DISPLAY = 100;
