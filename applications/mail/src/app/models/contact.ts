export interface ContactOrGroup {
    contact?: ContactEmail;
    group?: ContactGroup;
}

export interface Contact {
    ID?: string;
    Name?: string;
    UID?: string;
    Size?: number;
    CreateTime?: number;
    ModifyTime?: number;
    ContactEmails?: ContactEmail[];
    LabelIDs?: string[];
    Cards?: Card[];
}

export interface ContactEmail {
    ID?: string;
    Name?: string;
    Email?: string;
    Type?: string;
    Defaults?: number;
    Order?: number;
    ContactID?: string;
    LabelIDs?: string[];
}

export interface ContactGroup {
    ID?: string;
    Name?: string;
    Color?: string;
    Path?: string;
    Display?: number;
    Exclusive?: number;
    Notify?: number;
    Order?: number;
    Type?: number;
}

export interface Card {
    Type?: number;
    Data?: string;
    Signature?: string;
}

export type ContactCache = Map<string, Contact>;

export type ContactEmailCache = Map<string, ContactEmail>;
