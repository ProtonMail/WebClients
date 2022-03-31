import { PublicKeyReference } from '@proton/crypto';
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
    LastUsedTime: number;
}

export interface ContactCard {
    Type: CONTACT_CARD_TYPE;
    Data: string;
    Signature: string | null;
}

export interface ContactMetadata {
    ID: string;
    Name: string;
    UID: string;
    Size: number;
    CreateTime: number;
    ModifyTime: number;
    ContactEmails: ContactEmail[];
    LabelIDs: string[];
}

export interface Contact extends ContactMetadata {
    Cards: ContactCard[];
}

export interface ContactFormatted extends Contact {
    emails: string[];
}

export interface ContactWithBePinnedPublicKey {
    contactID?: string;
    emailAddress: string;
    name?: string;
    isInternal: boolean;
    bePinnedPublicKey: PublicKeyReference;
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

export type ContactValue = string | (string | string[])[];

export type ContactEmailModel = Pick<ContactEmail, 'Email' | 'ContactID' | 'LabelIDs' | 'Name'> & {
    uid: string;
    changes: { [groupID: string]: boolean };
};

export interface ContactMergeModel {
    orderedContacts: ContactFormatted[][];
    isChecked: {
        [ID: string]: boolean;
    };
    beDeleted: {
        [ID: string]: boolean;
    };
}
