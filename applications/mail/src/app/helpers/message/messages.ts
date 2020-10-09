import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { getAttachments } from 'proton-shared/lib/mail/messages';
import { MessageExtended, PartialMessageExtended } from '../../models/message';
import { getContent, setContent } from './messageContent';

export const getNumAttachmentByType = (message: MessageExtended): [number, number] => {
    const attachments = getAttachments(message.data);
    const numAttachments = attachments.length;
    const numEmbedded = message.embeddeds?.size || 0;
    const numPureAttachments = numAttachments - numEmbedded;
    return [numPureAttachments, numEmbedded];
};

/**
 * Apply updates from the message model to the message in state
 */
export const mergeMessages = (
    messageState: MessageExtended | undefined,
    messageModel: PartialMessageExtended
): MessageExtended => {
    if (messageState?.document && messageModel.document) {
        setContent(messageState, getContent(messageModel));
    }
    return {
        ...messageState,
        ...messageModel,
        data: { ...messageState?.data, ...messageModel.data } as Message,
        errors: { ...messageState?.errors, ...messageModel.errors }
    } as MessageExtended;
};
