import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces/Member';

import type { UsageMemberRow } from '../../remote/usage';
import type { UsageRow } from './apiUsage';
import {
    getApiMemberUsage,
    getApiModelUsage,
    getApiUsageDays,
    getMemberCostLabel,
    filterMembersByName,
    getPeriodDates,
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
            getUsageRows([
                { Date: '2026-11-01', Usage: [] },
                { Date: '2026-11-02', Usage: [lite, max] },
            ])
        ).toEqual([
            { ...lite, Date: '2026-11-02' },
            { ...max, Date: '2026-11-02' },
        ]);
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

    it('adds nothing for a model without a known price', () => {
        expect(sumUsage([row({ CostMicros: null }), row({ CostMicros: 250_000 })]).cost).toBe(0.25);
    });
});

describe('getApiUsageDays', () => {
    it('gives one entry per date, with zeros for days without usage', () => {
        expect(getApiUsageDays([row({ Date: '2026-11-02', InputTokens: 3 })], ['2026-11-01', '2026-11-02'])).toEqual([
            { date: '2026-11-01', inputTokens: 0, outputTokens: 0, cost: 0 },
            { date: '2026-11-02', inputTokens: 3, outputTokens: 0, cost: 0 },
        ]);
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
        expect(getMemberCostLabel(member.cost, 'USD')).toBe('Not priced yet');
        expect(getMemberCostLabel(2.5, 'USD')).toContain('2.50');
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
