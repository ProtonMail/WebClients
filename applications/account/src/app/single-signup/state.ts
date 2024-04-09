import { VPNIntroPricingVariant } from '@proton/components/containers';
import { getIsVpn2024, getIsVpn2024Deal } from '@proton/components/containers/payments/subscription/helpers';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { defaultSignupModel } from '../single-signup-v2/SingleSignupContainerV2';
import { VPNSignupModel } from './interface';

export const getCycleData = ({
    plan,
    coupon,
    vpnIntroPricingVariant,
}: {
    plan: PLANS;
    coupon?: string;
    vpnIntroPricingVariant?: VPNIntroPricingVariant;
}) => {
    if (getIsVpn2024Deal(plan, coupon)) {
        return {
            upsellCycle: CYCLE.THIRTY,
            cycles: [CYCLE.MONTHLY, CYCLE.FIFTEEN, CYCLE.THIRTY],
        };
    }

    const defaultValue = {
        upsellCycle: CYCLE.TWO_YEARS,
        cycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
    };

    if (vpnIntroPricingVariant === VPNIntroPricingVariant.New2024) {
        return defaultValue;
    }

    if (getIsVpn2024(plan)) {
        return {
            upsellCycle: CYCLE.EIGHTEEN,
            cycles: [CYCLE.MONTHLY, CYCLE.THREE, CYCLE.EIGHTEEN],
        };
    }

    return defaultValue;
};

export const defaultVPNSignupModel: VPNSignupModel = {
    ...defaultSignupModel,
    cycleData: getCycleData({ plan: PLANS.VPN }),
    signupType: 'default',
};
