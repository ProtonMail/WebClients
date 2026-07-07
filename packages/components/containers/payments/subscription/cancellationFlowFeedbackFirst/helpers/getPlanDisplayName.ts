import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';

export const getPlanDisplayName = (planName: PLANS, fallbackTitle?: string): string => {
    if (planName === PLANS.BUNDLE_PRO) {
        return fallbackTitle ?? PLAN_NAMES[planName];
    }

    if (planName === PLANS.VISIONARY) {
        return `${BRAND_NAME} ${PLAN_NAMES[planName]}`;
    }

    return PLAN_NAMES[planName] ?? fallbackTitle;
};
