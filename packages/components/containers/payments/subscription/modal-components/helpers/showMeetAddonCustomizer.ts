import type { CouponConfig } from '@proton/payments/ui/coupon-config/interface';
import type { CouponConfigRendered } from '@proton/payments/ui/coupon-config/useCouponConfig';

export function showMeetAddonCustomizer({
    meetAddonFlag,
    couponConfig,
}: {
    meetAddonFlag: boolean;
    couponConfig: CouponConfigRendered | CouponConfig | undefined;
}): boolean {
    return meetAddonFlag && !couponConfig?.hideMeetAddonBanner;
}
