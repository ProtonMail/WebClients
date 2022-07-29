import { PublicKeyReference } from '@proton/crypto';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Api, Recipient } from '@proton/shared/lib/interfaces';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { DecryptMessageResult } from '../../helpers/message/messageDecrypt';
import { Preparation } from '../../helpers/transforms/transforms';
import {
    MessageErrors,
    MessageImages,
    MessageRemoteImage,
    MessageState,
    MessageVerification,
} from '../messages/messagesTypes';

export interface EOInitResult {
    token: string | undefined;
    decryptedToken: string | undefined;
    password: string | undefined;
}

export interface EOInitParams {
    get: (key: string) => any;
}

export interface EOMessageParams {
    api: Api;
    token: string;
    id: string;
    password: string;
    set: (key: string, data: any) => void;
}

export interface EOTokenParams {
    api: Api;
    id: string;
    set: (key: string, data: any) => void;
}

export interface EOMessageReply {
    Attachments: Attachment[];
    Body: any;
    DecryptedBody?: any;
    Time: number;
}

export interface EOLoadEmbeddedParams {
    attachments: Attachment[];
    api: Api;
    messageVerification?: MessageVerification;
    password: string;
    id: string;
    decryptedToken: string;
}

export type EOLoadEmbeddedResults = { attachment: Attachment; blob: string }[];

export interface EOLoadRemoteParams {
    imagesToLoad: MessageRemoteImage[];
    api: Api;
}

export interface EOLoadRemoteResults {
    image: MessageRemoteImage;
    blob?: Blob;
    tracker?: string;
    error?: unknown;
}

export interface EODocumentInitializeParams {
    dataChanges: Partial<Message>;
    initialized?: boolean;
    preparation?: Preparation;
    decryption?: DecryptMessageResult;
    errors?: MessageErrors;
    messageImages?: MessageImages;
}

export type EOMessage = {
    Attachments: Attachment[];
    Body: any;
    ToList: Recipient[];
    CCList: Recipient[];
    ExpirationTime: number;
    Subject: string;
    Sender: Recipient;
    Recipient: string;
    Time: number;
    NumAttachments: number;
    Replies: EOMessageReply[];
    SenderName: string;
    SenderAddress: string;
    MIMEType: MIME_TYPES;
    PublicKey?: PublicKeyReference[];
};

export type EOState = {
    message: EOMessage;
    encryptedToken: string;
    decryptedToken: string;
    isStoreInitialized: boolean;
    password: string;
    messageState: MessageState;
};
