import { API_TOKEN_PRICING_USD_PER_MILLION } from '../api-docs/apiTokenPricingUsd';

export type ApiUsageDay = {
    date: string;
    inputTokens: number;
    outputTokens: number;
    cacheInputTokens: number;
    cost: number;
};

export type ApiUsageModel = 'lumo-lite' | 'lumo-max';

export type ApiUsageMember = {
    id: string;
    name: string;
    role: 'Admin' | 'Member';
    inputTokens: number;
    outputTokens: number;
    cacheInputTokens: number;
    cost: number;
    modelUsage: Record<
        ApiUsageModel,
        { inputTokens: number; outputTokens: number; cacheInputTokens: number; cost: number }
    >;
    apiAccess: boolean;
};

export type ApiModelUsage = {
    model: ApiUsageModel;
    inputTokens: number;
    outputTokens: number;
    cacheInputTokens: number;
};

const dailyUsage = [
    [860_000, 390_000, 120_000],
    [1_040_000, 470_000, 180_000],
    [750_000, 330_000, 140_000],
    [1_260_000, 570_000, 260_000],
    [1_440_000, 650_000, 310_000],
    [930_000, 420_000, 160_000],
    [810_000, 360_000, 150_000],
    [1_550_000, 710_000, 350_000],
    [1_680_000, 770_000, 410_000],
    [1_320_000, 590_000, 290_000],
    [1_070_000, 480_000, 230_000],
    [1_810_000, 840_000, 460_000],
    [2_010_000, 920_000, 530_000],
    [1_650_000, 750_000, 430_000],
    [1_120_000, 510_000, 250_000],
    [970_000, 440_000, 200_000],
    [780_000, 350_000, 90_000],
    [920_000, 410_000, 130_000],
    [640_000, 290_000, 110_000],
    [1_180_000, 520_000, 240_000],
    [1_360_000, 620_000, 280_000],
    [890_000, 430_000, 170_000],
    [720_000, 310_000, 150_000],
    [1_490_000, 680_000, 320_000],
    [1_620_000, 740_000, 390_000],
    [1_210_000, 550_000, 260_000],
    [980_000, 450_000, 210_000],
    [1_740_000, 810_000, 440_000],
    [1_920_000, 890_000, 510_000],
    [1_580_000, 720_000, 420_000],
] as const;

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

export const getMockApiUsageDays = (numberOfDays = 30): ApiUsageDay[] => {
    const today = new Date();

    return Array.from({ length: numberOfDays }, (_, index) => {
        const patternIndex = (dailyUsage.length - numberOfDays + index) % dailyUsage.length;
        const normalizedPatternIndex = patternIndex < 0 ? patternIndex + dailyUsage.length : patternIndex;
        const [baseInputTokens, baseOutputTokens, baseCacheInputTokens] = dailyUsage[normalizedPatternIndex];
        const cycle = Math.floor((numberOfDays - 1 - index) / dailyUsage.length);
        const historicalScale = Math.max(0.72, 1 - cycle * 0.08);
        const inputTokens = Math.round(baseInputTokens * historicalScale);
        const outputTokens = Math.round(baseOutputTokens * historicalScale);
        const cacheInputTokens = Math.round(baseCacheInputTokens * historicalScale);
        const date = new Date(today);
        date.setDate(today.getDate() - (numberOfDays - 1 - index));
        const liteShare = 0.65;
        const maxShare = 1 - liteShare;
        const cost =
            (inputTokens / 1_000_000) *
                (MOCK_API_CREDIT_RATES['lumo-lite'].input * liteShare +
                    MOCK_API_CREDIT_RATES['lumo-max'].input * maxShare) +
            (outputTokens / 1_000_000) *
                (MOCK_API_CREDIT_RATES['lumo-lite'].output * liteShare +
                    MOCK_API_CREDIT_RATES['lumo-max'].output * maxShare) +
            (cacheInputTokens / 1_000_000) *
                ((MOCK_API_CREDIT_RATES['lumo-lite'].cacheInput ?? 0) * liteShare +
                    (MOCK_API_CREDIT_RATES['lumo-max'].cacheInput ?? 0) * maxShare);

        return {
            date: toISODate(date),
            inputTokens,
            outputTokens,
            cacheInputTokens,
            cost,
        };
    });
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

/** Mock API credit deductions in USD per million tokens. */
export const MOCK_API_CREDIT_RATES = API_TOKEN_PRICING_USD_PER_MILLION satisfies Record<
    ApiUsageModel,
    { input: number; output: number; cacheInput: number | null }
>;
