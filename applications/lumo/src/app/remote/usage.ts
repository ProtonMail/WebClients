export interface UsageEntry {
    ClientType: string;
    Model: string;
    InputTokens: number;
    OutputTokens: number;
    Calls: number;
    CostMicros: number | null;
}

export interface UsageDay {
    Date: string;
    Usage: UsageEntry[];
}

export interface BilledClientType {
    ClientType: string;
    Billed: boolean;
}

export interface UsageSummaryResponse {
    Code: number;
    ClientTypes: BilledClientType[];
    Days: UsageDay[];
}

export type UsageScope = 'self' | 'organization';

export type UsageClientType = 'api' | 'frontend' | 'lumo_desktop' | 'lumo_mail' | 'scribe';

export const getUsageSummaryRequest = (params: {
    From: string;
    To: string;
    Scope?: UsageScope;
    ClientType?: UsageClientType;
    PersonalAccessTokenID?: string;
}) => ({
    url: 'ai/v1/usage/summary',
    method: 'get' as const,
    params,
});

interface UsageTotals {
    /** Prompt tokens net of `TokensInCached` (lumo-ledger stores them apart), so input = TokensIn + TokensInCached. */
    TokensIn: number;
    TokensInCached: number;
    TokensGenerated: number;
    ApiCalls: number;
    CostMicros: number | null;
}

export interface UsageMemberRow {
    MemberID: string | null;
    Totals: UsageTotals;
}

export interface UsageMembersResponse {
    Code: number;
    Members: UsageMemberRow[];
}

export const getUsageMembersRequest = (params: { From: string; To: string; ClientType?: UsageClientType }) => ({
    url: 'ai/v1/usage/members',
    method: 'get' as const,
    params,
});
