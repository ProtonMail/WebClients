import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

export const getLabelsSetForMessage = (message: Message | undefined): Set<string> => {
    if (!message?.LabelIDs) {
        return new Set();
    }

    const result = new Set<string>();
    message.LabelIDs.forEach((label) => result.add(label));

    return result;
};
