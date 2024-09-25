import { useCallback } from 'react';

import type { PayloadAction } from '@reduxjs/toolkit';

import { useApi, useAuthentication, useProgressiveRollout } from '@proton/components';
import type { WorkerDecryptionResult } from '@proton/crypto';
import { FeatureCode, useFeature } from '@proton/features';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { isDraft, isPlainText } from '@proton/shared/lib/mail/messages';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';
import uniqueBy from '@proton/utils/uniqueBy';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from '../../constants';
import { getPureAttachments } from '../../helpers/attachment/attachment';
import { isUnreadMessage } from '../../helpers/elements';
import { isNetworkError } from '../../helpers/errors';
import { decryptMessage } from '../../helpers/message/messageDecrypt';
import {
    handleDispatchLoadFakeImagesProxy,
    handleDispatchLoadImagesProxy,
    handleDispatchLoadRemoteImagesDirect,
} from '../../helpers/message/messageImages';
import { loadMessage } from '../../helpers/message/messageRead';
import type { Preparation } from '../../helpers/transforms/transforms';
import { prepareHtml, preparePlainText } from '../../helpers/transforms/transforms';
import { updateAttachment } from '../../store/attachments/attachmentsActions';
import { loadEmbedded } from '../../store/messages/images/messagesImagesActions';
import type {
    LoadEmbeddedParams,
    LoadEmbeddedResults,
    LoadRemoteResults,
    MessageErrors,
    MessageImages,
    MessageRemoteImage,
    MessageState,
    MessageStateWithDataFull,
} from '../../store/messages/messagesTypes';
import {
    cleanUTMTrackers,
    documentInitializeFulfilled,
    documentInitializePending,
    load,
} from '../../store/messages/read/messagesReadActions';
import { useMarkAs } from '../actions/markAs/useMarkAs';
import { useGetAttachment } from '../attachments/useAttachment';
import { useBase64Cache } from '../useBase64Cache';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useKeyVerification } from './useKeyVerification';
import { useGetMessage } from './useMessage';

export const useInitializeMessage = () => {
    const api = useApi();
    const { markAs } = useMarkAs();
    const dispatch = useMailDispatch();
    const getMessage = useGetMessage();
    const getMessageKeys = useGetMessageKeys();
    const getAttachment = useGetAttachment();
    const base64Cache = useBase64Cache();
    const mailSettings = useMailModel('MailSettings');
    const { verifyKeys } = useKeyVerification();
    const authentication = useAuthentication();

    const { feature } = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded);

    const isNumAttachmentsWithoutEmbedded = feature?.Value;
    const canCleanUTMTrackers = useProgressiveRollout(FeatureCode.CleanUTMTrackers);

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(async (localID: string, labelID?: string) => {
        // Message can change during the whole initialization sequence
        // To have the most up to date version, best is to get back to the cache version each time
        const getData = () => (getMessage(localID) as MessageStateWithDataFull).data;

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
            dispatch(load.fulfilled(message.data, load.fulfilled.toString(), { ID: localID }));

            const messageKeys = await getMessageKeys(message.data);

            decryption = await decryptMessage(getData(), messageKeys.privateKeys, onUpdateAttachment);

            if (decryption.mimetype) {
                dataChanges = { ...dataChanges, MIMEType: decryption.mimetype };
            }
            const mimeAttachments = decryption.attachments || [];

            // Get Pure Mime Attachments to prevent display of embedded images in the attachment list
            const pureMimeAttachments = getPureAttachments(mimeAttachments, isNumAttachmentsWithoutEmbedded);

            // The backend is supposed to filter embedded images,
            // but we sometimes we receive messages with a NumAttachment = 0 which contains pure attachments,
            // This leads to hide the attachment list, and the user is not able to see the message attachments
            // We are doing an additional verification to update NumAttachments if needed
            const pureAttachments = getPureAttachments(getData().Attachments, isNumAttachmentsWithoutEmbedded) || [];

            // If we calculate a different NumAttachments than the one received,
            // we need to update the message to display the attachment list
            const numAttachments =
                pureAttachments.length !== getData().NumAttachments ? pureAttachments.length : getData().NumAttachments;

            const allAttachments = [...(getData().Attachments || []), ...mimeAttachments];
            dataChanges = {
                ...dataChanges,
                Attachments: allAttachments,
                NumAttachments: numAttachments + pureMimeAttachments.length,
            };

            if (decryption.errors) {
                Object.assign(errors, decryption.errors);

                // Get message decryption key to display a notification to the user that its password may have been reset recently
                await verifyKeys(message.data);
            }

            if (isUnreadMessage(getData())) {
                void markAs({
                    elements: [getData()],
                    labelID,
                    status: MARK_AS_STATUS.READ,
                });
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
                        messageFlags: message.data.Flags,
                    })
                ) as any as Promise<PayloadAction<LoadEmbeddedResults, string, { arg: LoadEmbeddedParams }>>;
                const { payload } = await dispatchResult;
                return payload;
            };

            const handleLoadRemoteImagesProxy = (imagesToLoad: MessageRemoteImage[]) => {
                return handleDispatchLoadImagesProxy(localID, imagesToLoad, authentication, dispatch);
            };

            const handleLoadFakeImagesProxy = (imagesToLoad: MessageRemoteImage[], firstLoad?: boolean) => {
                return handleDispatchLoadFakeImagesProxy(localID, imagesToLoad, api, dispatch, firstLoad);
            };

            const handleLoadRemoteImagesDirect = (imagesToLoad: MessageRemoteImage[]) => {
                return handleDispatchLoadRemoteImagesDirect(localID, imagesToLoad, dispatch);
            };

            const handleCleanUTMTrackers = (utmTrackers: MessageUTMTracker[]) => {
                const uniqueTrackers = uniqueBy(utmTrackers, (tracker) => tracker.originalURL);
                const dispatchResult = dispatch(cleanUTMTrackers({ ID: localID, utmTrackers: uniqueTrackers }));
                return dispatchResult as any as Promise<LoadRemoteResults[]>;
            };

            preparation = isPlainText({ MIMEType })
                ? await preparePlainText(
                      decryption.decryptedBody,
                      isDraft(message.data),
                      mailSettings,
                      canCleanUTMTrackers,
                      handleCleanUTMTrackers
                  )
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
                      handleLoadRemoteImagesDirect,
                      handleCleanUTMTrackers,
                      canCleanUTMTrackers
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
    }, []);
};
