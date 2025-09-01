import { format, getUnixTime, nextMonday, nextSaturday, set } from 'date-fns';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { Element } from '../models/element';
import { getSnoozeDate, getSnoozeNotificationText, getSnoozeTimeFromElement, getSnoozeUnixTime } from './snooze';

describe('snooze helpers - getSnoozeUnixTime', () => {
    it('Should return tomorrow 9 when snooze duration is tomorrow', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        expect(getSnoozeUnixTime('tomorrow')).toEqual(tomorrow.getTime() / 1000);
    });

    it('Should return two days from now 9 when snooze duration is later', () => {
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
        twoDaysFromNow.setHours(9, 0, 0, 0);
        expect(getSnoozeUnixTime('later')).toEqual(twoDaysFromNow.getTime() / 1000);
    });

    it('Should return next Saturday 9 when snooze duration is weekend', () => {
        const nextSat = nextSaturday(new Date());
        nextSat.setHours(9, 0, 0, 0);
        expect(getSnoozeUnixTime('weekend')).toEqual(nextSat.getTime() / 1000);
    });

    it('Should return next Monday 9 when snooze duration is nextweek', () => {
        const nextMon = nextMonday(new Date());
        nextMon.setHours(9, 0, 0, 0);
        expect(getSnoozeUnixTime('nextweek')).toEqual(nextMon.getTime() / 1000);
    });

    it('Should throw an error when no snooze time for custom duration', () => {
        expect(() => getSnoozeUnixTime('custom')).toThrow('Snooze time is required for custom snooze');
    });

    it('Should return unix time of custom time', () => {
        const futureDate = set(new Date(), {
            year: 2030,
            month: 10,
            date: 10,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
            hours: 9,
        });
        expect(getSnoozeUnixTime('custom', futureDate)).toEqual(futureDate.getTime() / 1000);
    });
});

describe('snooze helpers - getSnoozeNotificationText', () => {
    it('Should return snooze notification text when snooze is true', () => {
        expect(getSnoozeNotificationText(true, 1)).toEqual('1 conversation snoozed');
        expect(getSnoozeNotificationText(true, 2)).toEqual('2 conversations snoozed');
    });

    it('Should return unsnooze notification text when snooze is false', () => {
        expect(getSnoozeNotificationText(false, 1)).toEqual('1 conversation unsnoozed');
        expect(getSnoozeNotificationText(false, 2)).toEqual('2 conversations unsnoozed');
    });
});

describe('snooze helpers - getSnoozeTimeFromElement', () => {
    it('Should return undefined when no element', () => {
        expect(getSnoozeTimeFromElement()).toEqual(undefined);
    });

    it('Should return undefined when element is not a conversation', () => {
        expect(getSnoozeTimeFromElement({} as Element)).toEqual(undefined);
    });

    it('Should return snooze time when element is a conversation and has a snooze label', () => {
        const snoozeTime = new Date().getTime();

        expect(
            getSnoozeTimeFromElement({
                Labels: [{ ID: MAILBOX_LABEL_IDS.SNOOZED, ContextSnoozeTime: snoozeTime }],
            } as Element)
        ).toEqual(snoozeTime);
    });

    it('Should return snooze time when element is a conversation and has a inbox label', () => {
        const snoozeTime = new Date().getTime();

        expect(
            getSnoozeTimeFromElement({
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextSnoozeTime: snoozeTime }],
            } as Element)
        ).toEqual(snoozeTime);
    });

    it('Should return undefined when element is a conversation and has no snooze label', () => {
        expect(
            getSnoozeTimeFromElement({
                Labels: [{ ID: MAILBOX_LABEL_IDS.DRAFTS }],
            } as Element)
        ).toEqual(undefined);
    });

    it('Should return snooze time when element is a conversation, and in custom folder with date', () => {
        const snoozeTime = new Date().getTime();
        const labelID = 'customFolderLabelID';

        expect(
            getSnoozeTimeFromElement(
                {
                    Labels: [{ ID: labelID, ContextSnoozeTime: snoozeTime }],
                } as Element,
                labelID
            )
        ).toEqual(snoozeTime);
    });

    it('Should return undefined when element is a conversation, and in custom folder without date', () => {
        const labelID = 'customFolderLabelID';

        expect(
            getSnoozeTimeFromElement(
                {
                    Labels: [{ ID: labelID }],
                } as Element,
                labelID
            )
        ).toEqual(undefined);
    });

    it('Should return snooze time when element is a message', () => {
        const snoozeTime = new Date().getTime();

        expect(
            getSnoozeTimeFromElement({
                ConversationID: 'conversationID',
                SnoozeTime: snoozeTime,
            } as Element)
        ).toEqual(snoozeTime);
    });

    it('Should return undefined when element is a message and has no snooze time', () => {
        expect(
            getSnoozeTimeFromElement({
                ConversationID: 'conversationID',
            } as Element)
        ).toEqual(undefined);
    });
});

describe('snooze helpers - getSnoozeDate', () => {
    const isSameTime = (date1: Date, date2: Date) => {
        const formatter = 'yyyy-MM-dd HH:mm:ss';
        return format(date1, formatter) === format(date2, formatter);
    };

    it('Should return current date when no element', () => {
        expect(isSameTime(getSnoozeDate(undefined, '1'), new Date()));
    });

    it('Should return current date when element is not a conversation', () => {
        expect(isSameTime(getSnoozeDate({} as Element, '1'), new Date()));
    });

    it('Should return snooze date when element is a conversation and has a snooze label', () => {
        const now = new Date();
        const date = getSnoozeDate(
            {
                Labels: [{ ID: MAILBOX_LABEL_IDS.SNOOZED, ContextSnoozeTime: getUnixTime(now) }],
            } as Element,
            '1'
        );

        expect(isSameTime(date, now));
    });
});
