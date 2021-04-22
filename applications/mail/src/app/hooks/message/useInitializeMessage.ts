import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { isDraft, isPlainText } from 'proton-shared/lib/mail/messages';
import { useCallback } from 'react';
import { useApi, useMailSettings } from 'react-components';

import { MessageExtended, MessageErrors, MessageExtendedWithData, EmbeddedMap } from '../../models/message';
import { loadMessage } from '../../helpers/message/messageRead';
import { useGetMessageKeys } from './useGetMessageKeys';
import { decryptMessage } from '../../helpers/message/messageDecrypt';
import { useAttachmentCache } from '../../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { prepareHtml, preparePlainText } from '../../helpers/transforms/transforms';
import { isNetworkError } from '../../helpers/errors';
import { useBase64Cache } from '../useBase64Cache';
import { useMarkAs, MARK_AS_STATUS } from '../useMarkAs';
import { isUnreadMessage } from '../../helpers/elements';
import { hasShowEmbedded } from '../../helpers/settings';
import { useLoadEmbeddedImages } from './useLoadImages';

interface Preparation {
    plainText?: string;
    document?: Element;
    showEmbeddedImages?: boolean;
    showRemoteImages?: boolean;
    embeddeds?: EmbeddedMap;
}

export const useInitializeMessage = (localID: string, labelID?: string) => {
    const api = useApi();
    const markAs = useMarkAs();
    const messageCache = useMessageCache();
    const getMessageKeys = useGetMessageKeys();
    const attachmentsCache = useAttachmentCache();
    const base64Cache = useBase64Cache();
    const [mailSettings] = useMailSettings();
    const loadEmbeddedImages = useLoadEmbeddedImages(localID);

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

        let decryption;
        let preparation: Preparation | undefined;
        let dataChanges;

        try {
            // Ensure the message data is loaded
            const message = await loadMessage(messageFromCache, api);
            updateMessageCache(messageCache, localID, { data: message.data });

            dataChanges = {} as Partial<Message>;

            const messageKeys = await getMessageKeys(message.data);

            decryption = await decryptMessage(getData(), messageKeys.privateKeys, attachmentsCache);

            if (decryption.mimetype) {
                dataChanges = { ...dataChanges, MIMEType: decryption.mimetype };
            }
            const mimeAttachments = decryption.attachments || [];
            const allAttachments = [...getData().Attachments, ...mimeAttachments];
            dataChanges = { ...dataChanges, Attachments: allAttachments, NumAttachments: allAttachments.length };

            if (decryption.errors) {
                Object.assign(errors, decryption.errors);
            }

            if (isUnreadMessage(getData())) {
                markAs([getData()], labelID, MARK_AS_STATUS.READ);
                dataChanges = { ...dataChanges, Unread: 0 };
            }

            const MIMEType = dataChanges.MIMEType || getData().MIMEType;

            preparation = isPlainText({ MIMEType })
                ? await preparePlainText(decryption.decryptedBody, isDraft(message.data))
                : await prepareHtml(
                      { ...message, decryptedBody: decryption.decryptedBody },
                      messageKeys,
                      base64Cache,
                      attachmentsCache,
                      api,
                      mailSettings
                  );
        } catch (error) {
            if (isNetworkError(error)) {
                errors.network = [error];
            } else {
                errors.processing = [error];
            }
        } finally {
            updateMessageCache(messageCache, localID, {
                data: dataChanges,
                document: preparation?.document,
                plainText: preparation?.plainText,
                decryptedBody: decryption?.decryptedBody,
                decryptedRawContent: decryption?.decryptedRawContent,
                signature: decryption?.signature,
                decryptedSubject: decryption?.decryptedSubject,
                // Anticipate showEmbedded flag while triggering the load just after
                showEmbeddedImages: preparation?.showEmbeddedImages,
                showRemoteImages: preparation?.showRemoteImages,
                embeddeds: preparation?.embeddeds,
                errors,
                initialized: true,
            });
        }

        if (hasShowEmbedded(mailSettings)) {
            // Load embedded images as a second step not synchronized with the initialization
            // To prevent slowing the message body when there is heavy embedded attachments
            void loadEmbeddedImages();
        }
    }, [localID]);
};
