import type { ApiTokenPricingModelId } from '../api-docs/apiTokenPricingUsd';

export type ApiUsageMember = {
    id: string;
    name: string;
    role: 'Admin' | 'Member';
    inputTokens: number;
    outputTokens: number;
    cacheInputTokens: number;
    cost: number;
    modelUsage: Record<
        ApiTokenPricingModelId,
        { inputTokens: number; outputTokens: number; cacheInputTokens: number; cost: number }
    >;
    apiAccess: boolean;
};

export const MOCK_API_USAGE_MEMBERS: ApiUsageMember[] = [
    {
        id: 'member-1',
        name: 'You',
        role: 'Admin',
        inputTokens: 5_820_400,
        outputTokens: 2_184_900,
        cacheInputTokens: 1_420_300,
        cost: 72.48,
        modelUsage: {
            'lumo-lite': {
                inputTokens: 3_783_300,
                outputTokens: 1_420_200,
                cacheInputTokens: 923_200,
                cost: 30,
            },
            'lumo-max': {
                inputTokens: 2_037_100,
                outputTokens: 764_700,
                cacheInputTokens: 497_100,
                cost: 42.48,
            },
        },
        apiAccess: true,
    },
    {
        id: 'member-2',
        name: 'Team member 1',
        role: 'Member',
        inputTokens: 4_190_200,
        outputTokens: 1_630_800,
        cacheInputTokens: 980_100,
        cost: 53.12,
        modelUsage: {
            'lumo-lite': {
                inputTokens: 2_723_600,
                outputTokens: 1_060_000,
                cacheInputTokens: 637_100,
                cost: 23,
            },
            'lumo-max': {
                inputTokens: 1_466_600,
                outputTokens: 570_800,
                cacheInputTokens: 343_000,
                cost: 30.12,
            },
        },
        apiAccess: true,
    },
    {
        id: 'member-3',
        name: 'Team member 2',
        role: 'Member',
        inputTokens: 2_870_600,
        outputTokens: 1_108_200,
        cacheInputTokens: 704_500,
        cost: 36.87,
        modelUsage: {
            'lumo-lite': {
                inputTokens: 1_865_900,
                outputTokens: 720_300,
                cacheInputTokens: 457_900,
                cost: 14.5,
            },
            'lumo-max': {
                inputTokens: 1_004_700,
                outputTokens: 387_900,
                cacheInputTokens: 246_600,
                cost: 22.37,
            },
        },
        apiAccess: true,
    },
    {
        id: 'member-4',
        name: 'Team member 3',
        role: 'Member',
        inputTokens: 1_304_800,
        outputTokens: 520_700,
        cacheInputTokens: 348_200,
        cost: 17.93,
        modelUsage: {
            'lumo-lite': {
                inputTokens: 848_100,
                outputTokens: 338_500,
                cacheInputTokens: 226_300,
                cost: 8.2,
            },
            'lumo-max': {
                inputTokens: 456_700,
                outputTokens: 182_200,
                cacheInputTokens: 121_900,
                cost: 9.73,
            },
        },
        apiAccess: false,
    },
];
