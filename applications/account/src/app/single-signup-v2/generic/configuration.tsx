import { ProtonLogo } from '@proton/components/components';
import { Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';

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
}: {
    mode: SignupMode;
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
    });

    return {
        ...mailConfiguration,
        signupTypes: [SignupType.Username, SignupType.Email],
        logo,
    };
};
