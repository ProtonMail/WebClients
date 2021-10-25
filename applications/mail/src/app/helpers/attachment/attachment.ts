import { MessageState } from '../../logic/messages/messagesTypes';

export const updateKeyPackets = (modelMessage: MessageState, syncedMessage: MessageState) => {
    let changed = false;
    const Attachments = modelMessage.data?.Attachments?.map((attachment) => {
        const match = syncedMessage?.data?.Attachments.find(
            (syncedAttachment) => attachment.ID === syncedAttachment.ID
        );
        if (match && attachment.KeyPackets !== match.KeyPackets) {
            changed = true;
            return { ...attachment, KeyPackets: match.KeyPackets };
        }
        return attachment;
    });
    return { changed, Attachments };
};
