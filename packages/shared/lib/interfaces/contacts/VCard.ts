import { PGP_SCHEMES } from '../../constants';
import { MimeTypeVcard } from '../EncryptionPreferences';

export type VCardKey =
    | 'fn'
    | 'n'
    | 'nickname'
    | 'email'
    | 'tel'
    | 'adr'
    | 'bday'
    | 'anniversary'
    | 'gender'
    | 'lang'
    | 'tz'
    | 'geo'
    | 'title'
    | 'role'
    | 'logo'
    | 'org'
    | 'related'
    | 'member'
    | 'note'
    | 'url';

export type ParamKey =
    | 'language'
    | 'value'
    | 'pref'
    | 'altid'
    | 'pid'
    | 'type'
    | 'mediatype'
    | 'calscale'
    | 'sort-as'
    | 'geo'
    | 'tz';

export interface VCardProperty<T = any> {
    value: T;
    params?: Partial<Record<ParamKey, string>>;
    group?: string;
    /**
     * Proton specific: outside of RFC's scope
     */
    field: string;
    uid: string;
}

export interface VcardNValue {
    familyNames: string[];
    givenNames: string[];
    additionalNames: string[];
    honorificPrefixes: string[];
    honorificSuffixes: string[];
}

export enum VCardGender {
    Male = 'M',
    Female = 'F',
    Other = 'O',
    None = 'N',
    Unknown = 'U',
    Empty = '',
}

export interface VCardOrg {
    organizationalName?: string;
    organizationalUnitNames?: string[];
}

export interface VCardGenderValue {
    gender: VCardGender;
    text?: string;
}

export interface VCardAddress {
    postOfficeBox: string;
    extendedAddress: string;
    streetAddress: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
}

export type VCardDateOrText =
    | {
          /**
           * Local date
           */
          date?: Date;
      }
    | {
          text?: string;
      };

interface BaseVCardContact {
    fn: VCardProperty<string>[];
    n?: VCardProperty<VcardNValue>;
    nickname?: VCardProperty<string>[];
    photo?: VCardProperty<string>[];
    bday?: VCardProperty<VCardDateOrText>;
    anniversary?: VCardProperty<VCardDateOrText>;
    gender?: VCardProperty<VCardGenderValue>;
    adr?: VCardProperty<VCardAddress>[];
    tel?: VCardProperty<string>[];
    email?: VCardProperty<string>[];
    impp?: VCardProperty<string>[];
    lang?: VCardProperty<string>[];
    tz?: VCardProperty<string>[];
    geo?: VCardProperty<string>[];
    title?: VCardProperty<string>[];
    role?: VCardProperty<string>[];
    logo?: VCardProperty<string>[];
    org?: VCardProperty<VCardOrg>[];
    member?: VCardProperty<string>[];
    related?: VCardProperty<string>[];
    note?: VCardProperty<string>[];
    url?: VCardProperty<string>[];
    /**
     * Array-valued categories pose problems to ICAL (even though a vcard with CATEGORIES:ONE,TWO
     * will be parsed into a value ['ONE', 'TWO'], ICAL.js fails to transform it back).
     * So we prefer storing array-valued category as several properties
     */
    categories?: VCardProperty<string>[];
    key?: VCardProperty<string>[];
    version?: VCardProperty<string>;
    'x-pm-sign'?: VCardProperty<boolean>[];
    'x-pm-scheme'?: VCardProperty<PGP_SCHEMES>[];
    'x-pm-mimetype'?: VCardProperty<MimeTypeVcard>[];
}

export type VCardContact = BaseVCardContact &
    (
        | {
              /**
               * Encryption flag that applies if 'key' field (i.e. pinned keys) is populated
               */
              'x-pm-encrypt'?: VCardProperty<boolean>[];
          }
        | {
              /**
               * Encryption flag that applies to (unpinned) keys from e.g. WKD or other untrusted servers
               */
              'x-pm-encrypt-untrusted'?: VCardProperty<boolean>[];
          }
    );
