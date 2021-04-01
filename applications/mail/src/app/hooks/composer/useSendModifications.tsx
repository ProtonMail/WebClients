import { isAttachPublicKey } from 'proton-shared/lib/mail/messages';
import { useCallback } from 'react';
import { useAuthentication } from 'react-components';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { ATTACHMENT_ACTION, upload } from '../../helpers/attachment/attachmentUploader';
import { replaceDataUrl } from '../../helpers/embedded/embeddedDataUrl';
import { cloneEmbedddedMap, createEmbeddedInfo } from '../../helpers/embedded/embeddeds';
import { attachPublicKey } from '../../helpers/message/messageAttachPublicKey';
import { MessageExtendedWithData } from '../../models/message';
import { useGetMessageKeys } from '../message/useGetMessageKeys';

export const useSendMoficiations = () => {
    const messageCache = useMessageCache();
    const getMessageKeys = useGetMessageKeys();
    const auth = useAuthentication();

    return useCallback(async (inputMessage: MessageExtendedWithData) => {
        const message = messageCache.get(inputMessage.localID) as MessageExtendedWithData;
        const messageKeys = await getMessageKeys(message.data);
        const attachments = [...message.data.Attachments];
        const embeddeds = cloneEmbedddedMap(inputMessage.embeddeds);

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
                embeddeds.set(cid, createEmbeddedInfo(uploadResult));
            }
        }

        // Centralized update cache after modifications
        // Theses changes are willingly not saved to the draft
        return updateMessageCache(messageCache, inputMessage.localID, {
            embeddeds,
            data: {
                Attachments: attachments,
                // Needed to keep encryption flags right after saving
                Flags: inputMessage.data.Flags,
            },
        });
    }, []);
};
