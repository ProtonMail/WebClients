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

export type VCardProperty<T = any> = {
    field: string;
    value: T;
    uid: string;
    params?: { [key: string]: string };
    group?: string;
};

export enum VCardGender {
    Male = 'M',
    Female = 'F',
    Other = 'O',
    None = 'N',
    Unknown = 'U',
    Empty = '',
}

export type VCardGenderValue = {
    gender: VCardGender;
    text?: string;
};

export type VCardAddress = {
    postOfficeBox: string;
    extendedAddress: string;
    streetAddress: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
};

export type VCardDateOrText = {
    date?: Date;
    text?: string;
};

export interface VCardContact {
    fn: VCardProperty<string>[];
    n?: VCardProperty<string[]>;
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
    geo?: VCardProperty<string>[];
    title?: VCardProperty<string>[];
    role?: VCardProperty<string>[];
    logo?: VCardProperty<string>[];
    org?: VCardProperty<string[]>[];
    member?: VCardProperty<string>[];
    related?: VCardProperty<string>[];
    note?: VCardProperty<string>[];
    url?: VCardProperty<string>[];
    categories?: VCardProperty<string>[];
    key?: VCardProperty<string>[];
    'x-pm-encrypt'?: VCardProperty<boolean>[];
    'x-pm-sign'?: VCardProperty<boolean>[];
    'x-pm-scheme'?: VCardProperty<PGP_SCHEMES>[];
    'x-pm-mimetype'?: VCardProperty<MimeTypeVcard>[];
    version?: VCardProperty<string>;
}
