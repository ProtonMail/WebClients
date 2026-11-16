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

export interface UsageSummaryResponse {
    Code: number;
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
