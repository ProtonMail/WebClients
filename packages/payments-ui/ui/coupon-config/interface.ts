import type { ReactNode } from 'react';

import type { CYCLE } from '@proton/payments/core/constants';
import type {
    CouponConfigProps as CoreCouponConfigProps,
    CouponConfigMetadata,
} from '@proton/payments/core/coupon-config/interface';

export type {
    CouponConfigMetadata,
    CouponConfigProps,
    CouponHideFlagsOnConfig,
} from '@proton/payments/core/coupon-config/interface';
export { isCouponConfigRequiredProps } from '@proton/payments/core/coupon-config/interface';

type CouponConfigRequiredProps = CoreCouponConfigProps & {
    checkResult: NonNullable<CoreCouponConfigProps['checkResult']>;
};

export type CouponConfig = CouponConfigMetadata & {
    amountDueMessage?: (props: CouponConfigRequiredProps) => ReactNode;
    payCTA?: (props: CouponConfigRequiredProps) => string;
    checkoutSubtitle?: () => ReactNode;
    cyclePriceCompare?: (params: { cycle: CYCLE; suffix?: string }, config: CouponConfigRequiredProps) => ReactNode;
    cycleTitle?: (params: { cycle: CYCLE }, config: CouponConfigRequiredProps) => ReactNode;
};

export type CyclePriceCompareFirstParam = Parameters<NonNullable<CouponConfig['cyclePriceCompare']>>[0];
export type CyclePriceCompareReturnType = ReturnType<NonNullable<CouponConfig['cyclePriceCompare']>>;

export type CycleTitleFirstParam = Parameters<NonNullable<CouponConfig['cycleTitle']>>[0];
export type CycleTitleReturnType = ReturnType<NonNullable<CouponConfig['cycleTitle']>>;
