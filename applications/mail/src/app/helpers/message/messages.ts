import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { attachmentsSize } from '@proton/shared/lib/mail/messages';
import uniqueBy from '@proton/utils/uniqueBy';

import { MarkAsChanges } from '../../hooks/optimistic/useOptimisticMarkAs';
import { MARK_AS_STATUS } from '../../hooks/useMarkAs';
import {
    MessageImages,
    MessageState,
    MessageStateWithData,
    PartialMessageState,
} from '../../logic/messages/messagesTypes';
import { getContent, setContent } from './messageContent';
import { getEmbeddedImages } from './messageImages';

const { ALL_DRAFTS, ALL_SENT, DRAFTS, SENT, SPAM, INBOX } = MAILBOX_LABEL_IDS;

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

const getIsSelfMessage = (message: Message) => {
    const { Sender, ToList = [], CCList = [], BCCList = [] } = message;

    const isSelfToList = ToList.find((recipient) => recipient.Address === Sender.Address);
    const isSelfCCList = CCList.find((recipient) => recipient.Address === Sender.Address);
    const isSelfBCCList = BCCList.find((recipient) => recipient.Address === Sender.Address);
    return isSelfToList || isSelfCCList || isSelfBCCList;
};

export const getMessagesAuthorizedToMove = (messages: Message[], destinationFolderID: string) => {
    return messages.filter((message) => {
        const { LabelIDs } = message;

        if (
            LabelIDs.includes(DRAFTS) ||
            LabelIDs.includes(ALL_DRAFTS) ||
            LabelIDs.includes(SENT) ||
            LabelIDs.includes(ALL_SENT)
        ) {
            // If the user sent the message to himself, he can move it to inbox
            const isSelfMessage = getIsSelfMessage(message);

            const excludedDestinations = [SPAM];
            if (!isSelfMessage) {
                excludedDestinations.push(INBOX);
            }

            return !(excludedDestinations as string[]).includes(destinationFolderID);
        }

        return true;
    });
};

export const getMessageHasData = (message: MessageState): message is MessageStateWithData => !!message.data;

export const applyMarkAsChangesOnMessage = (message: Message, { status }: MarkAsChanges) => ({
    ...message,
    Unread: status === MARK_AS_STATUS.UNREAD ? 1 : 0,
});
