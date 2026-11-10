export interface UsageSummaryBreakdownRow {
    Date: string;
    TokensIn: number;
    TokensInCached: number;
    TokensGenerated: number;
    ApiCalls: number;
}

export interface UsageSummaryResponse {
    Code: number;
    Breakdown: UsageSummaryBreakdownRow[];
}

export const getUsageSummaryRequest = (params: { From: string; To: string; PersonalAccessTokenID?: string }) => ({
    url: 'ai/v1/usage/summary',
    method: 'get' as const,
    params,
});
