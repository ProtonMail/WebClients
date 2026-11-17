import { createReferenceRegistry } from '@proton/llm/lib/lumoAgent/engine/referenceRegistry';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import type { Element } from '../../../models/element';
import { fakeStore, settledView } from '../../helpers/navigation.test.helpers';
import type { AgentEmailRow } from './rows';
import { buildAgentEmailRows, formatAgentEmailRows } from './rows';

const row = (overrides: Partial<AgentEmailRow> = {}): AgentEmailRow => ({
    reference: 'email-a1b2c3',
    from: 'Alice',
    subject: 'Hi',
    date: '2026-07-01',
    unread: false,
    starred: false,
    folder: 'Inbox',
    labels: [],
    hasAttachment: false,
    ...overrides,
});

describe('formatAgentEmailRows', () => {
    it('returns an empty string for no rows', () => {
        expect(formatAgentEmailRows([], 0)).toBe('');
    });

    it('renders a count header and one pipe-delimited line per row', () => {
        const out = formatAgentEmailRows([row(), row({ reference: 'email-d4e5f6', subject: 'Bye' })], 2);
        expect(out).toContain('2 emails listed:');
        expect(out).toContain('email-a1b2c3 | Alice | Hi | 2026-07-01 | read | Inbox');
        expect(out).toContain('email-d4e5f6');
    });

    it('notes how many more are not listed when the page is capped', () => {
        expect(formatAgentEmailRows([row()], 5)).toContain('1 of 5 emails listed (4 more not listed):');
    });

    it('appends the unread, starred, labels and attachment flags', () => {
        const out = formatAgentEmailRows(
            [row({ unread: true, starred: true, labels: ['Work'], hasAttachment: true })],
            1
        );
        expect(out).toContain('unread');
        expect(out).toContain('starred');
        expect(out).toContain('labels: Work');
        expect(out).toContain('has attachment');
    });

    it('appends the Inbox tab when the row has one, and nothing when it does not', () => {
        expect(formatAgentEmailRows([row({ tab: 'promotions' })], 1)).toContain('| Inbox | tab: promotions');
        expect(formatAgentEmailRows([row()], 1)).not.toContain('tab:');
    });
});

describe('buildAgentEmailRows', () => {
    const shownTabs = (...ids: CategoryLabelID[]): CategoryTab[] =>
        ids.map((id) => ({ id, display: true, colorShade: CATEGORIES_COLOR_SHADES.IRIS }));

    /** A conversation filed in `labelIDs`, each counting its one message, so the list keeps it on the page. */
    const conversationIn = (labelIDs: string[]): Element =>
        ({
            ID: 'ELEMENT_1',
            Subject: 'Spring sale',
            Senders: [{ Name: 'Shop', Address: 'shop@example.com' }],
            Time: 1_780_000_000,
            Labels: labelIDs.map((ID) => ({ ID, ContextNumMessages: 1 })),
            NumMessages: 1,
            NumAttachments: 0,
            NumUnread: 0,
        }) as unknown as Element;

    const tabOf = (labelID: string, labelIDs: string[], tabs: CategoryTab[]) => {
        const { store } = fakeStore(settledView({ labelID, elements: [conversationIn(labelIDs)] }));
        const deps = {
            store,
            getFolders: () => [],
            getLabels: () => [],
            getMailSettings: () => DEFAULT_MAIL_SETTINGS,
            getActiveCategoryTabs: () => tabs,
        };

        const { rows } = buildAgentEmailRows(deps, createReferenceRegistry());

        expect(rows).toHaveLength(1);
        return rows[0].tab;
    };

    const INBOX = MAILBOX_LABEL_IDS.INBOX;
    const PROMOTIONS = MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS;

    it('names the tab of an Inbox email while the category view is on', () => {
        expect(tabOf(INBOX, [INBOX, PROMOTIONS], shownTabs(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, PROMOTIONS))).toBe(
            'promotions'
        );
    });

    it('names no tab with the category view off', () => {
        expect(tabOf(INBOX, [INBOX, PROMOTIONS], [])).toBeUndefined();
    });

    // A tab is a place inside the Inbox: archived mail keeps its category label but sits in no tab.
    it('names no tab for an email outside the Inbox', () => {
        expect(
            tabOf(MAILBOX_LABEL_IDS.ARCHIVE, [MAILBOX_LABEL_IDS.ARCHIVE, PROMOTIONS], shownTabs(PROMOTIONS))
        ).toBeUndefined();
    });

    // The Inbox shows mail from a hidden tab under Primary, so the row must say where the user sees it.
    it('names Primary for an email whose tab the user hid', () => {
        expect(tabOf(INBOX, [INBOX, PROMOTIONS], shownTabs(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT))).toBe('primary');
    });
});
