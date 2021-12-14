import { useApi } from '@proton/components';
import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { OpenPGPKey } from 'pmcrypto';
import {
    LoadEmbeddedResults,
    MessageErrors,
    MessageImages,
    MessageRemoteImage,
    MessageState,
    MessageStateWithData,
} from 'proton-mail/src/app/logic/messages/messagesTypes';
import { Preparation, prepareHtml, preparePlainText } from 'proton-mail/src/app/helpers/transforms/transforms';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isNetworkError } from 'proton-mail/src/app/helpers/errors';
import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from 'proton-mail/src/app/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { decryptMessage } from 'proton-mail/src/app/helpers/message/messageDecrypt';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { useBase64Cache } from 'proton-mail/src/app/hooks/useBase64Cache';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { PayloadAction } from '@reduxjs/toolkit';
import { useGetEODecryptedToken, useGetMessageState, useGetPassword } from './useOutsideMessage';
import {
    EODocumentInitializeFulfilled,
    EODocumentInitializePending,
    EOLoadEmbedded,
    EOLoadRemote,
} from '../logic/eo/eoActions';
import { EOLoadEmbeddedParams, EOLoadRemoteResults } from '../logic/eo/eoType';

export const useInitializeEOMessage = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const getMessage = useGetMessageState();
    const getPassword = useGetPassword();
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
            decryption = await decryptMessage(getData(), [] as OpenPGPKey[], undefined, undefined, password);

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
                      { ShowImages: SHOW_IMAGES.NONE, ImageProxy: IMAGE_PROXY_FLAGS.NONE } as MailSettings,
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
