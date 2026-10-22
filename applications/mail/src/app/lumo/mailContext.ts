import { format } from 'date-fns';

import { selectCategories } from '@proton/mail/store/labels';
import type { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { enUSLocale } from '@proton/shared/lib/i18n/dateFnLocales';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { recipientToInput } from '@proton/shared/lib/mail/recipient';

import { isSearch } from '../helpers/elementSearch';
import { isElementConversation, isElementMessage } from '../helpers/elementTypeGuards';
import { getStandardFolders } from '../helpers/labels';
import { selectParams } from '../store/elements/elementsSelectors';
import { messageByID } from '../store/messages/messagesSelectors';
import type { MailState } from '../store/store';
import { formatLocalDateTime } from './helpers/formatting';

const NO_SUBJECT = '(no subject)';

// Subjects, sender names and folder or label names can come from incoming mail, imports or filters,
// so keep them on one line and free of tags that could close the block early.
const neutralise = (text: string) => text.replace(/[\r\n]+/g, ' ').replace(/[<>]/g, '');

const quote = (subject?: string) => `"${neutralise(subject || NO_SUBJECT)}"`;

const describeList = (state: MailState): string => {
    const { labelID, search } = selectParams(state);
    if (isSearch(search)) {
        return 'search results';
    }

    return neutralise(
        getStandardFolders()[labelID]?.name ||
            selectCategories(state).value?.find(({ ID }) => ID === labelID)?.Name ||
            LABEL_IDS_TO_HUMAN[labelID as MAILBOX_LABEL_IDS] ||
            'unknown'
    );
};

const describeReadingPane = (state: MailState): string => {
    const { elementID, conversationMode } = selectParams(state);
    if (!elementID) {
        return 'nothing';
    }

    const element = state.elements.elements[elementID];
    if (conversationMode) {
        const conversation =
            state.conversations[elementID]?.Conversation ?? (isElementConversation(element) ? element : undefined);
        const count = conversation?.NumMessages ?? 1;
        return `conversation ${quote(conversation?.Subject)}, ${count} ${count === 1 ? 'message' : 'messages'}`;
    }

    const message = state.messages[elementID]?.data ?? (isElementMessage(element) ? element : undefined);
    const sender = message?.Sender
        ? ` from ${recipientToInput({ ...message.Sender, Name: neutralise(message.Sender.Name || message.Sender.Address) })}`
        : '';
    return `email ${quote(message?.Subject)}${sender}`;
};

const describeOpenComposers = (state: MailState): string => {
    const subjects = Object.values(state.composers.composers).map((composer) =>
        quote(messageByID(state, { ID: composer.messageID })?.data?.Subject)
    );
    return subjects.length ? subjects.join(', ') : 'none';
};

export const buildMailContext = (state: MailState, now: Date, timezone: string): string =>
    [
        '<mail_context>',
        `Current date and time: ${format(now, 'EEEE', { locale: enUSLocale })}, ${formatLocalDateTime(now)}`,
        `Timezone: ${timezone}`,
        `Open in the list: ${describeList(state)}`,
        `Open in the reading pane: ${describeReadingPane(state)}`,
        `Open composers: ${describeOpenComposers(state)}`,
        '</mail_context>',
    ].join('\n');
