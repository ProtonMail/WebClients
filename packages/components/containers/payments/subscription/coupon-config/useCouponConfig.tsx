import type { ReactNode } from 'react';

import { getPlanNameFromIDs } from '@proton/payments';

import { greenlandIcelandConfig } from './greenlandIceland';
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
import { vpn15mConfig } from './vpn15m';

const defaultCouponConfigs: CouponConfig[] = [monthlyNudgeConfig, vpn15mConfig, greenlandIcelandConfig];

export type CouponConfigRendered = Omit<CouponConfig, 'amountDueMessage' | 'cyclePriceCompare' | 'cycleTitle'> & {
    renderAmountDueMessage?: () => ReactNode;
    renderCyclePriceCompare?: (params: CyclePriceCompareFirstParam) => CyclePriceCompareReturnType;
    renderCycleTitle?: (params: CycleTitleFirstParam) => CycleTitleReturnType;
    renderShowMigrationDiscountLossWarning?: () => boolean;
    renderPayCTA?: () => string;
};

export function matchCouponConfig(
    checkoutProps: CouponConfigProps,
    couponConfigs: CouponConfig[]
): CouponConfig | undefined {
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
export const useCouponConfig = (
    checkoutProps: CouponConfigProps,
    couponConfigs: CouponConfig[] = defaultCouponConfigs
): CouponConfigRendered | undefined => {
    if (!isCouponConfigRequiredProps(checkoutProps)) {
        return;
    }

    const matchingConfig = matchCouponConfig(checkoutProps, couponConfigs);
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

/**
 * This function is helpful when you need a certain coupon config before the coupon is actually applied.
 */
export const getStaticCouponConfig = (coupon: string): CouponConfig | undefined => {
    const uppercaseCoupon = coupon.trim().toUpperCase();

    const config = defaultCouponConfigs.find((it) => {
        if (Array.isArray(it.coupons)) {
            return it.coupons.includes(uppercaseCoupon);
        }
        return it.coupons === uppercaseCoupon;
    });

    return config;
};
