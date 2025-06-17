import type { MaybeArray } from '@proton/pass/types';

export type KeeperCustomFieldValue = MaybeArray<string | Record<string, string>>;

export type KeeperCustomFields = Record<string, KeeperCustomFieldValue> & {
    '$note::1'?: string;
    '$oneTimeCode::1'?: string;
    '$text:cardholderName:1'?: string;
    '$pinCode::1'?: string;
    '$text:company:1'?: string;
    '$email::1': string;
    '$text:SSID:1'?: string;
    '$paymentCard::1'?: { cardNumber?: string; cardExpirationDate?: string; cardSecurityCode?: string };
    '$name::1'?: { first: string; middle: string; last: string };
    '$keyPair::1'?: { publicKey: string; privateKey: string };
    '$host::1'?: { hostName: string; port: string };
};

export type KeeperPhoneField = {
    number?: string;
    ext?: string;
    type?: string;
    region?: string;
};

export type KeeperFolder = {
    folder?: string;
};

export type KeeperItemType =
    | 'login'
    | 'encryptedNotes'
    | 'bankCard'
    | 'ssnCard'
    | 'contact'
    | 'file'
    | 'address'
    | 'sshKeys'
    | 'wifiCredentials';

export type KeeperItem = {
    uid: string;
    title: string;
    /** This list of item types is not exhaustive */
    $type?: KeeperItemType;
    login?: string;
    password?: string;
    login_url?: string;
    notes?: string;
    custom_fields?: KeeperCustomFields;
    folders?: KeeperFolder[] | null;
};

export type KeeperData = {
    shared_folders: any[];
    records: KeeperItem[];
};
