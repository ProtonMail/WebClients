import { CryptoProxy } from '@proton/crypto';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import type { EOStore } from 'proton-mail/store/eo/eoStore';

import { loadEOMessage, loadEOToken } from '../../../store/eo/eoActions';
import type { EOMessage, EOMessageReply } from '../../../store/eo/eoType';
import { convertEOtoMessageState } from '../../eo/message';
import { addApiMock, api, clearApiMocks } from '../api';
import { base64Cache, clearCache } from '../cache';
import { generateKeys } from '../crypto';

const savedConsole = { ...console };

export const reply = {
    Body: 'EO reply body',
    Attachments: [] as Attachment[],
} as EOMessageReply;

export const EOClearAll = () => {
    jest.clearAllMocks();
    api.mockClear();
    clearApiMocks();
    clearCache();
    base64Cache.clear();
    console = { ...savedConsole };
};

export const mockConsole = (level: keyof Console = 'error') => {
    console[level] = jest.fn();
};

export const getEOEncryptedMessage = async (decryptedToken: string, password: string) => {
    const { message } = await CryptoProxy.encryptMessage({
        textData: decryptedToken,
        passwords: [password],
    });
    return message;
};

export interface EOOriginalMessageOptions {
    body?: string;
    attachments?: Attachment[];
    numAttachments?: number;
    expirationTime?: number;
    time?: number;
    replies?: EOMessageReply[];
}

export const validID = 'validID';
export const invalidID = 'invalidID';

export const EODecryptedToken = 'decryptedToken';
export const EOPassword = 'password';
export const EOInvalidPassword = 'invalidPassword';

export const EOLocalID = 'eoLocalID';

export const EOSubject = 'Test EO subject';
export const EOBody = 'Test EO body';

export const EOSender = { Name: 'EO Sender', Address: 'EOsender@protonmail.com' } as Recipient;
export const EORecipient = { Name: 'EO Recipient', Address: 'EOrecipient@protonmail.com' } as Recipient;

export const getEOOriginalMessage = async (options?: EOOriginalMessageOptions) => {
    return {
        Attachments: options?.attachments || ([] as Attachment[]),
        Body: await getEOEncryptedMessage(options?.body || EOBody, EOPassword),
        ToList: [EORecipient] as Recipient[],
        CCList: [] as Recipient[],
        ExpirationTime: options?.expirationTime || 0,
        Subject: EOSubject,
        Sender: EOSender,
        Time: options?.time || new Date().getTime(),
        NumAttachments: options?.numAttachments || 0,
        Replies: options?.replies || ([] as EOMessageReply[]),
        MIMEType: MIME_TYPES.DEFAULT,
    } as EOMessage;
};

export const getEOMessageState = async () => {
    const EOOriginalMessage = await getEOOriginalMessage();
    return convertEOtoMessageState(EOOriginalMessage, EOLocalID);
};

export const EOInitStore = async ({ options, store }: { options?: EOOriginalMessageOptions; store: EOStore }) => {
    const publicKey = await generateKeys(EOSender.Name, EOSender.Address);

    const EOOriginalMessage = await getEOOriginalMessage(options);
    const EOEncryptedToken = await getEOEncryptedMessage(EODecryptedToken, EOPassword);

    addApiMock(`mail/v4/eo/token/${validID}`, () => ({ Token: EOEncryptedToken }));

    addApiMock('mail/v4/eo/message', () => ({
        Message: EOOriginalMessage as EOMessage,
        PublicKey: publicKey.publicKeyArmored,
    }));

    await store.dispatch(loadEOToken({ api, id: validID, set: jest.fn() }));
    await store.dispatch(
        loadEOMessage({ api, id: validID, set: jest.fn(), token: EOEncryptedToken, password: EOPassword })
    );
};
