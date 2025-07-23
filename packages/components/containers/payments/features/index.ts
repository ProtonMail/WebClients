import { type FreePlanDefault, type PlansMap } from '@proton/payments';
import type { PLANS } from '@proton/payments';
import type { Audience, VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { getSupportFeatures, getTeamManagementFeatures } from './b2b';
import { getCalendarFeatures } from './calendar';
import { getDriveFeatures } from './drive';
import { getHighlightFeatures } from './highlights';
import type { PlanCardFeature } from './interface';
import { getLumoFeatures } from './lumo';
import { getMailFeatures } from './mail';
import { getPassFeatures } from './pass';
import { getVPNFeatures } from './vpn';
import { getWalletFeatures } from './wallet';

export const getAllFeatures = ({
    plansMap,
    serversCount,
    freePlan,
}: {
    plansMap: PlansMap;
    serversCount: VPNServersCountData;
    freePlan: FreePlanDefault;
}) => {
    return {
        highlight: getHighlightFeatures(plansMap, freePlan),
        mail: getMailFeatures(plansMap),
        calendar: getCalendarFeatures(plansMap),
        drive: getDriveFeatures(plansMap, freePlan),
        pass: getPassFeatures(),
        vpn: getVPNFeatures(serversCount),
        wallet: getWalletFeatures(),
        lumo: getLumoFeatures(),
        team: getTeamManagementFeatures(),
        support: getSupportFeatures(),
    } as const;
};

export const getFeatureDefinitions = (plan: PLANS, features: PlanCardFeature[], audience: Audience) => {
    const filterAudience = (feature: PlanCardFeature) => {
        return feature.target === undefined || feature.target === audience;
    };
    return features
        .filter(filterAudience)
        .map((feature) => {
            return feature.plans[plan as keyof typeof feature.plans];
        })
        .filter(isTruthy);
};

export type AllFeatures = ReturnType<typeof getAllFeatures>;
