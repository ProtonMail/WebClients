import { ProtonLogo } from '@proton/components';
import type { Audience, FreePlanDefault, Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';

import type { PublicTheme } from '../../containers/PublicThemeProvider';
import { SignupType } from '../../signup/interfaces';
import type { PlanParameters, SignupConfiguration, SignupMode } from '../interface';
import { getMailConfiguration } from '../mail/configuration';
import CustomStep from './CustomStep';

export const getGenericConfiguration = ({
    theme,
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
    theme: PublicTheme;
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
    const logo = <ProtonLogo color={theme.dark ? 'invert' : 'brand'} />;

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
        CustomStep,
    };
};
