import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isDraft, isPlainText } from '@proton/shared/lib/mail/messages';
import { useCallback } from 'react';
import { useApi, useMailSettings } from '@proton/components';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useDispatch } from 'react-redux';
import { DecryptResultPmcrypto } from 'pmcrypto';
import {
    MessageExtended,
    MessageErrors,
    MessageExtendedWithData,
    MessageImage,
    MessageImages,
} from '../../models/message';
import { loadMessage } from '../../helpers/message/messageRead';
import { useGetMessageKeys } from './useGetMessageKeys';
import { decryptMessage } from '../../helpers/message/messageDecrypt';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { prepareHtml, preparePlainText } from '../../helpers/transforms/transforms';
import { isNetworkError } from '../../helpers/errors';
import { useBase64Cache } from '../useBase64Cache';
import { useMarkAs, MARK_AS_STATUS } from '../useMarkAs';
import { isUnreadMessage } from '../../helpers/elements';
import { LOAD_RETRY_COUNT, LOAD_RETRY_DELAY } from '../../constants';
import { useKeyVerification } from './useKeyVerification';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import { useGetAttachment } from '../useAttachment';

interface Preparation {
    plainText?: string;
    document?: Element;
    showEmbeddedImages?: boolean;
    showRemoteImages?: boolean;
    hasRemoteImages?: boolean;
    hasEmbeddedImages?: boolean;
    remoteImages?: MessageImage[];
    embeddedImages?: MessageImage[];
}

export const useInitializeMessage = (localID: string, labelID?: string) => {
    const api = useApi();
    const markAs = useMarkAs();
    const messageCache = useMessageCache();
    const getMessageKeys = useGetMessageKeys();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const base64Cache = useBase64Cache();
    const [mailSettings] = useMailSettings();
    const { verifyKeys } = useKeyVerification();

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(async () => {
        // Message can change during the whole initilization sequence
        // To have the most up to date version, best is to get back to the cache version each time
        const getData = () => (messageCache.get(localID) as MessageExtendedWithData).data;

        // Cache entry will be (at least) initialized by the queue system
        const messageFromCache = messageCache.get(localID) as MessageExtended;

        // If the message is not yet loaded at all, the localID is the message ID
        if (!messageFromCache || !messageFromCache.data) {
            messageFromCache.data = { ID: localID } as Message;
        }

        updateMessageCache(messageCache, localID, { initialized: false });

        const errors: MessageErrors = {};
        const { loadRetry = 0 } = messageFromCache;
        let initialized: boolean | undefined = true;
        let decryption;
        let preparation: Preparation | undefined;
        let dataChanges;
        let messageImages: MessageImages | undefined;

        try {
            // Ensure the message data is loaded
            const message = await loadMessage(messageFromCache, api);
            updateMessageCache(messageCache, localID, { data: message.data });

            dataChanges = {} as Partial<Message>;

            const messageKeys = await getMessageKeys(message.data);

            decryption = await decryptMessage(getData(), messageKeys.privateKeys, getAttachment, onUpdateAttachment);

            if (decryption.mimetype) {
                dataChanges = { ...dataChanges, MIMEType: decryption.mimetype };
            }
            const mimeAttachments = decryption.attachments || [];
            const allAttachments = [...getData().Attachments, ...mimeAttachments];
            dataChanges = {
                ...dataChanges,
                Attachments: allAttachments,
                NumAttachments: getData().NumAttachments + mimeAttachments.length,
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

            preparation = isPlainText({ MIMEType })
                ? await preparePlainText(decryption.decryptedBody, isDraft(message.data))
                : await prepareHtml(
                      {
                          ...message,
                          decryptedBody: decryption.decryptedBody,
                          data: { ...message.data, Attachments: allAttachments },
                      },
                      messageKeys,
                      messageCache,
                      base64Cache,
                      getAttachment,
                      onUpdateAttachment,
                      api,
                      mailSettings
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
            updateMessageCache(messageCache, localID, {
                data: dataChanges,
                document: preparation?.document,
                plainText: preparation?.plainText,
                decryptedBody: decryption?.decryptedBody,
                decryptedRawContent: decryption?.decryptedRawContent,
                signature: decryption?.signature,
                decryptedSubject: decryption?.decryptedSubject,
                errors,
                loadRetry: loadRetry + 1,
                initialized,
                messageImages,
            });
        }
    }, [localID]);
};
