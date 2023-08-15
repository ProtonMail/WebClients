import { addDays, getUnixTime, nextMonday, nextSaturday, set } from 'date-fns';
import { c, msgid } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { isConversation, isMessage } from 'proton-mail/helpers/elements';
import { Conversation } from 'proton-mail/models/conversation';
import { Element } from 'proton-mail/models/element';

import { SNOOZE_DURATION } from '../hooks/actions/useSnooze';

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

    const snoozeLabel = (element as Conversation).Labels?.find(({ ID }) => ID === MAILBOX_LABEL_IDS.SNOOZED);
    return snoozeLabel?.ContextSnoozeTime;
};

export const getSnoozeDate = (element: Element | undefined) => {
    const time = getSnoozeTimeFromElement(element);
    if (time) {
        return new Date(time * 1000);
    }
    return new Date();
};

export const isElementReminded = (element: Element | undefined) => {
    if (isMessage(element)) {
        return (element as Message)?.DisplaySnoozedReminder;
    } else if (isConversation(element)) {
        return (element as Conversation).DisplaySnoozedReminder;
    }

    return false;
};
