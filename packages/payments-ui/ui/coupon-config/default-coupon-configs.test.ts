import { defaultCouponConfigMetadata } from '@proton/payments/core/coupon-config/default-coupon-configs';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import { omit } from '@proton/shared/lib/helpers/object';

import { defaultCouponConfigs } from './default-coupon-configs';
import type { CouponConfig } from './interface';

type RendererKey = Exclude<keyof CouponConfig, keyof CouponConfigMetadata>;

/** Typed as a full record so adding or renaming a render callback on CouponConfig fails to compile here. */
const rendererKeys: Record<RendererKey, true> = {
    amountDueMessage: true,
    payCTA: true,
    checkoutSubtitle: true,
    cyclePriceCompare: true,
    cycleTitle: true,
};

const metadataOf = (config: CouponConfig): CouponConfigMetadata =>
    omit(config, Object.keys(rendererKeys) as RendererKey[]);

describe('defaultCouponConfigs', () => {
    // If these test fail, make sure that you declared the new coupon config in both default-coupon-configs.ts files: in
    // payments and payments-ui
    it('holds the same campaigns, in the same order, as @proton/payments/core', () => {
        expect(defaultCouponConfigs.map((config) => config.coupons)).toEqual(
            defaultCouponConfigMetadata.map((metadata) => metadata.coupons)
        );
    });

    it('repeats no metadata that differs from @proton/payments/core', () => {
        expect(defaultCouponConfigs.map(metadataOf)).toEqual(defaultCouponConfigMetadata);
    });
});
