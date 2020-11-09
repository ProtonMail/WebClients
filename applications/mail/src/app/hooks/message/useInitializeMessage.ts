import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { isPlainText } from 'proton-shared/lib/mail/messages';
import { useCallback } from 'react';
import { useApi, useMailSettings } from 'react-components';

import { MessageExtended, MessageErrors, MessageExtendedWithData } from '../../models/message';
import { loadMessage } from '../../helpers/message/messageRead';
import { useMessageKeys } from './useMessageKeys';
import { decryptMessage } from '../../helpers/message/messageDecrypt';
import { useAttachmentCache } from '../../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { prepareMailDocument } from '../../helpers/transforms/transforms';
import { isApiError } from '../../helpers/errors';
import { useBase64Cache } from '../useBase64Cache';
import { useMarkAs, MARK_AS_STATUS } from '../useMarkAs';
import { isUnreadMessage } from '../../helpers/elements';
import { hasShowEmbedded } from '../../helpers/settings';
import { useLoadEmbeddedImages } from './useLoadImages';
import { useVerifyMessage } from './useVerifyMessage';

export const useInitializeMessage = (localID: string, labelID?: string) => {
    const api = useApi();
    const markAs = useMarkAs();
    const messageCache = useMessageCache();
    const getMessageKeys = useMessageKeys();
    const attachmentsCache = useAttachmentCache();
    const base64Cache = useBase64Cache();
    const [mailSettings] = useMailSettings();
    const loadEmbeddedImages = useLoadEmbeddedImages(localID);
    const verifyMessage = useVerifyMessage(localID);

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

        let userKeys;
        let decryption;
        let preparation;
        let dataChanges;

        try {
            // Ensure the message data is loaded
            const message = await loadMessage(messageFromCache, api);
            updateMessageCache(messageCache, localID, { data: message.data });

            dataChanges = {} as Partial<Message>;

            userKeys = await getMessageKeys(message);
            const messageWithKeys = {
                ...message,
                publicKeys: [], // Signature verification are done later for performance
                privateKeys: userKeys.privateKeys,
            };

            decryption = await decryptMessage(getData(), userKeys.privateKeys, attachmentsCache);

            if (decryption.mimetype) {
                dataChanges = { ...dataChanges, MIMEType: decryption.mimetype };
            }
            const mimeAttachments = decryption.Attachments || [];
            const allAttachments = [...getData().Attachments, ...mimeAttachments];
            dataChanges = { ...dataChanges, Attachments: allAttachments, NumAttachments: allAttachments.length };

            if (decryption.errors) {
                Object.assign(errors, decryption.errors);
            }

            // Trigger all public key and signature verification but we are not waiting for it
            void verifyMessage(decryption.decryptedBody, decryption.signature);

            if (isUnreadMessage(getData())) {
                markAs([getData()], labelID, MARK_AS_STATUS.READ);
                dataChanges = { ...dataChanges, Unread: 0 };
            }

            const MIMEType = dataChanges.MIMEType || getData().MIMEType;

            preparation = isPlainText({ MIMEType })
                ? ({ plainText: decryption.decryptedBody } as any)
                : await prepareMailDocument(
                      { ...messageWithKeys, decryptedBody: decryption.decryptedBody },
                      base64Cache,
                      attachmentsCache,
                      api,
                      mailSettings
                  );
        } catch (error) {
            if (isApiError(error)) {
                errors.network = error;
            } else {
                errors.common = error;
            }
        } finally {
            updateMessageCache(messageCache, localID, {
                data: dataChanges,
                document: preparation?.document,
                plainText: preparation?.plainText,
                publicKeys: userKeys?.publicKeys,
                privateKeys: userKeys?.privateKeys,
                decryptedBody: decryption?.decryptedBody,
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
