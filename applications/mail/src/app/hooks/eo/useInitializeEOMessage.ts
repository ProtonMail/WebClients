import { useCallback } from 'react';

import type { PayloadAction } from '@reduxjs/toolkit';

import { useApi } from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto';
import type {
    LoadEmbeddedResults,
    MessageErrors,
    MessageImages,
    MessageRemoteImage,
    MessageState,
    MessageStateWithDataFull,
} from '@proton/mail/store/messages/messagesTypes';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { EO_DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/eo/constants';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import noop from '@proton/utils/noop';

import { useMailDispatch } from 'proton-mail/store/hooks';

import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from '../../constants';
import { isNetworkError } from '../../helpers/errors';
import { decryptMessage } from '../../helpers/message/messageDecrypt';
import type { Preparation } from '../../helpers/transforms/transforms';
import { prepareHtml, preparePlainText } from '../../helpers/transforms/transforms';
import {
    EODocumentInitializeFulfilled,
    EODocumentInitializePending,
    EOLoadEmbedded,
    EOLoadRemote,
} from '../../store/eo/eoActions';
import type { EOLoadEmbeddedParams, EOLoadRemoteResults } from '../../store/eo/eoType';
import { useBase64Cache } from '../useBase64Cache';
import { useGetEODecryptedToken, useGetEOMessageState, useGetEOPassword } from './useLoadEOMessage';

export const useInitializeEOMessage = () => {
    const api = useApi();
    const dispatch = useMailDispatch();
    const getMessage = useGetEOMessageState();
    const getPassword = useGetEOPassword();
    const getEODecryptedToken = useGetEODecryptedToken();
    const base64Cache = useBase64Cache();

    return useCallback(async () => {
        const getData = () => (getMessage() as MessageStateWithDataFull).data;
        const password = getPassword();
        const decryptedToken = getEODecryptedToken();

        const messageFromState = { ...getMessage() } as MessageState;

        dispatch(EODocumentInitializePending());
        const errors: MessageErrors = {};
        const { loadRetry = 0 } = messageFromState;
        let initialized: boolean | undefined = true;
        let decryption;
        let preparation: Preparation | undefined;
        let dataChanges = {} as Partial<Message>;
        let messageImages: MessageImages | undefined;

        try {
            // Decryption
            decryption = await decryptMessage(getData(), [] as PrivateKeyReference[], undefined, password);

            if (decryption.mimetype) {
                dataChanges = { ...dataChanges, MIMEType: decryption.mimetype };
            }
            // PGP encrypted attachment decryption with all attachments
            const mimeAttachments = decryption.attachments || [];
            const allAttachments = [...getData().Attachments, ...mimeAttachments];
            dataChanges = {
                ...dataChanges,
                Attachments: allAttachments,
                NumAttachments: getData().NumAttachments + mimeAttachments.length,
            };

            if (decryption.errors) {
                Object.assign(errors, decryption.errors);
            }

            const MIMEType = dataChanges.MIMEType || getData().MIMEType;

            const handleEOLoadEmbeddedImages = async (attachments: Attachment[]) => {
                const dispatchResult = dispatch(
                    EOLoadEmbedded({
                        attachments,
                        api,
                        messageVerification: messageFromState.verification,
                        password,
                        id: 'TODO: CHANGE ID',
                        decryptedToken,
                    })
                ) as any as Promise<PayloadAction<LoadEmbeddedResults, string, { arg: EOLoadEmbeddedParams }>>;
                const { payload } = await dispatchResult;
                return payload;
            };

            const handleEOLoadRemoteImages = (imagesToLoad: MessageRemoteImage[]) => {
                const dispatchResult = dispatch(
                    EOLoadRemote({
                        imagesToLoad,
                    })
                );
                return dispatchResult as any as Promise<EOLoadRemoteResults[]>;
            };

            preparation = isPlainText({ MIMEType })
                ? await preparePlainText(decryption.decryptedBody, false, EO_DEFAULT_MAILSETTINGS)
                : await prepareHtml(
                      {
                          ...messageFromState,
                          decryption,
                          data: { ...messageFromState.data, Attachments: allAttachments } as Message,
                      },
                      base64Cache,
                      EO_DEFAULT_MAILSETTINGS,
                      handleEOLoadEmbeddedImages,
                      noop,
                      noop,
                      handleEOLoadRemoteImages,
                      noop
                  );

            if (!isPlainText({ MIMEType })) {
                messageImages = {
                    hasRemoteImages: preparation.hasRemoteImages as boolean,
                    showRemoteImages: preparation.showRemoteImages as boolean,
                    hasEmbeddedImages: preparation.hasEmbeddedImages as boolean,
                    showEmbeddedImages: preparation.showEmbeddedImages as boolean,
                    trackersStatus: 'not-loaded',
                    images: [...(preparation.remoteImages || []), ...(preparation.embeddedImages || [])],
                };
            }
        } catch (error: any) {
            if (isNetworkError(error)) {
                errors.network = [error];
                if (loadRetry < LOAD_RETRY_COUNT) {
                    initialized = undefined;
                    await wait(LOAD_RETRY_DELAY);
                }
            } else {
                errors.processing = [error];
            }
            console.log('EO message initialization error', error);
        } finally {
            dispatch(
                EODocumentInitializeFulfilled({
                    dataChanges,
                    initialized,
                    preparation,
                    decryption,
                    errors,
                    messageImages,
                })
            );
        }
    }, []);
};
