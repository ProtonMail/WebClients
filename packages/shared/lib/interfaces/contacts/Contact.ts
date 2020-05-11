import { OpenPGPKey } from 'pmcrypto';
import { CONTACT_CARD_TYPE } from '../../constants';

export interface ContactEmail {
    ID: string;
    Email: string;
    Name: string;
    Type: string[];
    Defaults: number;
    Order: number;
    ContactID: string;
    LabelIDs: string[];
}

export interface ContactCard {
    Type: CONTACT_CARD_TYPE;
    Data: string;
    Signature: string | null;
}

export interface Contact {
    ID: string;
    Name: string;
    UID: string;
    Size: number;
    CreateTime: number;
    ModifyTime: number;
    ContactEmails: ContactEmail[];
    LabelIDs: string[];
    Cards: ContactCard[];
}

export interface ContactWithBePinnedPublicKey {
    contactID?: string;
    emailAddress: string;
    isInternal: boolean;
    bePinnedPublicKey: OpenPGPKey;
}

export interface ContactGroup {
    ID: string;
    Name: string;
    Color: string;
    Path: string;
    Display: number;
    Exclusive: number;
    Notify: number;
    Order: number;
    Type: number;
}

export interface ContactOrGroup {
    contact?: ContactEmail;
    group?: ContactGroup;
    major?: string;
}

export interface ContactProperty {
    pref?: number;
    field: string;
    value: string | string[];
    type?: string;
    group?: string;
}

export type ContactProperties = ContactProperty[];

export type ContactCache = Map<string, Contact>;

export type ContactEmailCache = Map<string, ContactEmail>;
