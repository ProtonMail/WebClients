import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useAuthentication } from '@proton/components';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { isAttachPublicKey } from '@proton/shared/lib/mail/messages';

import { ATTACHMENT_ACTION, upload } from '../../helpers/attachment/attachmentUploader';
import { attachPublicKey } from '../../helpers/message/messageAttachPublicKey';
import { replaceDataUrl } from '../../helpers/message/messageDataUrl';
import { createEmbeddedImageFromUpload } from '../../helpers/message/messageEmbeddeds';
import { sendModifications } from '../../logic/messages/draft/messagesDraftActions';
import { MessageEmbeddedImage, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { useGetMessageKeys } from '../message/useGetMessageKeys';
import { useGetMessage } from '../message/useMessage';

export const useSendModifications = () => {
    const getMessage = useGetMessage();
    const dispatch = useDispatch();
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
                const [uploadInfo] = upload([file], message, messageKeys, ATTACHMENT_ACTION.INLINE, auth.UID, cid);
                const uploadResult = await uploadInfo.resultPromise;
                attachments.push(uploadResult.attachment);
                images.push(createEmbeddedImageFromUpload(uploadResult.attachment));
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
    }, []);
};
