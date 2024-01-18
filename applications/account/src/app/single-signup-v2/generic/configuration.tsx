import { ProtonLogo } from '@proton/components/components';
import { FreePlanDefault, Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';

import { SignupType } from '../../signup/interfaces';
import { PlanParameters, SignupConfiguration, SignupMode } from '../interface';
import { getMailConfiguration } from '../mail/configuration';

export const getGenericConfiguration = ({
    mode,
    plan,
    isLargeViewport,
    plansMap,
    planParameters,
    vpnServersCountData,
    hideFreePlan,
    freePlan,
}: {
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
