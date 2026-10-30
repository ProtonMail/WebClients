import { useCallback } from 'react';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useComposerMessageHost } from '@proton/mail-composer/host/composerMessageHost';
import { createEmbeddedImageFromUpload } from '@proton/mail-message/helpers/message/messageEmbeddeds';
import { useGetMessage } from '@proton/mail-message/hooks/message/useGetMessage';
import { sendModifications } from '@proton/mail-message/store/messages/draft/messagesDraftActions';
import type { MessageEmbeddedImage, MessageStateWithData } from '@proton/mail-message/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';
import { isAttachPublicKey, isPlainText } from '@proton/shared/lib/mail/messages';

import { upload } from '../../helpers/attachment/attachmentUploader';
import { attachPublicKey } from '../../helpers/message/messageAttachPublicKey';
import { replaceDataUrl } from '../../helpers/message/messageDataUrl';
import { useMailDispatch } from '../../store/hooks';

export const useSendModifications = () => {
    const getMessage = useGetMessage();
    const dispatch = useMailDispatch();
    const { useGetMessageKeys } = useComposerMessageHost();
    const getMessageKeys = useGetMessageKeys();
    const auth = useAuthentication();

    return useCallback(async (inputMessage: MessageStateWithData) => {
        const message = {
            ...(getMessage(inputMessage.localID) as MessageStateWithData),
            messageDocument: inputMessage.messageDocument,
        };

        const messageKeys = await getMessageKeys(message.data);
        const attachments: Attachment[] = [];
        const images: MessageEmbeddedImage[] = [];
        const isPlainTextMessage = isPlainText(message.data);

        // Add public key if selected
        if (isAttachPublicKey(message.data)) {
            const attachment = await attachPublicKey(message, messageKeys, auth.UID);
            if (attachment) {
                attachments.push(attachment);
            }
        }

        // Replace data url images by embedded images
        const replacedImages = replaceDataUrl(message);
        if (replacedImages.length) {
            for (const { cid, file } of replacedImages) {
                const [uploadInfo] = upload(
                    [file],
                    message,
                    messageKeys,
                    isPlainTextMessage ? ATTACHMENT_DISPOSITION.ATTACHMENT : ATTACHMENT_DISPOSITION.INLINE,
                    auth.UID,
                    cid
                );
                const uploadResult = await uploadInfo.resultPromise;
                attachments.push(uploadResult.attachment);
                if (!isPlainTextMessage) {
                    images.push(createEmbeddedImageFromUpload(uploadResult.attachment));
                }
            }
        }

        // Centralized update cache after modifications
        // Theses changes are willingly not saved to the draft
        dispatch(sendModifications({ ID: inputMessage.localID, attachments, images }));

        // Applying modifications on the model message to be sent
        // But keeping the document from the model
        return {
            ...getMessage(inputMessage.localID),
            messageDocument: inputMessage.messageDocument,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-7308E1
    }, []);
};
