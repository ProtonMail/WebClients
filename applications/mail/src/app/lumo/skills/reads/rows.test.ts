import type { AgentEmailRow } from './rows';
import { formatAgentEmailRows } from './rows';

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
        expect(out).toContain('2 emails shown:');
        expect(out).toContain('email-a1b2c3 | Alice | Hi | 2026-07-01 | read | Inbox');
        expect(out).toContain('email-d4e5f6');
    });

    it('notes how many more are not shown when the page is capped', () => {
        expect(formatAgentEmailRows([row()], 5)).toContain('1 of 5 emails shown (4 more not shown):');
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
});
