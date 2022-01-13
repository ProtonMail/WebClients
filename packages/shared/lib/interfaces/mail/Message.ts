import { MIME_TYPES } from '../../constants';
import { Recipient } from '../Address';

export interface AttachmentInfo {
    inline?: number;
    attachment: number;
}

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
    Mailto?: {
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
    /** @deprecated use Sender.Address instead */
    SenderAddress?: string;
    /** @deprecated use Sender.Name instead */
    SenderName?: string;
    Flags: number;
    /** @deprecated use Flags instead */
    Type?: number;
    /** @deprecated use Flags instead */
    IsEncrypted?: number;
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
    AttachmentInfo?: { [key in MIME_TYPES]?: AttachmentInfo };
    EORecipient?: Recipient;
}
