import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { PayloadAction } from '@reduxjs/toolkit';

import { useApi, useMailSettings } from '@proton/components';
import { WorkerDecryptionResult } from '@proton/crypto';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isDraft, isPlainText } from '@proton/shared/lib/mail/messages';

import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from '../../constants';
import { getPureAttachments } from '../../helpers/attachment/attachment';
import { isUnreadMessage } from '../../helpers/elements';
import { isNetworkError } from '../../helpers/errors';
import { decryptMessage } from '../../helpers/message/messageDecrypt';
import { loadMessage } from '../../helpers/message/messageRead';
import { Preparation, prepareHtml, preparePlainText } from '../../helpers/transforms/transforms';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import {
    loadEmbedded,
    loadFakeProxy,
    loadRemoteDirect,
    loadRemoteProxy,
} from '../../logic/messages/images/messagesImagesActions';
import {
    LoadEmbeddedParams,
    LoadEmbeddedResults,
    LoadRemoteResults,
    MessageErrors,
    MessageImages,
    MessageRemoteImage,
    MessageState,
    MessageStateWithData,
} from '../../logic/messages/messagesTypes';
import {
    documentInitializeFulfilled,
    documentInitializePending,
    load,
} from '../../logic/messages/read/messagesReadActions';
import { useGetAttachment } from '../useAttachment';
import { useBase64Cache } from '../useBase64Cache';
import { MARK_AS_STATUS, useMarkAs } from '../useMarkAs';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useKeyVerification } from './useKeyVerification';
import { useGetMessage } from './useMessage';

export const useInitializeMessage = (localID: string, labelID?: string) => {
    const api = useApi();
    const markAs = useMarkAs();
    const dispatch = useDispatch();
    const getMessage = useGetMessage();
    const getMessageKeys = useGetMessageKeys();
    const getAttachment = useGetAttachment();
    const base64Cache = useBase64Cache();
    const [mailSettings] = useMailSettings();
    const { verifyKeys } = useKeyVerification();

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(async () => {
        // Message can change during the whole initialization sequence
        // To have the most up to date version, best is to get back to the cache version each time
        const getData = () => (getMessage(localID) as MessageStateWithData).data;

        // Cache entry will be (at least) initialized by the queue system
        const messageFromState = { ...getMessage(localID) } as MessageState;

        // If the message is not yet loaded at all, the localID is the message ID
        if (!messageFromState || !messageFromState.data) {
            messageFromState.data = { ID: localID } as Message;
        }

        dispatch(documentInitializePending(localID));

        const errors: MessageErrors = {};
        const { loadRetry = 0 } = messageFromState;
        let initialized: boolean | undefined = true;
        let decryption;
        let preparation: Preparation | undefined;
        let dataChanges = {} as Partial<Message>;
        let messageImages: MessageImages | undefined;

        try {
            // Ensure the message data is loaded
            const message = await loadMessage(messageFromState, api);
            dispatch(load.fulfilled(message.data, load.fulfilled.toString(), { ID: localID, api }));

            const messageKeys = await getMessageKeys(message.data);

            decryption = await decryptMessage(getData(), messageKeys.privateKeys, getAttachment, onUpdateAttachment);

            if (decryption.mimetype) {
                dataChanges = { ...dataChanges, MIMEType: decryption.mimetype };
            }
            const mimeAttachments = decryption.attachments || [];

            // Get Pure Mime Attachments to prevent display of embedded images in the attachment list
            const pureMimeAttachments = getPureAttachments(mimeAttachments);

            // The backend is supposed to filter embedded images,
            // but we sometimes we receive messages with a NumAttachment = 0 which contains pure attachments,
            // This leads to hide the attachment list, and the user is not able to see the message attachments
            // We are doing an additional verification to update NumAttachments if needed
            const pureAttachments = getPureAttachments(getData().Attachments);

            // If we calculate a different NumAttachments than the one received,
            // we need to update the message to display the attachment list
            const numAttachments =
                pureAttachments.length !== getData().NumAttachments ? pureAttachments.length : getData().NumAttachments;

            const allAttachments = [...getData().Attachments, ...mimeAttachments];
            dataChanges = {
                ...dataChanges,
                Attachments: allAttachments,
                NumAttachments: numAttachments + pureMimeAttachments.length,
            };

            if (decryption.errors) {
                Object.assign(errors, decryption.errors);

                // Get message decryption key to display a notification to the user that its password may have been reset recently
                await verifyKeys(message);
            }

            if (isUnreadMessage(getData())) {
                markAs([getData()], labelID, MARK_AS_STATUS.READ);
                dataChanges = { ...dataChanges, Unread: 0 };
            }

            const MIMEType = dataChanges.MIMEType || getData().MIMEType;

            const handleLoadEmbeddedImages = async (attachments: Attachment[]) => {
                const dispatchResult = dispatch(
                    loadEmbedded({
                        ID: localID,
                        attachments,
                        api,
                        messageKeys,
                        messageVerification: message.verification,
                        getAttachment,
                        onUpdateAttachment,
                    })
                ) as any as Promise<PayloadAction<LoadEmbeddedResults, string, { arg: LoadEmbeddedParams }>>;
                const { payload } = await dispatchResult;
                return payload;
            };

            const handleLoadRemoteImagesProxy = (imagesToLoad: MessageRemoteImage[]) => {
                const dispatchResult = dispatch(loadRemoteProxy({ ID: localID, imagesToLoad, api }));
                return dispatchResult as any as Promise<LoadRemoteResults[]>;
            };

            const handleLoadFakeImagesProxy = (imagesToLoad: MessageRemoteImage[]) => {
                const dispatchResult = dispatch(loadFakeProxy({ ID: localID, imagesToLoad, api }));
                return dispatchResult as any as Promise<LoadRemoteResults[]>;
            };

            const handleLoadRemoteImagesDirect = (imagesToLoad: MessageRemoteImage[]) => {
                const dispatchResult = dispatch(loadRemoteDirect({ ID: localID, imagesToLoad, api }));
                return dispatchResult as any as Promise<LoadRemoteResults[]>;
            };

            preparation = isPlainText({ MIMEType })
                ? await preparePlainText(decryption.decryptedBody, isDraft(message.data))
                : await prepareHtml(
                      {
                          ...message,
                          decryption,
                          data: { ...message.data, Attachments: allAttachments },
                      },
                      base64Cache,
                      mailSettings,
                      handleLoadEmbeddedImages,
                      handleLoadRemoteImagesProxy,
                      handleLoadFakeImagesProxy,
                      handleLoadRemoteImagesDirect
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
            console.error('Message initialization error', error);
        } finally {
            dispatch(
                documentInitializeFulfilled({
                    ID: localID,
                    dataChanges,
                    initialized,
                    preparation,
                    decryption,
                    errors,
                    messageImages,
                })
            );
        }
    }, [localID]);
};
