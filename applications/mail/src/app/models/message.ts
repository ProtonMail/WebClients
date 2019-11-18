export interface Recipient {
    Name?: string;
    Address?: string;
}

export interface Attachment {
    ID?: number;
    Name?: string;
    Size?: number;
    Preview?: any;
    KeyPackets?: any;
    MIMEType?: string;
    data?: any;
}

export interface Message {
    Subject?: string;
    AddressID?: string;
    MIMEType?: string;
    Body?: any;
    Flags?: number;
    Time?: number;
    Sender?: Recipient;
    ToList?: Recipient[];
    CCList?: Recipient[];
    BCCList?: Recipient[];
    ParsedHeaders?: { [key: string]: any };
    Attachments?: Attachment[];
}

export interface MessageExtended {
    data?: Message;
    raw?: string;
    document?: HTMLElement;
    content?: string;
    verified?: boolean;
    publicKeys?: any[];
    privateKeys?: any[];
    showRemoteImages?: boolean;
    showEmbeddedImages?: boolean;
}
