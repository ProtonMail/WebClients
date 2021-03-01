import { OpenPGPKey, OpenPGPSignature } from 'pmcrypto';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { MESSAGE_ACTIONS } from '../constants';

export interface MessageKeys {
    publicKeys: OpenPGPKey[];
    privateKeys: OpenPGPKey[];
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
    processing?: Error[];
    signature?: Error[];
}

/**
 * Data structure containing all the needed informations about the signature verification of a message
 */
export interface MessageVerification {
    /**
     * Signatures verification status flag
     */
    verificationStatus: VERIFICATION_STATUS | undefined;

    /**
     * Signature verification errors, if any
     */
    verificationErrors: Error[] | undefined;

    /**
     * Pinned public keys of the sender, if any
     */
    senderPinnedKeys: OpenPGPKey[] | undefined;

    /**
     * If the sender is in the list of contacts, whether its contact signature has been verified
     */
    senderVerified: boolean | undefined;

    /**
     * If the message is signed, the public key that verifies the signature
     */
    signingPublicKey: OpenPGPKey | undefined;

    /**
     * Attached public key, if the message contains any
     */
    attachedPublicKeys: OpenPGPKey[] | undefined;
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
     * Whether or not an action is being processed on the message
     *
     * True: yes
     * False / undefined: no
     */
    actionInProgress?: boolean;

    /**
     * Message object from the server
     */
    data?: Message;

    /**
     * Decrypted message body content
     */
    decryptedBody?: string;

    /**
     * Decrypted raw content
     * Often the same as decryptedBody except for pgp-mime format, used for signature verification
     */
    decryptedRawContent?: string;

    /**
     * Message signature obtained after decryption, if any
     * Warning, there could also be a signature in the mime content which is different
     */
    signature?: OpenPGPSignature;

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
     * Original "To" address of the referring message. Only added for drafts.
     */
    originalTo?: string;

    /**
     * Original "AddressID" of the address of the referring message. Only added for drafts.
     * Used on rare situation when replying with a different address than the one you received the message.
     */
    originalAddressID?: string;

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
     * Signature verifications results
     */
    verification?: MessageVerification;

    /**
     * All kind of errors that appears during message processing
     */
    errors?: MessageErrors;

    /**
     * true when sending message
     */
    sending?: boolean;
}

/**
 * Common helper to have a MessageExtended with the data props required
 */
export type MessageExtendedWithData = RequireSome<MessageExtended, 'data'>;

/**
 * Common helper to have a partial MessageExtended including a Partial Message
 */
export type PartialMessageExtended = Partial<Omit<MessageExtended, 'data'> & { data: Partial<Message> }>;
