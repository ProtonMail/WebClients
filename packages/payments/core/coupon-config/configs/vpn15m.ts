import { CYCLE, PLANS } from '../../constants';
import type { CouponConfigMetadata } from '../interface';

export const vpn15mMetadata: CouponConfigMetadata = {
    coupons: [],
    specialCases: [
        {
            planName: PLANS.VPN2024,
            cycle: CYCLE.FIFTEEN,
        },
    ],
    hidden: true,
    cyclePriceComparePosition: 'before',
    showMigrationDiscountLossWarning: true,
    hideLumoAddonBanner: true,
};
