import type {
    MessageImages,
    MessageState,
    MessageStateWithData,
    MessageWithOptionalBody,
    PartialMessageState,
} from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { attachmentsSize, isDraft, isReceived, isSent, isSentAndReceived } from '@proton/shared/lib/mail/messages';
import uniqueBy from '@proton/utils/uniqueBy';

import type { MarkAsChanges } from '../../hooks/optimistic/useOptimisticMarkAs';
import { getContent, setContent } from './messageContent';
import { getEmbeddedImages } from './messageImages';

export const getAttachmentCounts = (attachments: Attachment[], messageImages: MessageImages | undefined) => {
    const size = attachmentsSize({ Attachments: attachments } as Message);
    const sizeLabel = humanSize({ bytes: size });

    const embeddedImages = getEmbeddedImages({ messageImages });
    const embeddedAttachmentsWithDups = embeddedImages.map(({ attachment }) => attachment);
    const embeddedAttachments = uniqueBy(embeddedAttachmentsWithDups, (attachment) => attachment.ID);
    const pureAttachments = attachments.filter(
        (attachment) => !embeddedAttachments.find((embeddedAttachment) => attachment.ID === embeddedAttachment.ID)
    );

    const embeddedAttachmentSize = attachmentsSize({ Attachments: embeddedAttachments } as Message);
    const pureAttachmentSize = attachmentsSize({ Attachments: pureAttachments } as Message);

    const pureAttachmentsCount = pureAttachments.length;
    const embeddedAttachmentsCount = embeddedAttachments.length;
    const attachmentsCount = pureAttachmentsCount + embeddedAttachmentsCount;

    return {
        size,
        sizeLabel,
        pureAttachments,
        pureAttachmentsCount,
        embeddedAttachmentsCount,
        attachmentsCount,
        embeddedAttachmentSize,
        pureAttachmentSize,
    };
};

/**
 * Apply updates from the message model to the message in state
 */
export const mergeMessages = (
    messageState: MessageState | undefined,
    messageModel: PartialMessageState
): MessageState => {
    if (messageState?.messageDocument?.document && messageModel.messageDocument?.document) {
        setContent(messageState, getContent(messageModel));
    }
    return {
        ...messageState,
        ...messageModel,
        data: { ...messageState?.data, ...messageModel.data } as Message,
        decryption: { ...messageState?.decryption, ...messageModel.decryption },
        messageDocument: { ...messageState?.messageDocument, ...messageModel.messageDocument },
        verification: { ...messageState?.verification, ...messageModel.verification },
        draftFlags: { ...messageState?.draftFlags, ...messageModel.draftFlags },
        errors: { ...messageState?.errors, ...messageModel.errors },
    } as MessageState;
};

export const getMessagesAuthorizedToMove = (messages: Message[], destinationFolderID: string) => {
    return messages.filter((message) => {
        if (
            [
                MAILBOX_LABEL_IDS.SENT,
                MAILBOX_LABEL_IDS.DRAFTS,
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.SPAM,
            ].includes(destinationFolderID as MAILBOX_LABEL_IDS)
        ) {
            const excludedDestinations = [];

            if (!isSentAndReceived(message)) {
                if (isReceived(message)) {
                    excludedDestinations.push(...[MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.DRAFTS]);
                }

                if (isSent(message)) {
                    excludedDestinations.push(
                        ...[MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.DRAFTS, MAILBOX_LABEL_IDS.SPAM]
                    );
                }
            }

            if (isDraft(message)) {
                excludedDestinations.push(...[MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.SPAM]);
            }

            return !excludedDestinations.includes(destinationFolderID as MAILBOX_LABEL_IDS);
        }

        return true;
    });
};

export const getMessageHasData = (message: MessageState): message is MessageStateWithData => !!message.data;

export const applyMarkAsChangesOnMessage = <T>(
    message: MessageWithOptionalBody & T,
    { status, displaySnoozedReminder }: MarkAsChanges
): MessageWithOptionalBody & T => ({
    ...message,
    DisplaySnoozedReminder: displaySnoozedReminder,
    Unread: status === MARK_AS_STATUS.UNREAD ? 1 : 0,
});
