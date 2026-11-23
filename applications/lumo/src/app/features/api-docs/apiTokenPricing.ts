import { c, msgid } from 'ttag';

/** Lumo API model IDs that appear in usage and docs pricing tables. */
export type ApiTokenPricingModelId = 'lumo-lite' | 'lumo-max';

/** May move to the /models API response later. */
export interface ApiTokenCreditsPerMillion {
    input: number;
    output: number;
    cacheInput: number | null;
}

export const API_TOKEN_CREDITS_PER_MILLION = {
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
} satisfies Record<ApiTokenPricingModelId, ApiTokenCreditsPerMillion>;

export const API_TOKEN_PRICING_MODEL_IDS = Object.keys(API_TOKEN_CREDITS_PER_MILLION) as ApiTokenPricingModelId[];

export const getApiModelPricing = (modelId: string): ApiTokenCreditsPerMillion | undefined =>
    modelId in API_TOKEN_CREDITS_PER_MILLION
        ? API_TOKEN_CREDITS_PER_MILLION[modelId as ApiTokenPricingModelId]
        : undefined;

/** Credits have no currency: their price depends on the currency they were bought in. */
export const formatCredits = (credits: number) => {
    const roundedCredits = Math.round(credits * 100) / 100;
    const formattedCredits = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(roundedCredits);
    return c('collider_2025: Info').ngettext(
        msgid`${formattedCredits} credit`,
        `${formattedCredits} credits`,
        roundedCredits
    );
};
