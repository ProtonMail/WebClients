import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { SOURCE_ACTION } from '../../../components/list/list-telemetry/useListTelemetry';
import type { MailToolDeps } from '../../toolModule';
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
    it('allows the Inbox in conversation view', () => {
        expect(() => assertSnoozeAvailable(MAILBOX_LABEL_IDS.INBOX, true)).not.toThrow();
    });

    it('refuses anywhere but the Inbox, where snoozed mail would never resurface', () => {
        expect(() => assertSnoozeAvailable(MAILBOX_LABEL_IDS.ARCHIVE, true)).toThrow(/Inbox/);
    });

    it('refuses message view, where the ids are messages and the endpoint takes conversations', () => {
        expect(() => assertSnoozeAvailable(MAILBOX_LABEL_IDS.INBOX, false)).toThrow(/conversation view/);
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
});

describe('createSnoozeEmailsHandler', () => {
    const fixture = (snooze: jest.Mock, conversationMode = true) => {
        const references = createReferenceRegistry();
        const reference = references.referenceFor('email', 'ELEMENT_ID_1', { title: 'Booking' });
        const element = { ID: 'ELEMENT_ID_1' };
        const store = {
            getState: () => ({
                elements: {
                    elements: { ELEMENT_ID_1: element },
                    params: { labelID: MAILBOX_LABEL_IDS.INBOX, conversationMode },
                },
            }),
        };

        return { references, reference, element, mail: { store, snooze } as unknown as MailToolDeps };
    };

    it('snoozes the resolved elements with a custom duration at the wake time', async () => {
        const snooze = jest.fn().mockResolvedValue(undefined);
        const { references, reference, element, mail } = fixture(snooze);

        await createSnoozeEmailsHandler(mail)({ ids: [reference], wake_at: '2099-07-11T09:00:00Z' }, { references });

        expect(snooze).toHaveBeenCalledWith(
            { elements: [element], duration: 'custom', snoozeTime: new Date('2099-07-11T09:00:00Z') },
            SOURCE_ACTION.TOOLBAR
        );
    });

    it('refuses when the mailbox is in message view, before the snooze runs', async () => {
        const snooze = jest.fn();
        const { references, reference, mail } = fixture(snooze, false);

        await expect(
            createSnoozeEmailsHandler(mail)({ ids: [reference], wake_at: '2099-07-11T09:00:00Z' }, { references })
        ).rejects.toThrow(/conversation view/);
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
