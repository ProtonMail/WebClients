import { ProtonLogo } from '@proton/components';
import { type FreePlanDefault, type Plan, type PlansMap } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Audience, VPNServersCountData } from '@proton/shared/lib/interfaces';

import type { PublicTheme } from '../../containers/PublicThemeProvider';
import { SignupType } from '../../signup/interfaces';
import type { PlanParameters, SignupConfiguration, SignupParameters2 } from '../interface';
import { getMailConfiguration } from '../mail/configuration';
import { getCustomStep } from './CustomStep';

export const getGenericConfiguration = ({
    toApp,
    theme,
    plan,
    audience,
    isLargeViewport,
    plansMap,
    planParameters,
    vpnServersCountData,
    freePlan,
    signupParameters,
}: {
    theme: PublicTheme;
    audience: Audience.B2C | Audience.B2B;
    toApp?: APP_NAMES;
    signupParameters: SignupParameters2;
    freePlan: FreePlanDefault;
    plan: Plan;
    planParameters: PlanParameters | undefined;
    plansMap?: PlansMap;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
}): SignupConfiguration => {
    const logo = <ProtonLogo color={theme.dark ? 'invert' : 'brand'} />;

    const mailConfiguration = getMailConfiguration({
        audience,
        plan,
        planParameters,
        isLargeViewport,
        plansMap,
        vpnServersCountData,
        signupParameters,
        freePlan,
        canUseBYOE: false,
    });

    return {
        ...mailConfiguration,
        product: toApp ?? mailConfiguration.product,
        signupTypes: [SignupType.Proton, SignupType.External],
        logo,
        CustomStep: getCustomStep({ hasExploreStep: !toApp }),
    };
};
