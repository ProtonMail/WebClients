import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { isAttachPublicKey } from '@proton/shared/lib/mail/messages';
import { useAuthentication } from '@proton/components';
import { ATTACHMENT_ACTION, upload } from '../../helpers/attachment/attachmentUploader';
import { attachPublicKey } from '../../helpers/message/messageAttachPublicKey';
import { replaceDataUrl } from '../../helpers/message/messageDataUrl';
import { createEmbeddedImageFromUpload } from '../../helpers/message/messageEmbeddeds';
import { useGetMessageKeys } from '../message/useGetMessageKeys';
import { MessageStateWithData, MessageEmbeddedImage } from '../../logic/messages/messagesTypes';
import { useGetMessage } from '../message/useMessage';
import { sendModifications } from '../../logic/messages/messagesActions';

export const useSendMoficiations = () => {
    // const messageCache = useMessageCache();
    const getMessage = useGetMessage();
    const dispatch = useDispatch();
    const getMessageKeys = useGetMessageKeys();
    const auth = useAuthentication();

    return useCallback(async (inputMessage: MessageStateWithData) => {
        // const message = messageCache.get(inputMessage.localID) as MessageExtendedWithData;
        const message = getMessage(inputMessage.localID) as MessageStateWithData;
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
                images.push(createEmbeddedImageFromUpload(uploadResult));
            }
        }

        // Centralized update cache after modifications
        // Theses changes are willingly not saved to the draft
        // return updateMessageCache(messageCache, inputMessage.localID, {
        //     data: {
        //         Attachments: attachments,
        //         // Needed to keep encryption flags right after saving
        //         Flags: inputMessage.data.Flags,
        //     },
        //     messageImages: updateImages(message.messageImages, undefined, undefined, embeddedImages),
        // });
        dispatch(sendModifications({ ID: inputMessage.localID, attachments, images }));

        return getMessage(inputMessage.localID);
    }, []);
};
