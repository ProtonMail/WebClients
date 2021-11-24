// import { OpenPGPKey, OpenPGPSignature } from 'pmcrypto';
// import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
// import { RequireSome } from '@proton/shared/lib/interfaces/utils';
// import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
// import { MESSAGE_ACTIONS } from '../constants';

// export interface MessageKeys {
//     publicKeys: OpenPGPKey[];
//     privateKeys: OpenPGPKey[];
// }

// export interface MessageErrors {
//     network?: Error[];
//     decryption?: Error[];
//     processing?: Error[];
//     signature?: Error[];
//     unknown?: Error[];
// }

// /**
//  * Data structure containing all the needed informations about the signature verification of a message
//  */
// export interface MessageVerification {
//     /**
//      * Signatures verification status flag
//      */
//     verificationStatus: VERIFICATION_STATUS | undefined;

//     /**
//      * Signature verification errors, if any
//      */
//     verificationErrors: Error[] | undefined;

//     /**
//      * Pinned public keys of the sender, if any
//      */
//     senderPinnedKeys: OpenPGPKey[] | undefined;

//     /**
//      * If the sender is in the list of contacts, whether its contact signature has been verified
//      */
//     senderVerified: boolean | undefined;

//     /**
//      * If the message is signed, the public key that verifies the signature
//      */
//     signingPublicKey: OpenPGPKey | undefined;

//     /**
//      * Attached public key, if the message contains any
//      */
//     attachedPublicKeys: OpenPGPKey[] | undefined;
// }

// export interface AbstractMessageImage {
//     type: 'remote' | 'embedded';
//     original?: HTMLElement;
//     url?: string;
//     id: string;
//     status: 'not-loaded' | 'loading' | 'loaded';
//     tracker: string | undefined;
// }

// export interface MessageRemoteImage extends AbstractMessageImage {
//     type: 'remote';
//     error?: unknown;
// }

// export interface MessageEmbeddedImage extends AbstractMessageImage {
//     type: 'embedded';
//     cid: string;
//     cloc: string;
//     attachment: Attachment;
// }

// export type MessageImage = MessageRemoteImage | MessageEmbeddedImage;

// export interface MessageImages {
//     hasRemoteImages: boolean;
//     hasEmbeddedImages: boolean;
//     showRemoteImages: boolean;
//     showEmbeddedImages: boolean;
//     images: MessageImage[];
// }

// export interface MessageExtended {
//     /**
//      * ID used only on the frontend
//      * Needed to keep a unique id on a message even if it's created in session without a server ID
//      */
//     localID: string;

//     /**
//      * Message object from the server
//      */
//     data?: Message;

//     /**
//      * Decrypted message body content
//      */
//     decryptedBody?: string;

//     /**
//      * Decrypted raw content
//      * Often the same as decryptedBody except for pgp-mime format, used for signature verification
//      */
//     decryptedRawContent?: Uint8Array;

//     /**
//      * Message signature obtained after decryption, if any
//      * Warning, there could also be a signature in the mime content which is different
//      */
//     signature?: OpenPGPSignature;

//     /**
//      * Decrypted subject
//      * Only used in rare situations where the message is sent by an external system which encrypt even the subject
//      */
//     decryptedSubject?: string;

//     /**
//      * Document representing the message body
//      * Processed to be rendered to the user
//      */
//     document?: Element;

//     /**
//      * Mail content when in plaintext mode
//      */
//     plainText?: string;

//     /**
//      * Initialization status of the message
//      * undefined: not started
//      * false: in progress
//      * true: done
//      */
//     initialized?: boolean;

//     /**
//      * Expiration offset in seconds from time of delivery
//      */
//     expiresIn?: number;

//     /**
//      * Original "To" address of the referring message. Only added for drafts.
//      */
//     originalTo?: string;

//     /**
//      * Original "AddressID" of the address of the referring message. Only added for drafts.
//      * Used on rare situation when replying with a different address than the one you received the message.
//      */
//     originalAddressID?: string;

//     /**
//      * Action flags for draft messages
//      */
//     action?: MESSAGE_ACTIONS;

//     /**
//      * Action flags for draft messages
//      */
//     ParentID?: string;

//     /**
//      * Override auto save contacts preference
//      */
//     autoSaveContacts?: number;

//     /**
//      * Signature verifications results
//      */
//     verification?: MessageVerification;

//     /**
//      * All kind of errors that appears during message processing
//      */
//     errors?: MessageErrors;

//     /**
//      * true when sending message
//      */
//     sending?: boolean;

//     /**
//      * Attachments prepared during the creation of a draft to upload
//      * when the draft will be created
//      */
//     initialAttachments?: File[];

//     /**
//      * Flag meaning we are reopening the draft from an undo action
//      */
//     openDraftFromUndo?: boolean;

//     /**
//      * Counter of load retry
//      */
//     loadRetry?: number;

//     /**
//      * All data relative to remote and embedded images present in the message
//      */
//     messageImages?: MessageImages;

//     /**
//      * Desired time for schedule send (timestamp)
//      */
//     scheduledAt?: number;

//     /**
//      * Flag for draft that has already been sent
//      */
//     isSentDraft?: boolean;
// }

// /**
//  * Common helper to have a MessageExtended with the data props required
//  */
// export type MessageExtendedWithData = RequireSome<MessageExtended, 'data'>;

// /**
//  * Common helper to have a partial MessageExtended including a Partial Message
//  */
// export type PartialMessageExtended = Partial<Omit<MessageExtended, 'data'> & { data: Partial<Message> }>;
