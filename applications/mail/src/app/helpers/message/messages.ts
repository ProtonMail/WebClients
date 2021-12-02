import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { attachmentsSize } from '@proton/shared/lib/mail/messages';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { uniqueBy } from '@proton/shared/lib/helpers/array';
import { getContent, setContent } from './messageContent';
import { getEmbeddedImages } from './messageImages';
import {
    MessageImages,
    MessageState,
    MessageStateWithData,
    PartialMessageState,
} from '../../logic/messages/messagesTypes';
import { MARK_AS_STATUS } from '../../hooks/useMarkAs';
import { MarkAsChanges } from '../../hooks/optimistic/useOptimisticMarkAs';

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
    return messages.filter((messsage) => {
        const { LabelIDs } = messsage;

        if (
            LabelIDs.includes(DRAFTS) ||
            LabelIDs.includes(ALL_DRAFTS) ||
            LabelIDs.includes(SENT) ||
            LabelIDs.includes(ALL_SENT)
        ) {
            return !([SPAM, INBOX] as string[]).includes(destinationFolderID);
        }

        return true;
    });
};

export const getMessageHasData = (message: MessageState): message is MessageStateWithData => !!message.data;

export const applyMarkAsChangesOnMessage = (message: Message, { status }: MarkAsChanges) => ({
    ...message,
    Unread: status === MARK_AS_STATUS.UNREAD ? 1 : 0,
});
