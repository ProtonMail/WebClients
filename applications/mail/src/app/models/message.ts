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
    Headers?: { [key: string]: string };
}

export interface Message {
    ID?: string;
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
    Size?: number;
}

export interface MessageExtended {
    data?: Message;
    raw?: string;
    document?: HTMLElement;
    content?: string;
    verified?: number;
    publicKeys?: any[];
    privateKeys?: any[];
    showRemoteImages?: boolean;
    showEmbeddedImages?: boolean;
    numEmbedded?: number;
}
