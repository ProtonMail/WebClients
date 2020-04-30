import { OpenPGPKey } from 'pmcrypto';
import { MIME_TYPES } from 'proton-shared/lib/constants';

import { Attachment } from './attachment';
import { MESSAGE_ACTIONS, VERIFICATION_STATUS } from '../constants';
import { Recipient } from './address';
import { RequireSome } from './utils';

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
    SpamScore?: number;
    AddressID: string;
    ExternalID: string;
    Body: any;
    MIMEType: MIME_TYPES;
    Header: string;
    ParsedHeaders: { [key: string]: any };
    ReplyTo: Recipient;
    ReplyTos: Recipient[];
    Attachments: Attachment[];
    LabelIDs: string[];

    Password?: string;
    PasswordHint?: string;
    RightToLeft?: number;
}

export interface MessageAction<T = void> {
    (): Promise<T>;
}

export interface EmbeddedInfo {
    attachment: Attachment;
    url?: string;
}

export interface MessageErrors {
    network?: Error[];
    decryption?: Error[];
    common?: Error[];
}

/**
 * Message attachments limited to the embedded images
 * Mapped by the CID of the embedded attachment
 */
export type EmbeddedMap = Map<string, EmbeddedInfo>;

export interface MessageExtended {
    /**
     * ID used only on the frontend
     * Needed to keep a unique id on a message even if it's created in session without a server ID
     */
    localID: string;

    /**
     * List of pending actions on the message
     */
    actionQueue?: MessageAction[];

    /**
     * Current (i18n) label to describe what's hapenning on the message
     */
    actionStatus?: string;

    /**
     * Message object from the server
     */
    data?: Message;

    /**
     * Decrypted message body content
     */
    decryptedBody?: string;

    /**
     * Decrypted subject
     * Only used in rare situations where the message is sent by an external system which encrypt even the subject
     */
    decryptedSubject?: string;

    /**
     * Document representing the message body
     * Processed to be rendered to the user
     */
    document?: Element;

    /**
     * Mail content when in plaintext mode
     */
    plainText?: string;

    /**
     * Cryptography signatures verification status flag
     */
    verificationStatus?: VERIFICATION_STATUS;

    /**
     * Signature verification errors, if any
     */
    verificationErrors?: Error[];

    /**
     * User public keys (used for encrypting drafts and attachments)
     */
    publicKeys?: OpenPGPKey[];

    /**
     * Pinned public keys of the sender, if any
     */
    senderPinnedKeys?: OpenPGPKey[];

    /**
     * If the sender is in the list of contacts, whether its contact signature has been verified
     */
    senderVerified?: boolean;

    /**
     * If the message is signed, the public key that verifies the signature
     */
    signingPublicKey?: OpenPGPKey;

    /**
     * Address private keys of the user (used for decryption)
     */
    privateKeys?: OpenPGPKey[];

    /**
     * Initialization status of the message
     * undefined: not started
     * false: in progress
     * true: done
     */
    initialized?: boolean;

    /**
     * Show remote message in rendered message
     * undefined: check user mail settings
     * false: no
     * true: yes
     */
    showRemoteImages?: boolean;

    /**
     * Show remote message in rendered message
     * undefined: check user mail settings
     * false: no
     * true: yes
     */
    showEmbeddedImages?: boolean;

    /**
     * Expiration offset in seconds from time of delivery
     */
    expiresIn?: number;

    /**
     * Original "To" address
     */
    originalTo?: string;

    /**
     * Action flags for draft messages
     */
    action?: MESSAGE_ACTIONS;

    /**
     * Action flags for draft messages
     */
    ParentID?: string;

    /**
     * Embedded images mapped by CID list
     */
    embeddeds?: EmbeddedMap;

    /**
     * Unsubscribed flag
     */
    unsubscribed?: boolean;

    /**
     * All kind of errors that appears during message processing
     */
    errors?: MessageErrors;
}

/**
 * Common helper to have a MessageExtended with the data props required
 */
export type MessageExtendedWithData = RequireSome<MessageExtended, 'data'>;

/**
 * Common helper to have a partial MessageExtended including a Partial Message
 */
export type PartialMessageExtended = Partial<Omit<MessageExtended, 'data'> & { data: Partial<Message> }>;
