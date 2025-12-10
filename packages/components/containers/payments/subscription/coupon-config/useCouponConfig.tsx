import type { ReactNode } from 'react';

import { getPlanNameFromIDs } from '@proton/payments';

import { anniversary11Config } from './anniverary11';
import { bf2025Config } from './bf2025';
import { hasAlikeCoupon } from './helpers';
import {
    type CouponConfig,
    type CouponConfigProps,
    type CyclePriceCompareFirstParam,
    type CyclePriceCompareReturnType,
    type CycleTitleFirstParam,
    type CycleTitleReturnType,
    isCouponConfigRequiredProps,
} from './interface';
import { monthlyNudgeConfig } from './monthlyNudge';
import { tldrNewsletterConfig } from './tldrNewsletter';

const couponConfigs: CouponConfig[] = [monthlyNudgeConfig, anniversary11Config, tldrNewsletterConfig, bf2025Config];

export type CouponConfigRendered = Omit<CouponConfig, 'amountDueMessage' | 'cyclePriceCompare' | 'cycleTitle'> & {
    renderAmountDueMessage?: () => ReactNode;
    renderCyclePriceCompare?: (params: CyclePriceCompareFirstParam) => CyclePriceCompareReturnType;
    renderCycleTitle?: (params: CycleTitleFirstParam) => CycleTitleReturnType;
    renderShowMigrationDiscountLossWarning?: () => boolean;
    renderPayCTA?: () => string;
};

export function matchCouponConfig(checkoutProps: CouponConfigProps): CouponConfig | undefined {
    if (!isCouponConfigRequiredProps(checkoutProps)) {
        return;
    }

    const selectedCoupon = checkoutProps.checkResult.Coupon?.Code;
    const selectedCycle = checkoutProps.checkResult.Cycle;
    const selectedPlanName = getPlanNameFromIDs(checkoutProps.planIDs);

    return couponConfigs.find(
        (it) =>
            (selectedCoupon && it.coupons.includes(selectedCoupon)) ||
            (selectedCycle &&
                it.specialCases?.some(
                    (specialCase) => specialCase.planName === selectedPlanName && specialCase.cycle === selectedCycle
                ))
    );
}
/**
 * Defines overrides for the UI of subscription view. If a certain coupon is present it might change the view.
 * See details of {@link CouponConfig}.
 */
export const useCouponConfig = (checkoutProps: CouponConfigProps): CouponConfigRendered | undefined => {
    if (!isCouponConfigRequiredProps(checkoutProps)) {
        return;
    }

    const matchingConfig = matchCouponConfig(checkoutProps);
    if (!matchingConfig) {
        return;
    }

    const { cyclePriceCompare, cycleTitle, amountDueMessage, payCTA } = matchingConfig;

    return {
        ...matchingConfig,

        renderAmountDueMessage: amountDueMessage ? () => amountDueMessage(checkoutProps) : undefined,

        renderCyclePriceCompare: cyclePriceCompare ? (params) => cyclePriceCompare(params, checkoutProps) : undefined,

        renderCycleTitle: cycleTitle ? (params) => cycleTitle(params, checkoutProps) : undefined,

        renderShowMigrationDiscountLossWarning: () => {
            if (!matchingConfig.showMigrationDiscountLossWarning) {
                return false;
            }

            return hasAlikeCoupon(matchingConfig, checkoutProps.checkResult.Coupon);
        },

        renderPayCTA: payCTA ? () => payCTA(checkoutProps) : undefined,
    } satisfies CouponConfigRendered;
};
