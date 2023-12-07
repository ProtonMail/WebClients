import { ProtonLogo } from '@proton/components/components';
import { Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';

import { SignupType } from '../../signup/interfaces';
import { SignupConfiguration } from '../interface';
import { getMailConfiguration } from '../mail/configuration';

export const getGenericConfiguration = ({
    plan,
    isLargeViewport,
    plansMap,
    vpnServersCountData,
    hideFreePlan,
}: {
    plan: Plan;
    hideFreePlan: boolean;
    plansMap?: PlansMap;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
}): SignupConfiguration => {
    const logo = <ProtonLogo />;

    const mailConfiguration = getMailConfiguration({
        plan,
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
