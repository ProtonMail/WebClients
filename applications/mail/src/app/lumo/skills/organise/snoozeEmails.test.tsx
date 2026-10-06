import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import sentenceText from '@proton/llm/lib/lumoAgent/ui/sentenceText';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { SOURCE_ACTION } from '../../../components/list/list-telemetry/useListTelemetry';
import type { Element } from '../../../models/element';
import type { MailToolDeps } from '../../toolModule';
import { conversationIn, offListState } from './organise.test.helpers';
import {
    assertSnoozeAvailable,
    createSnoozeEmailsHandler,
    resolveWakeAt,
    snoozeEmailsCardRenderer,
} from './snoozeEmails';

const NOW = Date.parse('2026-07-09T12:00:00Z');

describe('resolveWakeAt', () => {
    it('accepts a future datetime', () => {
        expect(resolveWakeAt('2026-07-11T09:00:00Z', NOW)).toEqual(new Date('2026-07-11T09:00:00Z'));
    });

    it('rejects a time in the past', () => {
        expect(() => resolveWakeAt('2026-07-08T09:00:00Z', NOW)).toThrow(/in the past/);
    });

    it('rejects anything that is not ISO 8601, including forms `Date.parse` would accept', () => {
        expect(() => resolveWakeAt('saturday morning', NOW)).toThrow(/ISO 8601/);
        expect(() => resolveWakeAt('July 11 2099', NOW)).toThrow(/ISO 8601/);
    });
});

describe('assertSnoozeAvailable', () => {
    it('allows conversations in the Inbox', () => {
        expect(() => assertSnoozeAvailable([conversationIn(MAILBOX_LABEL_IDS.INBOX)])).not.toThrow();
    });

    it('refuses a conversation outside the Inbox, where snoozed mail would never resurface', () => {
        const selection = [conversationIn(MAILBOX_LABEL_IDS.INBOX), conversationIn(MAILBOX_LABEL_IDS.ARCHIVE)];

        expect(() => assertSnoozeAvailable(selection)).toThrow(/Inbox/);
    });

    it('refuses a message, whose id the conversations endpoint cannot take', () => {
        const message = { ID: 'MESSAGE_1', ConversationID: 'ELEMENT_ID_1', LabelIDs: [MAILBOX_LABEL_IDS.INBOX] };

        expect(() => assertSnoozeAvailable([message as Element])).toThrow(/conversation view/);
    });
});

describe('snoozeEmailsCardRenderer', () => {
    it('disables Confirm for an empty selection or a wake time the handler would reject', () => {
        const futureWakeAt = new Date(Date.now() + 60_000).toISOString();

        expect(snoozeEmailsCardRenderer.canApply?.({ ids: ['email-a1b2c3'], wake_at: futureWakeAt })).toBe(true);
        expect(snoozeEmailsCardRenderer.canApply?.({ ids: [], wake_at: futureWakeAt })).toBe(false);
        expect(snoozeEmailsCardRenderer.canApply?.({ ids: ['email-a1b2c3'], wake_at: '2020-01-01T09:00:00Z' })).toBe(
            false
        );
    });

    // The picker in the body is editable, so an emptied or mistyped date reaches the sentence; it must
    // not read "Snooze 1 email until " with the time missing.
    it('drops the wake-time clause when the picker holds no usable date', () => {
        const action: ActionRequest = { type: 'snooze_emails', ids: ['email-a1b2c3'], wake_at: '' };

        expect(sentenceText(snoozeEmailsCardRenderer.sentence(action, {})).trimEnd()).toBe('Snooze 1 email');
    });
});

describe('createSnoozeEmailsHandler', () => {
    const fixture = (snooze: jest.Mock, element: Element = conversationIn(MAILBOX_LABEL_IDS.INBOX)) => {
        const references = createReferenceRegistry();
        const reference = references.referenceFor('email', 'ELEMENT_ID_1', { title: 'Booking' });
        // Viewing Archive: the snooze is decided by where the email sits, not by where the user is.
        const store = { getState: () => offListState([element], MAILBOX_LABEL_IDS.ARCHIVE) };

        return { references, reference, element, mail: { store, snooze } as unknown as MailToolDeps };
    };

    it('snoozes an Inbox conversation from any view, with a custom duration at the wake time', async () => {
        const snooze = jest.fn().mockResolvedValue(undefined);
        const { references, reference, element, mail } = fixture(snooze);

        await createSnoozeEmailsHandler(mail)({ ids: [reference], wake_at: '2099-07-11T09:00:00Z' }, { references });

        expect(snooze).toHaveBeenCalledWith(
            { elements: [element], duration: 'custom', snoozeTime: new Date('2099-07-11T09:00:00Z') },
            SOURCE_ACTION.TOOLBAR
        );
    });

    it('refuses a conversation outside the Inbox, before the snooze runs', async () => {
        const snooze = jest.fn();
        const { references, reference, mail } = fixture(snooze, conversationIn(MAILBOX_LABEL_IDS.ARCHIVE));

        await expect(
            createSnoozeEmailsHandler(mail)({ ids: [reference], wake_at: '2099-07-11T09:00:00Z' }, { references })
        ).rejects.toThrow(/Inbox/);
        expect(snooze).not.toHaveBeenCalled();
    });

    it('validates the wake time itself, so the card is not the only guard', async () => {
        const snooze = jest.fn();
        const { references, reference, mail } = fixture(snooze);

        await expect(
            createSnoozeEmailsHandler(mail)({ ids: [reference], wake_at: '2020-01-01T09:00:00Z' }, { references })
        ).rejects.toThrow();
        expect(snooze).not.toHaveBeenCalled();
    });
});
