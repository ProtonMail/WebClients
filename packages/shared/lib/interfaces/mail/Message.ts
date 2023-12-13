import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

import { MIME_TYPES } from '../../constants';
import { Recipient } from '../Address';

export interface AttachmentInfo {
    inline?: number;
    attachment: number;
}

// Attachment metadata that we get in the element list
export interface AttachmentsMetadata {
    ID: string;
    Disposition: ATTACHMENT_DISPOSITION;
    Name: string;
    MIMEType: string;
    Size: number;
}

export interface AttachmentFullMetadata {
    ID: string;
    Name?: string;
    Size: number;
    MIMEType: string;
    Disposition: ATTACHMENT_DISPOSITION;
    Sender?: Recipient;
    KeyPackets?: string;
    Signature?: string;
    EncSignature?: string;
    AddressID: string;
    MessageID: string;
    ConversationID: string;
    IsAutoForwardee: boolean;
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
    // EO specific
    DataPacket?: any;
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

export interface MessageMetadata {
    ID: string;
    Order: number;
    ConversationID: string;
    Subject: string;
    Unread: number;
    /** @deprecated use Flags instead */
    Type?: number;
    /** @deprecated use Sender.Address instead */
    SenderAddress?: string;
    /** @deprecated use Sender.Name instead */
    SenderName?: string;
    Sender: Recipient;
    ToList: Recipient[];
    CCList: Recipient[];
    BCCList: Recipient[];
    Time: number;
    Size: number;
    /** @deprecated use Flags instead */
    IsEncrypted?: number;
    ExpirationTime?: number;
    IsReplied: number;
    IsRepliedAll: number;
    IsForwarded: number;
    AddressID: string;
    LabelIDs: string[];
    ExternalID: string;
    NumAttachments: number;
    Flags: number;
    AttachmentInfo?: { [key in MIME_TYPES]?: AttachmentInfo };
    AttachmentsMetadata?: AttachmentsMetadata[];
    SnoozeTime: number;
    DisplaySnoozedReminder: boolean;
}

export interface Message extends MessageMetadata {
    Body: string;
    Header: string;
    ParsedHeaders: { [key: string]: string | string[] | undefined };
    Attachments: Attachment[];
    MIMEType: MIME_TYPES;
    ReplyTo: Recipient;
    ReplyTos: Recipient[];
    UnsubscribeMethods?: UnsubscribeMethods;
    Password?: string;
    PasswordHint?: string;
    RightToLeft?: number;
    EORecipient?: Recipient;
}

export type DraftMessage = Pick<
    Message,
    'Subject' | 'Unread' | 'Sender' | 'ToList' | 'CCList' | 'BCCList' | 'ExternalID' | 'Flags' | 'Body' | 'MIMEType'
>;

interface TaskRunning {
    TargetType: string;
    AddressID: string;
}

export interface GetMessageResponse {
    Code: number;
    Message?: Message;
    Error?: string;
    Details?: string[];
}

export interface QueryMessageMetadataResponse {
    Code: number;
    Total: number;
    Messages: MessageMetadata[];
    TasksRunning: TaskRunning[];
}

export interface MarkAsBrokenResponse {
    Code: number;
    Error?: string;
}
