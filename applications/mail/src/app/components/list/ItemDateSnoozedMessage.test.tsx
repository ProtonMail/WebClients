import { render } from '@testing-library/react';
import { addDays, addYears, getUnixTime } from 'date-fns';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { formatFullDate, formatScheduledTimeString } from 'proton-mail/helpers/date';
import { Conversation } from 'proton-mail/models/conversation';

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
        const { getByTestId } = render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozedMessage.SnoozeTime}
                element={snoozedMessage}
                labelID={MAILBOX_LABEL_IDS.SNOOZED}
                useTooltip={false}
            />
        );
        expect(getByTestId('item-date-snoozed'));
    });

    it('Should display today when the snooze time is today', () => {
        const today = new Date();
        const formattedDate = formatScheduledTimeString(today);
        const snoozeTime = getUnixTime(today);
        const { getByText } = render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozeTime}
                element={{ ...snoozedMessage, SnoozeTime: snoozeTime }}
                labelID={MAILBOX_LABEL_IDS.SNOOZED}
                useTooltip={false}
            />
        );
        expect(getByText(`Snoozed until today, ${formattedDate}`));
    });

    it('Should display tomorrow when the snooze time is tomorrow', () => {
        const tomorrow = addDays(new Date(), 1);
        const formattedDate = formatScheduledTimeString(tomorrow);
        const snoozeTime = getUnixTime(tomorrow);
        const { getByText } = render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozeTime}
                element={{ ...snoozedMessage, SnoozeTime: snoozeTime }}
                labelID={MAILBOX_LABEL_IDS.SNOOZED}
                useTooltip={false}
            />
        );
        expect(getByText(`Snoozed until tomorrow, ${formattedDate}`));
    });

    it('Should display the full date when the snooze time is not today or tomorrow', () => {
        const date = addYears(new Date(), 1);
        const formattedDate = formatFullDate(date);
        const snoozeTime = getUnixTime(date);
        const { getByText } = render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozeTime}
                element={{ ...snoozedMessage, SnoozeTime: snoozeTime }}
                labelID={MAILBOX_LABEL_IDS.SNOOZED}
                useTooltip={false}
            />
        );
        expect(getByText(formattedDate));
    });

    it('Should not display the snooze time when user is in Inbox folder', () => {
        const { queryByTestId } = render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozedMessage.SnoozeTime}
                element={snoozedMessage}
                labelID={MAILBOX_LABEL_IDS.INBOX}
                useTooltip={false}
            />
        );
        expect(queryByTestId('item-date-snooze')).toBeNull();
    });

    it('Should display reminded when message is a reminded conversation and user is in Inbox folder', () => {
        const { getByText } = render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozedMessage.SnoozeTime}
                element={remindedConversation}
                labelID={MAILBOX_LABEL_IDS.INBOX}
                useTooltip={false}
            />
        );
        expect(getByText('Reminded'));
    });

    it('Should not display reminded when message is a not a reminded conversation and user is in Inbox folder', () => {
        const { queryByText } = render(
            <ItemDateSnoozedMessage
                snoozeTime={snoozedMessage.SnoozeTime}
                element={{ ...remindedConversation, DisplaySnoozedReminder: false }}
                labelID={MAILBOX_LABEL_IDS.INBOX}
                useTooltip={false}
            />
        );
        expect(queryByText('Reminded')).toBeNull();
    });
});
