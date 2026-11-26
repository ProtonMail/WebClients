import { c } from 'ttag';

import { getLumoFree2026Features, getLumoTierAllFeatures } from '@proton/components/containers/payments/features/lumo';
import type { CYCLE } from '@proton/payments/core/constants';
import { PLAN_NAMES, PLANS } from '@proton/payments/core/constants';
import { getCurrencyFormattingConfig } from '@proton/payments/core/currencies';
import type { Currency, Cycle } from '@proton/payments/core/interface';
import type { LumoTierPlan } from '@proton/payments/core/subscription/lumo-purchase-rules';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import { getIntlLocale } from '@proton/shared/lib/i18n/helper';

export type BillingCycle = CYCLE.MONTHLY | CYCLE.YEARLY;

const LUMO_TIER_DESCRIPTIONS: Record<LumoTierPlan, () => string> = {
    [PLANS.LUMO_BASIC]: () => c('lumo_2026: Info').t`For everyday chats`,
    [PLANS.LUMO]: () => c('lumo_2026: Info').t`For getting more done`,
    [PLANS.LUMO_ULTRA]: () => c('lumo_2026: Info').t`For coding and building`,
};

export const getLumoPlanDetails = (tier?: LumoTierPlan, title?: string) => {
    if (!tier) {
        return {
            title: title ?? c('collider_2025:Title').t`Free`,
            // translator: Short description of the Free plan. ${LUMO_SHORT_APP_NAME} is the product name.
            description: c('collider_2025:Description').t`Try ${LUMO_SHORT_APP_NAME}`,
            features: getLumoFree2026Features(),
        };
    }

    return {
        title: title ?? PLAN_NAMES[tier],
        description: LUMO_TIER_DESCRIPTIONS[tier](),
        features: getLumoTierAllFeatures(tier),
    };
};

export const formatLumoPrice = (currency: Currency, amount: number) => {
    const { divisor, decimalPoints } = getCurrencyFormattingConfig(currency);
    const value = amount / divisor;
    return new Intl.NumberFormat([getIntlLocale(localeCode), 'en-US'], {
        style: 'currency',
        currency,
        minimumFractionDigits: Number.isInteger(value) ? 0 : decimalPoints,
        maximumFractionDigits: decimalPoints,
    }).format(value);
};

export const getLumoSavingsLabel = (discount: number) => {
    const percentage = new Intl.NumberFormat([getIntlLocale(localeCode), 'en-US'], { style: 'percent' }).format(
        discount / 100
    );
    // translator: Savings badge. ${percentage} is a localized percentage such as 20%.
    return c('collider_2025:Label').t`Save ${percentage}`;
};

/** What a plan card shows as its price. */
export interface TierCardPrice {
    /** Charged once per `cycle`, in the currency's minor units. `undefined` when the plan has no price. */
    amount?: number;
    /** Billing period in months. */
    cycle: Cycle;
    /** ISO currency used to format the price and any comparison amount. */
    currency: Currency;
    /** Yearly savings over paying monthly, in percent, with the monthly price it is measured against. */
    savings?: {
        /** Percentage saved compared with paying monthly. */
        percent: number;
        /** Monthly comparison price in the currency's minor units. */
        monthlyAmount: number;
    };
}
