import { getIsVPNPassPromotion, getIsVpn2024Deal } from '@proton/components/containers/payments/subscription/helpers';
import { PLANS } from '@proton/payments';
import { type Currency, DEFAULT_CURRENCY } from '@proton/payments';
import { CYCLE } from '@proton/shared/lib/constants';

import { defaultSignupModel } from '../single-signup-v2/SingleSignupContainerV2';
import type { VPNSignupModel } from './interface';

export const getCycleData = ({ plan, coupon, currency }: { plan: PLANS; coupon?: string; currency: Currency }) => {
    if (getIsVPNPassPromotion(coupon, currency)) {
        return {
            upsellCycle: CYCLE.YEARLY,
            cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
        };
    }

    if (getIsVpn2024Deal(plan, coupon)) {
        return {
            upsellCycle: CYCLE.THIRTY,
            cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY],
        };
    }

    return {
        upsellCycle: CYCLE.TWO_YEARS,
        cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
    };
};

export const defaultVPNSignupModel: VPNSignupModel = {
    ...defaultSignupModel,
    cycleData: getCycleData({ plan: PLANS.VPN, currency: DEFAULT_CURRENCY }),
    signupType: 'default',
};
