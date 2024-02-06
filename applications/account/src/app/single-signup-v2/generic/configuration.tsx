import { ProtonLogo } from '@proton/components/components';
import { Audience, FreePlanDefault, Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';

import { SignupType } from '../../signup/interfaces';
import { PlanParameters, SignupConfiguration, SignupMode } from '../interface';
import { getMailConfiguration } from '../mail/configuration';

export const getGenericConfiguration = ({
    mode,
    plan,
    audience,
    isLargeViewport,
    plansMap,
    planParameters,
    vpnServersCountData,
    hideFreePlan,
    freePlan,
}: {
    audience: Audience.B2C | Audience.B2B;
    mode: SignupMode;
    freePlan: FreePlanDefault;
    plan: Plan;
    planParameters: PlanParameters | undefined;
    hideFreePlan: boolean;
    plansMap?: PlansMap;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
}): SignupConfiguration => {
    const logo = <ProtonLogo />;

    const mailConfiguration = getMailConfiguration({
        audience,
        mode,
        plan,
        planParameters,
        isLargeViewport,
        plansMap,
        vpnServersCountData,
        hideFreePlan,
        freePlan,
    });

    return {
        ...mailConfiguration,
        signupTypes: [SignupType.Username, SignupType.Email],
        logo,
    };
};
