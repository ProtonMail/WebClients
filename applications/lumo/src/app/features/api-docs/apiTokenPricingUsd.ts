/** Lumo API model IDs that appear in usage and docs pricing tables. */
export type ApiTokenPricingModelId = 'lumo-lite' | 'lumo-max';

/** USD list prices per one million tokens. May move to the /models API response later. */
export interface ApiTokenPricingUsdPerMillion {
    input: number;
    output: number;
    cacheInput: number | null;
}

export const API_TOKEN_PRICING_USD_PER_MILLION = {
    'lumo-lite': {
        input: 1,
        output: 4,
        cacheInput: 0.25,
    },
    'lumo-max': {
        input: 3,
        output: 6,
        cacheInput: 1,
    },
} satisfies Record<ApiTokenPricingModelId, ApiTokenPricingUsdPerMillion>;

export const API_TOKEN_PRICING_MODEL_IDS = Object.keys(API_TOKEN_PRICING_USD_PER_MILLION) as ApiTokenPricingModelId[];

export const getApiModelPricingUsd = (modelId: string): ApiTokenPricingUsdPerMillion | undefined =>
    modelId in API_TOKEN_PRICING_USD_PER_MILLION
        ? API_TOKEN_PRICING_USD_PER_MILLION[modelId as ApiTokenPricingModelId]
        : undefined;

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export const formatUsdAmount = (amount: number) => usdFormatter.format(amount);
