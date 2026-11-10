import type { CouponConfig, CouponConfigRendered } from '@proton/payments-hooks/ui/coupon-config/interface';
import { hasAlikeCoupon } from '@proton/payments/core/coupon-config/helpers';
import type { CouponConfigProps } from '@proton/payments/core/coupon-config/interface';
import { isCouponConfigRequiredProps } from '@proton/payments/core/coupon-config/interface';
import { matchCouponConfig } from '@proton/payments/core/coupon-config/match-coupon-config';

import { defaultCouponConfigs } from './default-coupon-configs';

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
