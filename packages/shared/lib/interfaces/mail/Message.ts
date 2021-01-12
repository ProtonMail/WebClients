import { MIME_TYPES } from '../../constants';
import { Recipient } from '../Address';

export interface Attachment {
    ID?: string;
    Name?: string;
    Size?: number;
    Preview?: any;
    KeyPackets?: any;
    MIMEType?: string;
    data?: any;
    Headers?: { [key: string]: string };
    Encrypted?: number;
    Signature?: string;
}

export interface UnsubscribeMethods {
    MailTo?: {
        Subject?: string;
        Body?: string;
        ToList: string[];
    };
    HttpClient?: string;
    OneClick?: 'OneClick';
}

export interface Message {
    ID: string;
    Order: number;
    ConversationID: string;
    Subject: string;
    Unread: number;
    Sender: Recipient;
    SenderAddress: string;
    SenderName: string;
    Flags: number;
    Type: number;
    IsEncrypted: number;
    IsReplied: number;
    IsRepliedAll: number;
    IsForwarded: number;
    ToList: Recipient[];
    CCList: Recipient[];
    BCCList: Recipient[];
    Time: number;
    Size: number;
    NumAttachments: number;
    ExpirationTime?: number;
    AddressID: string;
    ExternalID: string;
    Body: any;
    MIMEType: MIME_TYPES;
    Header: string;
    ParsedHeaders: { [key: string]: string | string[] | undefined };
    ReplyTo: Recipient;
    ReplyTos: Recipient[];
    Attachments: Attachment[];
    LabelIDs: string[];

    Password?: string;
    PasswordHint?: string;
    RightToLeft?: number;
    UnsubscribeMethods?: UnsubscribeMethods;
}
