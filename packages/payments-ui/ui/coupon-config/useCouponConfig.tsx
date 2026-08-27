import type { ReactNode } from 'react';

import { hasAlikeCoupon } from '@proton/payments/core/coupon-config/helpers';
import { isCouponConfigRequiredProps } from '@proton/payments/core/coupon-config/interface';
import type { CouponConfigProps } from '@proton/payments/core/coupon-config/interface';
import { matchCouponConfig } from '@proton/payments/core/coupon-config/match-coupon-config';

import { defaultCouponConfigs } from './default-coupon-configs';
import type {
    CouponConfig,
    CyclePriceCompareFirstParam,
    CyclePriceCompareReturnType,
    CycleTitleFirstParam,
    CycleTitleReturnType,
} from './interface';

export type CouponConfigRendered = Omit<CouponConfig, 'amountDueMessage' | 'cyclePriceCompare' | 'cycleTitle'> & {
    renderAmountDueMessage?: () => ReactNode;
    renderCyclePriceCompare?: (params: CyclePriceCompareFirstParam) => CyclePriceCompareReturnType;
    renderCycleTitle?: (params: CycleTitleFirstParam) => CycleTitleReturnType;
    renderShowMigrationDiscountLossWarning?: () => boolean;
    renderPayCTA?: () => string;
};

export { matchCouponConfig } from '@proton/payments/core/coupon-config/match-coupon-config';

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
