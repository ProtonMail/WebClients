import type { CouponConfig } from '../../coupon-config/interface';
import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';

export function showMeetAddonCustomizer({
    meetAddonFlag,
    couponConfig,
}: {
    meetAddonFlag: boolean;
    couponConfig: CouponConfigRendered | CouponConfig | undefined;
}): boolean {
    return meetAddonFlag && !couponConfig?.hideMeetAddonBanner;
}
