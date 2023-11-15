import { addDays, getUnixTime, nextMonday, nextSaturday, set } from 'date-fns';
import { c, msgid } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { getDate, isConversation, isMessage } from '../helpers/elements';
import { SNOOZE_DURATION } from '../hooks/actions/useSnooze';
import { Conversation } from '../models/conversation';
import { Element } from '../models/element';

export const getSnoozeUnixTime = (duration: SNOOZE_DURATION, snoozeTime?: Date) => {
    const today = new Date();

    switch (duration) {
        case 'tomorrow':
            const tomorrow = addDays(today, 1);
            return getUnixTime(set(tomorrow, { minutes: 0, seconds: 0, milliseconds: 0, hours: 9 }));
        case 'later':
            const twoDaysFromNow = addDays(today, 2);
            return getUnixTime(set(twoDaysFromNow, { minutes: 0, seconds: 0, milliseconds: 0, hours: 9 }));
        case 'weekend':
            const nextSat = nextSaturday(today);
            return getUnixTime(set(nextSat, { minutes: 0, seconds: 0, milliseconds: 0, hours: 9 }));
        case 'nextweek':
            const nextMon = nextMonday(today);
            return getUnixTime(set(nextMon, { minutes: 0, seconds: 0, milliseconds: 0, hours: 9 }));
        case 'custom':
            if (!snoozeTime) {
                throw new Error('Snooze time is required for custom snooze');
            }
            return getUnixTime(snoozeTime);
    }
};

export const getSnoozeNotificationText = (isSnoozing: boolean, elementsCount: number) => {
    if (isSnoozing) {
        return c('Success').ngettext(
            msgid`${elementsCount} conversation snoozed`,
            `${elementsCount} conversations snoozed`,
            elementsCount
        );
    }

    return c('Success').ngettext(
        msgid`${elementsCount} conversation unsnoozed`,
        `${elementsCount} conversations unsnoozed`,
        elementsCount
    );
};

export const getSnoozeTimeFromElement = (element?: Element) => {
    if (!element) {
        return undefined;
    }

    if (isMessage(element)) {
        return (element as Message).SnoozeTime;
    }

    const contextSnoozeTime = (element as Conversation).Labels?.find(({ ID }) => {
        return ID === MAILBOX_LABEL_IDS.INBOX || ID === MAILBOX_LABEL_IDS.SNOOZED;
    })?.ContextSnoozeTime;
    return contextSnoozeTime;
};

export const getSnoozeDate = (element: Element | undefined, labelID: string) => {
    const time = getSnoozeTimeFromElement(element);
    if (time) {
        return new Date(time * 1000);
    }

    // If the item don't have a snooze time we get the time of the element
    return getDate(element, labelID);
};

export const isConversationElementSnoozed = (element: Element | undefined, conversationMode: boolean) => {
    if (!conversationMode) {
        return false;
    }

    return (element as Conversation)?.Labels?.some(({ ID }) => ID === MAILBOX_LABEL_IDS.SNOOZED);
};

export const isMessageElementSnoozed = (element: Element | undefined, conversationMode: boolean) => {
    if (conversationMode) {
        return false;
    }

    const message = element as Message;
    return message.SnoozeTime && message?.LabelIDs.includes(MAILBOX_LABEL_IDS.SNOOZED);
};

export const isElementSnoozed = (element: Element | undefined, conversationMode: boolean) => {
    return (
        isConversationElementSnoozed(element, conversationMode) || isMessageElementSnoozed(element, conversationMode)
    );
};

export const isElementReminded = (element: Element | undefined) => {
    const isElementOrConversation = isMessage(element) || isConversation(element);
    return element && isElementOrConversation
        ? (element as Message | Conversation).DisplaySnoozedReminder ?? false
        : false;
};
