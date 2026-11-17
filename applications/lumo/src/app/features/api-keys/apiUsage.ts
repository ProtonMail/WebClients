import { c } from 'ttag';

import type { Currency } from '@proton/payments/core/interface';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces/Member';

import type { BilledClientType, UsageDay, UsageEntry, UsageMemberRow } from '../../remote/usage';
import type { ApiTokenPricingModelId } from '../api-docs/apiTokenPricingUsd';
import { formatApiCurrency } from './apiKeysHelpers';

export type UsageRow = UsageEntry & { Date: string };

type ApiUsageTotals = {
    inputTokens: number;
    outputTokens: number;
    cost: number | null;
};

export type UsageSource = 'api' | 'chat';

const getUsageSource = (clientType: string): UsageSource => (clientType === 'api' ? 'api' : 'chat');

export const filterRowsBySource = (rows: UsageRow[], source: 'all' | UsageSource) =>
    source === 'all' ? rows : rows.filter((row) => getUsageSource(row.ClientType) === source);

export type ApiUsageDay = ApiUsageTotals & { date: string };

export type UsagePeriod = 'last-7-days' | 'last-30-days' | 'previous-30-days' | 'last-90-days';

const PERIOD_DATE_SLICES: Record<UsagePeriod, [number, number?]> = {
    'last-7-days': [-7],
    'last-30-days': [-30],
    'previous-30-days': [-60, -30],
    'last-90-days': [-90],
};

export const getPeriodDates = (dates: string[], period: UsagePeriod) => dates.slice(...PERIOD_DATE_SLICES[period]);

export const getUsageRows = (days: UsageDay[], clientTypes: BilledClientType[]): UsageRow[] => {
    const billedClientTypes = clientTypes.filter(({ Billed }) => Billed).map(({ ClientType }) => ClientType);
    return days.flatMap((day) =>
        day.Usage.map((entry) => ({
            ...entry,
            Date: day.Date,
            CostMicros: billedClientTypes.includes(entry.ClientType) ? entry.CostMicros : 0,
        }))
    );
};

const CREDIT_MICROS = 1_000_000;

const sumCostMicros = (rows: UsageRow[]) =>
    rows.reduce<number | null>(
        (sum, row) => (sum === null || row.CostMicros === null ? null : sum + row.CostMicros),
        0
    );

export const sumUsage = (rows: UsageRow[]): ApiUsageTotals => {
    const costMicros = sumCostMicros(rows);
    return {
        inputTokens: rows.reduce((sum, row) => sum + row.InputTokens, 0),
        outputTokens: rows.reduce((sum, row) => sum + row.OutputTokens, 0),
        cost: costMicros === null ? null : costMicros / CREDIT_MICROS,
    };
};

export const getAverageDailySpend = (rows: UsageRow[], dayCount: number) =>
    dayCount === 0 ? 0 : rows.reduce((sum, row) => sum + (row.CostMicros ?? 0), 0) / CREDIT_MICROS / dayCount;

export const getUsageDays = (rows: UsageRow[], dates: string[]): ApiUsageDay[] =>
    dates.map((date) => ({ date, ...sumUsage(rows.filter((row) => row.Date === date)) }));

export const getSourceUsageDays = (rows: UsageRow[], dates: string[]) =>
    dates.map((date) => {
        const dayRows = rows.filter((row) => row.Date === date);
        const api = sumUsage(filterRowsBySource(dayRows, 'api'));
        const chat = sumUsage(filterRowsBySource(dayRows, 'chat'));
        return {
            date,
            apiInputTokens: api.inputTokens,
            apiOutputTokens: api.outputTokens,
            chatInputTokens: chat.inputTokens,
            chatOutputTokens: chat.outputTokens,
            cost: sumUsage(dayRows).cost,
        };
    });

export const getApiModelUsage = (rows: UsageRow[], model: ApiTokenPricingModelId) => ({
    model,
    ...sumUsage(rows.filter((row) => row.Model === model)),
});

export type ApiMemberUsage = {
    id: string;
    name: string;
    role: string;
    isCurrentMember: boolean;
    totalTokens: number;
    cost: number | null;
};

const getMemberName = (memberId: string | null, member: Member | undefined) => {
    if (memberId === null) {
        return c('collider_2025: Label').t`Former members`;
    }
    return member?.Name || c('collider_2025: Label').t`Unknown member`;
};

const getMemberRole = (memberId: string | null, member: Member | undefined) => {
    if (memberId === null) {
        return c('collider_2025: Info').t`No longer in the organization`;
    }
    if (!member) {
        return '';
    }
    return member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN
        ? c('collider_2025: Label').t`Admin`
        : c('collider_2025: Label').t`Member`;
};

export const getApiMemberUsage = (rows: UsageMemberRow[], members: Member[]): ApiMemberUsage[] =>
    rows.map(({ MemberID, Totals }) => {
        const member = members.find(({ ID }) => ID === MemberID);
        return {
            id: MemberID ?? 'former-members',
            name: getMemberName(MemberID, member),
            role: getMemberRole(MemberID, member),
            isCurrentMember: member !== undefined,
            totalTokens: Totals.TokensIn + Totals.TokensInCached + Totals.TokensGenerated,
            cost: Totals.CostMicros === null ? null : Totals.CostMicros / CREDIT_MICROS,
        };
    });

export const filterMembersByName = (members: ApiMemberUsage[], search: string) =>
    members.filter((member) => member.name.toLowerCase().includes(search.toLowerCase()));

export const getCostLabel = (cost: number | null, currency: Currency) =>
    cost === null ? c('collider_2025: Info').t`Not priced yet` : formatApiCurrency(cost, currency);
