import { OpenPGPKey } from 'pmcrypto';

import { Label } from 'proton-shared/lib/interfaces/Label';
import { MIME_TYPES } from 'proton-shared/lib/constants';

import { Attachment } from './attachment';
import { MESSAGE_ACTIONS, VERIFICATION_STATUS } from '../constants';
import { Recipient } from './address';

export interface Message {
    ID?: string;
    Subject?: string;
    AddressID?: string;
    MIMEType?: MIME_TYPES;
    Body?: any;
    Flags?: number;
    Time?: number;
    ContextTime?: number;
    Sender?: Recipient;
    ToList?: Recipient[];
    CCList?: Recipient[];
    BCCList?: Recipient[];
    ReplyTos?: Recipient[];
    Header?: string;
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
    SpamScore?: number;
}

export interface MessageAction<T = void> {
    (): Promise<T>;
}

// export type MessageAction = (...args: any[]) => Promise<void>;

export interface EmbeddedInfo {
    attachment: Attachment;
    url?: string;
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
     * Content of data.body decrypted
     */
    decryptedBody?: string;

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
    verified?: VERIFICATION_STATUS;

    /**
     * Cryptography public keys to use for both encryption and decryption
     */
    publicKeys?: OpenPGPKey[];

    /**
     * Cryptography prviate keys to use for both encryption and decryption
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
     * Encrypted subject
     */
    encryptedSubject?: any;

    // mimetype?: string;

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
}
