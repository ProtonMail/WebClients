import { useHistory } from 'react-router';

import { c } from 'ttag';

import { useApi, useNotifications } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import type { MessageKeys, MessageState } from '@proton/mail/store/messages/messagesTypes';
import { EOReply } from '@proton/shared/lib/api/eo';
import { blobURLtoBlob } from '@proton/shared/lib/helpers/file';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { useMailDispatch } from 'proton-mail/store/hooks';

import SendingMessageNotification, {
    createSendingMessageNotificationManager,
} from '../../components/notifications/SendingMessageNotification';
import { EO_MESSAGE_REDIRECT_PATH, MIN_DELAY_SENT_NOTIFICATION } from '../../constants';
import { getDecryptedAttachment } from '../../helpers/attachment/attachmentLoader';
import { encryptFile } from '../../helpers/attachment/attachmentUploader';
import { createBlob, readContentIDandLocation } from '../../helpers/message/messageEmbeddeds';
import { prepareExport } from '../../helpers/message/messageExport';
import { EOAddReply } from '../../store/eo/eoActions';
import type { EOMessageReply } from '../../store/eo/eoType';

interface EOAttachment {
    Filename: string[];
    DataPacket: Blob[];
    KeyPackets: Blob[];
    ContentID: string[];
    MIMEType: string[];
}

interface Props {
    message: MessageState;
    encryptionKey?: PublicKeyReference;
    outsideKey?: MessageKeys;
}

export const useSendEO = ({ message, encryptionKey, outsideKey }: Props) => {
    const api = useApi();
    const dispatch = useMailDispatch();
    const history = useHistory();
    const notifManager = createSendingMessageNotificationManager();
    const { createNotification, hideNotification } = useNotifications();

    let password = '';
    let decryptedToken = '';
    let id = '';

    if (outsideKey?.type === 'outside') {
        password = outsideKey.password;
        decryptedToken = outsideKey.decryptedToken;
        id = outsideKey.id;
    }

    /** To get Data and Key packets, we need to :
     *  - Get attachments data from BE to build the blob URL
     *  - Create the actual blob from the blob URL
     *  - Encrypt the blob to get the packets which contains Data and Key packets
     */
    const handleOriginalMessageEmbedded = async (packages: EOAttachment, attachment: Attachment) => {
        if (outsideKey && encryptionKey) {
            const decryptedAttachment = await getDecryptedAttachment(attachment, undefined, outsideKey, api);

            const blobURL = createBlob(attachment, decryptedAttachment.data as Uint8Array<ArrayBuffer>);

            const blob = await blobURLtoBlob(blobURL);

            const packet = await encryptFile(blob as File, true, encryptionKey);

            packages.DataPacket.push(new Blob([packet.data]));
            packages.KeyPackets.push(new Blob([packet.keys]));
        }
    };

    const send = async () => {
        notifManager.ID = createNotification({
            text: <SendingMessageNotification manager={notifManager} />,
            expiration: -1,
            showCloseButton: false,
        });

        try {
            const replyContent = prepareExport(message);

            const Body = (
                await CryptoProxy.encryptMessage({
                    textData: replyContent,
                    stripTrailingSpaces: true,
                    encryptionKeys: encryptionKey,
                })
            ).message;

            const ReplyBody = (
                await CryptoProxy.encryptMessage({
                    textData: replyContent,
                    stripTrailingSpaces: true,
                    passwords: [password],
                })
            ).message;

            const Packages = {
                Filename: [],
                DataPacket: [],
                KeyPackets: [],
                ContentID: [],
                MIMEType: [],
            } as EOAttachment;

            for (const attachment of message.data?.Attachments || []) {
                const { cid } = readContentIDandLocation(attachment);

                Packages.ContentID.push(cid);
                Packages.Filename.push(attachment.Name || '');
                Packages.MIMEType.push(attachment.MIMEType || '');

                /** Uploaded attachments during reply composition already contains Data and KeyPackets.
                 *  However, we do not have these data for embedded images in the original message, which are in the reply blockquotes
                 *  We need to get original message embedded images data in order to build KeyPackets and DataPacket before sending
                 */
                if (!attachment.DataPacket) {
                    await handleOriginalMessageEmbedded(Packages, attachment);
                } else {
                    // Attachments from EO message to send
                    Packages.DataPacket.push(attachment.DataPacket);
                    Packages.KeyPackets.push(attachment.KeyPackets);
                }
            }

            const data = {
                Body,
                ReplyBody,
                'Filename[]': Packages ? Packages.Filename : [],
                'MIMEType[]': Packages ? Packages.MIMEType : [],
                'ContentID[]': Packages ? Packages.ContentID : [],
                'KeyPackets[]': Packages ? Packages.KeyPackets : [],
                'DataPacket[]': Packages ? Packages.DataPacket : [],
            };

            const promise = api(EOReply(decryptedToken || '', id, data));

            notifManager.setProperties(promise);
            const result = (await promise) as unknown as { Reply: EOMessageReply };

            if (result?.Reply) {
                await dispatch(EOAddReply(result.Reply));
            }

            history.push(`${EO_MESSAGE_REDIRECT_PATH}/${id}`);

            await wait(MIN_DELAY_SENT_NOTIFICATION);
            hideNotification(notifManager.ID);
        } catch (error: any) {
            hideNotification(notifManager.ID);

            createNotification({
                type: 'error',
                text: c('Error').t`Error while sending the message. Message is not sent.`,
            });

            console.error('Error while sending the message.', error);
            throw error;
        }
    };

    return { send };
};
