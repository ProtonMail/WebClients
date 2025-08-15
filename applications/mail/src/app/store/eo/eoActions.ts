import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { CryptoProxy } from '@proton/crypto';
import { decodeUtf8Base64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';
import type { MessageState, OutsideKey } from '@proton/mail/store/messages/messagesTypes';
import { getEOMessage, getEOToken } from '@proton/shared/lib/api/eo';

import { EO_DECRYPTED_TOKEN_KEY, EO_PASSWORD_KEY, EO_TOKEN_KEY } from '../../constants';
import { getAndVerifyAttachment } from '../../helpers/attachment/attachmentLoader';
import { convertEOtoMessageState, eoDecrypt } from '../../helpers/eo/message';
import { createBlob } from '../../helpers/message/messageEmbeddeds';
import type {
    EODocumentInitializeParams,
    EOInitParams,
    EOInitResult,
    EOLoadEmbeddedParams,
    EOLoadEmbeddedResults,
    EOLoadRemoteParams,
    EOMessage,
    EOMessageParams,
    EOMessageReply,
    EOTokenParams,
} from './eoType';

export const init = createAsyncThunk<EOInitResult, EOInitParams>('eo/init', async ({ get }) => {
    try {
        const token = get(EO_TOKEN_KEY);
        const decryptedToken = get(EO_DECRYPTED_TOKEN_KEY);
        const password = get(EO_PASSWORD_KEY);

        return {
            token,
            decryptedToken: decryptedToken ? decodeUtf8Base64(decryptedToken) : undefined,
            password: password ? decodeUtf8Base64(password) : undefined,
        };
    } catch (error: any | undefined) {
        console.log(error);
        throw error;
    }
});

export const initEncryptedToken = createAction('eo/init/encryptedToken');

export const loadEOToken = createAsyncThunk<string, EOTokenParams>('eo/token/load', async ({ api, id, set }) => {
    try {
        const { Token } = await api(getEOToken(id));

        set(EO_TOKEN_KEY, Token);

        return Token;
    } catch (error: any | undefined) {
        console.log(error);
        throw error;
    }
});

export const loadEOMessage = createAsyncThunk<{ eoMessage: EOMessage; messageState: MessageState }, EOMessageParams>(
    'eo/message/load',
    async ({ api, token, id, password, set }) => {
        try {
            const { Message, PublicKey } = await api(getEOMessage(token, id));

            Message.PublicKey = await CryptoProxy.importPublicKey({ armoredKey: PublicKey });

            // Decrypt replies bodies (Useless for now, but might be needed if we want to display replies)
            await eoDecrypt(Message?.Body, password).then((body) => {
                Message.DecryptedBody = body;
            });

            const messageState = convertEOtoMessageState(Message, token) as any;

            set(EO_DECRYPTED_TOKEN_KEY, encodeUtf8Base64(token));
            set(EO_PASSWORD_KEY, encodeUtf8Base64(password));

            return { eoMessage: Message, messageState };
        } catch (error: any | undefined) {
            console.log(error);
            throw error;
        }
    }
);

export const EODocumentInitializePending = createAction<void>('eo/message/document/initialize/pending');

export const EODocumentInitializeFulfilled = createAction<EODocumentInitializeParams>(
    'eo/message/document/initialize/fulfilled'
);

export const EOLoadEmbedded = createAsyncThunk<EOLoadEmbeddedResults, EOLoadEmbeddedParams>(
    'eo/message/embedded/load',
    async ({ attachments, api, messageVerification, password, id, decryptedToken }) => {
        return Promise.all(
            attachments.map(async (attachment) => {
                const buffer = await getAndVerifyAttachment(
                    attachment,
                    messageVerification,
                    {
                        type: 'outside',
                        id,
                        password,
                        decryptedToken,
                    } as OutsideKey,
                    api
                );
                return {
                    attachment,
                    blob: createBlob(attachment, buffer.data as Uint8Array<ArrayBuffer>),
                };
            })
        );
    }
);

export const EOLoadRemote = createAction<EOLoadRemoteParams>('eo/message/remote/load/url');

export const EOAddReply = createAction<EOMessageReply>('eo/message/reply');
