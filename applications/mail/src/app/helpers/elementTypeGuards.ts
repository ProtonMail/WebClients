import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from '../models/conversation';
import type { Element } from '../models/element';
import { getTime as conversationGetTime } from './conversation';

export const isElementMessage = (element: Element | undefined): element is Message =>
    typeof (element as Message)?.ConversationID === 'string';

export const isElementConversation = (element: Element | undefined): element is Conversation =>
    !isElementMessage(element);

export const getDate = (element: Element | undefined, labelID: string | undefined) => {
    if (!element) {
        return new Date();
    }

    const time = isElementMessage(element) ? element.Time : conversationGetTime(element, labelID);

    return new Date((time || 0) * 1000);
};
