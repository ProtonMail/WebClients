import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { PayloadAction } from '@reduxjs/toolkit';
import { PrivateKeyReference } from '@proton/crypto';

import { useApi } from '@proton/components';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { wait } from '@proton/shared/lib/helpers/promise';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { eoDefaultMailSettings } from '@proton/shared/lib/mail/eo/constants';
import { useGetEODecryptedToken, useGetEOMessageState, useGetEOPassword } from './useLoadEOMessage';
import { useBase64Cache } from '../useBase64Cache';
import {
    LoadEmbeddedResults,
    MessageErrors,
    MessageImages,
    MessageRemoteImage,
    MessageState,
    MessageStateWithData,
} from '../../logic/messages/messagesTypes';
import {
    EODocumentInitializeFulfilled,
    EODocumentInitializePending,
    EOLoadEmbedded,
    EOLoadRemote,
} from '../../logic/eo/eoActions';
import { Preparation, prepareHtml, preparePlainText } from '../../helpers/transforms/transforms';
import { decryptMessage } from '../../helpers/message/messageDecrypt';
import { EOLoadEmbeddedParams, EOLoadRemoteResults } from '../../logic/eo/eoType';
import { isNetworkError } from '../../helpers/errors';
import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from '../../constants';

export const useInitializeEOMessage = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const getMessage = useGetEOMessageState();
    const getPassword = useGetEOPassword();
    const getEODecryptedToken = useGetEODecryptedToken();
    const base64Cache = useBase64Cache();

    return useCallback(async () => {
        const getData = () => (getMessage() as MessageStateWithData).data;
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
            decryption = await decryptMessage(getData(), [] as PrivateKeyReference[], undefined, undefined, password);

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
                        api,
                    })
                );
                return dispatchResult as any as Promise<EOLoadRemoteResults[]>;
            };

            preparation = isPlainText({ MIMEType })
                ? await preparePlainText(decryption.decryptedBody, false)
                : await prepareHtml(
                      {
                          ...messageFromState,
                          decryption,
                          data: { ...messageFromState.data, Attachments: allAttachments } as Message,
                      },
                      base64Cache,
                      eoDefaultMailSettings,
                      handleEOLoadEmbeddedImages,
                      (imagesToLoad) => {
                          console.log(imagesToLoad);
                      },
                      (imagesToLoad) => {
                          console.log(imagesToLoad);
                      },
                      handleEOLoadRemoteImages
                  );

            if (!isPlainText({ MIMEType })) {
                messageImages = {
                    hasRemoteImages: preparation.hasRemoteImages as boolean,
                    showRemoteImages: preparation.showRemoteImages as boolean,
                    hasEmbeddedImages: preparation.hasEmbeddedImages as boolean,
                    showEmbeddedImages: preparation.showEmbeddedImages as boolean,
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
