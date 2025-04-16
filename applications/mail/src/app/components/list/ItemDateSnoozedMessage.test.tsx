import { render, screen } from '@testing-library/react';
import { addDays, addYears, getUnixTime } from 'date-fns';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { formatFullDate, formatScheduledTimeString } from '../../helpers/date';
import type { Conversation } from '../../models/conversation';
import ItemDateSnoozedMessage from './ItemDateSnoozedMessage';

const snoozedMessage = {
    ID: '1',
    ConversationID: '1',
    SnoozeTime: 1672531200,
} as Message;

const remindedConversation = {
    ID: '1',
    DisplaySnoozedReminder: true,
} as Conversation;

describe('ItemDateSnoozedMessage', () => {
    it('Should display the snooze time when user is in Snooze folder', () => {
        render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozedMessage.SnoozeTime}
                element={snoozedMessage}
                labelID={MAILBOX_LABEL_IDS.SNOOZED}
                useTooltip={false}
            />
        );
        expect(screen.getByTestId('item-date-snoozed'));
    });

    it('Should display today when the snooze time is today', () => {
        const today = new Date();
        const formattedDate = formatScheduledTimeString(today);
        const snoozeTime = getUnixTime(today);
        render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozeTime}
                element={{ ...snoozedMessage, SnoozeTime: snoozeTime }}
                labelID={MAILBOX_LABEL_IDS.SNOOZED}
                useTooltip={false}
            />
        );
        expect(screen.getByText(`${formattedDate}`));
    });

    it('Should display tomorrow when the snooze time is tomorrow', () => {
        const tomorrow = addDays(new Date(), 1);
        const formattedDate = formatScheduledTimeString(tomorrow);
        const snoozeTime = getUnixTime(tomorrow);
        render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozeTime}
                element={{ ...snoozedMessage, SnoozeTime: snoozeTime }}
                labelID={MAILBOX_LABEL_IDS.SNOOZED}
                useTooltip={false}
            />
        );
        expect(screen.getByText(`Tomorrow, ${formattedDate}`));
    });

    it('Should display the full date when the snooze time is not today or tomorrow', () => {
        const date = addYears(new Date(), 1);
        const formattedDate = formatFullDate(date);
        const snoozeTime = getUnixTime(date);
        render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozeTime}
                element={{ ...snoozedMessage, SnoozeTime: snoozeTime }}
                labelID={MAILBOX_LABEL_IDS.SNOOZED}
                useTooltip={false}
            />
        );
        expect(screen.getByText(formattedDate));
    });

    it('Should not display the snooze time when user is in Inbox folder', () => {
        render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozedMessage.SnoozeTime}
                element={snoozedMessage}
                labelID={MAILBOX_LABEL_IDS.INBOX}
                useTooltip={false}
            />
        );
        expect(screen.queryByTestId('item-date-snooze')).toBeNull();
    });

    it('Should display reminded when message is a reminded conversation and user is in Inbox folder', () => {
        render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozedMessage.SnoozeTime}
                element={remindedConversation}
                labelID={MAILBOX_LABEL_IDS.INBOX}
                useTooltip={false}
            />
        );
        expect(screen.getByTestId('item-date-reminded'));
    });

    it('Should not display reminded when message is a not a reminded conversation and user is in Inbox folder', () => {
        render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozedMessage.SnoozeTime}
                element={{ ...remindedConversation, DisplaySnoozedReminder: false }}
                labelID={MAILBOX_LABEL_IDS.INBOX}
                useTooltip={false}
            />
        );
        expect(screen.queryByTestId('item-date-reminded')).toBeNull();
    });
});
