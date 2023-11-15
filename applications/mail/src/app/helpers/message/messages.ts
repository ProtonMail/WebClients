import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { attachmentsSize, isDraft, isReceived, isSent, isSentAndReceived } from '@proton/shared/lib/mail/messages';
import uniqueBy from '@proton/utils/uniqueBy';

import { MARK_AS_STATUS } from '../../hooks/actions/useMarkAs';
import { MarkAsChanges } from '../../hooks/optimistic/useOptimisticMarkAs';
import {
    MessageImages,
    MessageState,
    MessageStateWithData,
    MessageWithOptionalBody,
    PartialMessageState,
} from '../../logic/messages/messagesTypes';
import { getContent, setContent } from './messageContent';
import { getEmbeddedImages } from './messageImages';

const { SENT, DRAFTS, INBOX, SPAM } = MAILBOX_LABEL_IDS;

export const getAttachmentCounts = (attachments: Attachment[], messageImages: MessageImages | undefined) => {
    const size = attachmentsSize({ Attachments: attachments } as Message);
    const sizeLabel = humanSize(size);

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
        if ([SENT, DRAFTS, INBOX, SPAM].includes(destinationFolderID as MAILBOX_LABEL_IDS)) {
            const excludedDestinations = [];

            if (!isSentAndReceived(message)) {
                if (isReceived(message)) {
                    excludedDestinations.push(...[SENT, DRAFTS]);
                }

                if (isSent(message)) {
                    excludedDestinations.push(...[INBOX, DRAFTS, SPAM]);
                }
            }

            if (isDraft(message)) {
                excludedDestinations.push(...[INBOX, SENT, SPAM]);
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
