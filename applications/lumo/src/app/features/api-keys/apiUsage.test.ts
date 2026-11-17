import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces/Member';

import type { UsageMemberRow } from '../../remote/usage';
import type { UsageRow } from './apiUsage';
import {
    getApiMemberUsage,
    getApiModelUsage,
    getAverageDailySpend,
    getUsageDays,
    getCostLabel,
    filterMembersByName,
    filterRowsBySource,
    getPeriodDates,
    getSourceUsageDays,
    getUsageRows,
    sumUsage,
} from './apiUsage';

const row = (overrides: Partial<UsageRow>): UsageRow => ({
    Date: '2026-11-01',
    Model: 'lumo-lite',
    ClientType: 'api',
    InputTokens: 0,
    OutputTokens: 0,
    Calls: 0,
    CostMicros: 0,
    ...overrides,
});

describe('getUsageRows', () => {
    it('dates every entry with its day and skips days without usage', () => {
        const { Date: _, ...lite } = row({ InputTokens: 4 });
        const { Date: __, ...max } = row({ Model: 'lumo-max', InputTokens: 9 });

        expect(
            getUsageRows(
                [
                    { Date: '2026-11-01', Usage: [] },
                    { Date: '2026-11-02', Usage: [lite, max] },
                ],
                [{ ClientType: 'api', Billed: true }]
            )
        ).toEqual([
            { ...lite, Date: '2026-11-02' },
            { ...max, Date: '2026-11-02' },
        ]);
    });

    it('costs nothing for usage the plan does not bill', () => {
        const { Date: _, ...chat } = row({ ClientType: 'frontend', CostMicros: 400_000 });
        const { Date: __, ...unlisted } = row({ ClientType: 'scribe', CostMicros: null });

        const rows = getUsageRows(
            [{ Date: '2026-11-02', Usage: [chat, unlisted] }],
            [{ ClientType: 'frontend', Billed: false }]
        );

        expect(rows.map(({ CostMicros }) => CostMicros)).toEqual([0, 0]);
    });

    it('keeps the cost of billed chat usage', () => {
        const { Date: _, ...chat } = row({ ClientType: 'lumo_mail', CostMicros: 400_000 });

        const [chatRow] = getUsageRows(
            [{ Date: '2026-11-02', Usage: [chat] }],
            [{ ClientType: 'lumo_mail', Billed: true }]
        );

        expect(chatRow.CostMicros).toBe(400_000);
    });
});

describe('filterRowsBySource', () => {
    const rows = ['api', 'frontend', 'lumo_desktop', 'lumo_mail', 'scribe'].map((ClientType) => row({ ClientType }));

    it.each([
        ['all', ['api', 'frontend', 'lumo_desktop', 'lumo_mail', 'scribe']],
        ['api', ['api']],
        ['chat', ['frontend', 'lumo_desktop', 'lumo_mail', 'scribe']],
    ] as const)('%s keeps %j', (source, clientTypes) => {
        expect(filterRowsBySource(rows, source).map(({ ClientType }) => ClientType)).toEqual(clientTypes);
    });
});

describe('sumUsage', () => {
    it('adds the tokens and converts the cost to credits', () => {
        expect(
            sumUsage([
                row({ InputTokens: 15, OutputTokens: 20, CostMicros: 1_500_000 }),
                row({ InputTokens: 1, OutputTokens: 2, CostMicros: 500_000 }),
            ])
        ).toEqual({ inputTokens: 16, outputTokens: 22, cost: 2 });
    });

    it('has no cost when a model has no known price', () => {
        expect(sumUsage([row({ CostMicros: null }), row({ CostMicros: 250_000 })]).cost).toBeNull();
    });
});

describe('getUsageDays', () => {
    it('gives one entry per date, with zeros for days without usage', () => {
        expect(getUsageDays([row({ Date: '2026-11-02', InputTokens: 3 })], ['2026-11-01', '2026-11-02'])).toEqual([
            { date: '2026-11-01', inputTokens: 0, outputTokens: 0, cost: 0 },
            { date: '2026-11-02', inputTokens: 3, outputTokens: 0, cost: 0 },
        ]);
    });
});

describe('getAverageDailySpend', () => {
    it('averages the priced spend over the days, an unpriced row adding nothing', () => {
        expect(
            getAverageDailySpend(
                [row({ CostMicros: 5_000_000 }), row({ CostMicros: null }), row({ CostMicros: 1_000_000 })],
                3
            )
        ).toBe(2);
    });

    it('is zero without days', () => {
        expect(getAverageDailySpend([], 0)).toBe(0);
    });
});

describe('getSourceUsageDays', () => {
    it('splits each day between API and chat tokens', () => {
        const [quietDay, busyDay] = getSourceUsageDays(
            [
                row({ Date: '2026-11-02', InputTokens: 3, OutputTokens: 1, CostMicros: 1_000_000 }),
                row({ Date: '2026-11-02', ClientType: 'frontend', InputTokens: 5, OutputTokens: 2 }),
            ],
            ['2026-11-01', '2026-11-02']
        );

        expect(quietDay).toEqual({
            date: '2026-11-01',
            apiInputTokens: 0,
            apiOutputTokens: 0,
            chatInputTokens: 0,
            chatOutputTokens: 0,
            cost: 0,
        });
        expect(busyDay).toEqual({
            date: '2026-11-02',
            apiInputTokens: 3,
            apiOutputTokens: 1,
            chatInputTokens: 5,
            chatOutputTokens: 2,
            cost: 1,
        });
    });
});

describe('getApiModelUsage', () => {
    it('only counts the rows of that model', () => {
        expect(
            getApiModelUsage(
                [row({ Model: 'lumo-lite', InputTokens: 1 }), row({ Model: 'lumo-max', InputTokens: 7 })],
                'lumo-max'
            )
        ).toEqual({ model: 'lumo-max', inputTokens: 7, outputTokens: 0, cost: 0 });
    });
});

describe('getPeriodDates', () => {
    const dates = Array.from({ length: 90 }, (_, index) => `day-${index}`);

    it.each([
        ['last-7-days', 'day-83', 'day-89', 7],
        ['last-30-days', 'day-60', 'day-89', 30],
        ['previous-30-days', 'day-30', 'day-59', 30],
        ['last-90-days', 'day-0', 'day-89', 90],
    ] as const)('%s runs from %s to %s', (period, first, last, length) => {
        const periodDates = getPeriodDates(dates, period);

        expect(periodDates).toHaveLength(length);
        expect(periodDates[0]).toBe(first);
        expect(periodDates.at(-1)).toBe(last);
    });
});

describe('getApiMemberUsage', () => {
    const totals = (overrides: Partial<UsageMemberRow['Totals']>): UsageMemberRow['Totals'] => ({
        TokensIn: 0,
        TokensInCached: 0,
        TokensGenerated: 0,
        ApiCalls: 0,
        CostMicros: 0,
        ...overrides,
    });
    const members = [
        { ID: 'member-alice', Name: 'Alice', Role: MEMBER_ROLE.ORGANIZATION_ADMIN },
        { ID: 'member-bob', Name: 'Bob', Role: MEMBER_ROLE.ORGANIZATION_MEMBER },
        { ID: 'member-nameless', Name: '', Role: MEMBER_ROLE.ORGANIZATION_MEMBER },
    ] as Member[];

    it('joins each usage row to its member, with cached and output tokens in the total', () => {
        const [alice] = getApiMemberUsage(
            [
                {
                    MemberID: 'member-alice',
                    Totals: totals({ TokensIn: 10, TokensInCached: 5, TokensGenerated: 2, CostMicros: 1_500_000 }),
                },
            ],
            members
        );

        expect(alice).toEqual({
            id: 'member-alice',
            name: 'Alice',
            role: 'Admin',
            isCurrentMember: true,
            totalTokens: 17,
            cost: 1.5,
        });
    });

    it('names former, unknown and nameless members', () => {
        const [bob, former, unknown, nameless] = getApiMemberUsage(
            [
                { MemberID: 'member-bob', Totals: totals({}) },
                { MemberID: null, Totals: totals({}) },
                { MemberID: 'member-gone', Totals: totals({}) },
                { MemberID: 'member-nameless', Totals: totals({}) },
            ],
            members
        );

        expect([bob.name, bob.role]).toEqual(['Bob', 'Member']);
        expect([former.name, former.role]).toEqual(['Former members', 'No longer in the organization']);
        expect([unknown.name, unknown.role]).toEqual(['Unknown member', '']);
        expect(nameless.name).toBe('Unknown member');
        expect([bob.isCurrentMember, former.isCurrentMember, unknown.isCurrentMember]).toEqual([true, false, false]);
    });

    it('keeps an unpriced total as unpriced, not zero', () => {
        const [member] = getApiMemberUsage([{ MemberID: 'member-bob', Totals: totals({ CostMicros: null }) }], members);

        expect(member.cost).toBeNull();
        expect(getCostLabel(member.cost, 'USD')).toBe('Not priced yet');
        expect(getCostLabel(2.5, 'USD')).toContain('2.50');
    });

    it('filters members by name, ignoring case', () => {
        const usage = getApiMemberUsage(
            [
                { MemberID: 'member-alice', Totals: totals({}) },
                { MemberID: 'member-bob', Totals: totals({}) },
            ],
            members
        );

        expect(filterMembersByName(usage, 'BO').map(({ name }) => name)).toEqual(['Bob']);
    });
});
