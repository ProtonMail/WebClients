import { Label } from './label';
import { Attachment } from './attachment';
import { MESSAGE_ACTIONS } from '../constants';
import { Recipient } from './address';

export interface Message {
    ID?: string;
    ParentID?: string;
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
    ReplyTos?: Recipient[];
    ParsedHeaders?: { [key: string]: any };
    Attachments?: Attachment[];
    Unread?: number;
    Size?: number;
    Labels?: Label[];
    LabelIDs?: string[];
    ConversationID?: string;
    Order?: number;
    Password?: string;
    RightToLeft?: number;
    PasswordHint?: string;
    ExpirationTime?: number;
    ExpiresIn?: number;
}

export interface MessageExtended {
    data?: Message;
    raw?: string;
    document?: Element;
    content?: string;
    verified?: number;
    publicKeys?: any[];
    privateKeys?: any[];
    loaded?: boolean;
    initialized?: boolean;
    showRemoteImages?: boolean;
    showEmbeddedImages?: boolean;
    numEmbedded?: number;
    // attachments?: Attachment[];
    encryptedSubject?: any;
    mimetype?: string;
    originalTo?: string;
    action?: MESSAGE_ACTIONS;
}
