import { useHistory } from 'react-router';

import type { PublicKeyReference } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';
import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import SendingMessageNotification, {
    createSendingMessageNotificationManager,
} from '@proton/mail-composer/components/notifications/SendingMessageNotification';
import { MIN_DELAY_SENT_NOTIFICATION } from '@proton/mail-composer/constants';
import { encryptFile } from '@proton/mail-composer/helpers/attachment/attachmentUploader';
import { getDecryptedAttachment } from '@proton/mail-message/helpers/attachment/attachmentLoader';
import { createBlob, readContentIDandLocation } from '@proton/mail-message/helpers/message/messageEmbeddeds';
import type { MessageKeys, MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { EOReply } from '@proton/shared/lib/api/eo';
import { blobURLtoBlob } from '@proton/shared/lib/helpers/file';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { EO_MESSAGE_REDIRECT_PATH } from '../../constants';
import { hasNothingBeforeBlockquote } from '../../helpers/eo/replyContent';
import { EOAddReply } from '../../store/eo/eoActions';
import type { EOMessageReply } from '../../store/eo/eoType';
import { useMailDispatch } from '../../store/hooks';

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

    /** `replyContent` is exported by the caller so it can realign the model with the editor
     *  first. See `ensureMessageContent` in EOComposer.
     */
    const send = async (replyContent: string) => {
        /** A totally empty export means the message document was wiped. It is narrow on
         *  purpose: a reply draft always carries the quoted original and the signature, so
         *  this does not fire when only the recipient's own text went missing. Encrypting an
         *  empty string is never right though, so refuse the send outright.
         */
        if (replyContent.trim() === '') {
            captureMessage('EO reply aborted because the composer produced an empty body', {
                extra: {
                    hasMessageDocument: !!message.messageDocument?.document,
                    attachmentCount: message.data?.Attachments?.length ?? 0,
                },
            });

            createNotification({
                type: 'error',
                text: c('Error').t`Cannot send an empty message. Message is not sent.`,
            });

            throw new Error('EO reply has an empty body');
        }

        /** This is the shape users actually reported. It is only reported, never blocked:
         *  replying with an attachment and no text is legitimate, and `attachmentCount` tells
         *  the two apart. It exists to show whether content is still going missing now that
         *  EOComposer realigns the model with the editor before exporting.
         */
        if (hasNothingBeforeBlockquote(replyContent)) {
            captureMessage('EO reply sent with no content before the quoted original', {
                extra: {
                    attachmentCount: message.data?.Attachments?.length ?? 0,
                },
            });
        }

        notifManager.ID = createNotification({
            text: <SendingMessageNotification manager={notifManager} />,
            expiration: -1,
            showCloseButton: false,
        });

        try {
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
