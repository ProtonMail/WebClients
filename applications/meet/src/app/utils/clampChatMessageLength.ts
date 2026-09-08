import { CHAT_MESSAGE_MAX_LENGTH } from '../constants';
import { trimMessage } from './trim-message';

export const clampChatMessageLength = (value: string) => {
    if (trimMessage(value).length <= CHAT_MESSAGE_MAX_LENGTH) {
        return value;
    }

    const leadingWhitespaceLength = value.length - value.trimStart().length;

    return value.slice(0, leadingWhitespaceLength + CHAT_MESSAGE_MAX_LENGTH);
};
