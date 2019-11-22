import { Label } from './label';

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
    ContextTime?: number;
    Sender?: Recipient;
    ToList?: Recipient[];
    CCList?: Recipient[];
    BCCList?: Recipient[];
    ParsedHeaders?: { [key: string]: any };
    Attachments?: Attachment[];
    Unread?: number;
    Size?: number;
    Labels?: Label[];
}

export interface MessageExtended {
    data: Message;
    raw?: string;
    document?: HTMLElement;
    content?: string;
    verified?: number;
    publicKeys?: any[];
    privateKeys?: any[];
    initialized?: boolean;
    showRemoteImages?: boolean;
    showEmbeddedImages?: boolean;
    numEmbedded?: number;
}
