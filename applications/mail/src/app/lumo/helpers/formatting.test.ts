import type { Recipient } from '@proton/shared/lib/interfaces';

import { formatLocalDate, formatSender, formatUnixDate } from './formatting';

describe('formatLocalDate', () => {
    it('renders the LOCAL calendar day, so the agent never reports the day either side of midnight', () => {
        expect(formatLocalDate(new Date(2026, 6, 29, 23, 30))).toBe('2026-07-29');
    });

    it('zero-pads month and day', () => {
        expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('renders the epoch (no date) as empty', () => {
        expect(formatLocalDate(new Date(0))).toBe('');
    });
});

describe('formatUnixDate', () => {
    it('converts API seconds to the same calendar day', () => {
        const time = Math.floor(new Date(2026, 6, 29, 9, 15).getTime() / 1000);
        expect(formatUnixDate(time)).toBe('2026-07-29');
    });

    it('renders a missing time as empty', () => {
        expect(formatUnixDate(undefined)).toBe('');
        expect(formatUnixDate(0)).toBe('');
    });
});

describe('formatSender', () => {
    it('prefers the display name', () => {
        expect(formatSender([{ Name: 'Alice', Address: 'alice@example.com' } as Recipient])).toBe('Alice');
    });

    it('falls back to the address when there is no name', () => {
        expect(formatSender([{ Name: '', Address: 'alice@example.com' } as Recipient])).toBe('alice@example.com');
    });

    it('joins several senders, as a grouped conversation row shows them', () => {
        expect(
            formatSender([{ Name: 'Alice' } as Recipient, { Name: '', Address: 'bob@example.com' } as Recipient])
        ).toBe('Alice, bob@example.com');
    });

    it('names an unknown sender rather than returning empty', () => {
        expect(formatSender([undefined])).toBe('(unknown sender)');
        expect(formatSender([])).toBe('(unknown sender)');
    });
});
