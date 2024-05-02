import { getIsVpn2024Deal } from '@proton/components/containers/payments/subscription/helpers';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { defaultSignupModel } from '../single-signup-v2/SingleSignupContainerV2';
import { VPNSignupModel } from './interface';

export const getCycleData = ({ plan, coupon }: { plan: PLANS; coupon?: string }) => {
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
    cycleData: getCycleData({ plan: PLANS.VPN }),
    signupType: 'default',
};
