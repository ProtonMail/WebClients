import type { PLANS } from '@proton/shared/lib/constants';
import type { Audience, FreePlanDefault, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { getSupportFeatures, getTeamManagementFeatures } from './b2b';
import { getCalendarFeatures } from './calendar';
import { getDriveFeatures } from './drive';
import { getHighlightFeatures } from './highlights';
import type { PlanCardFeature } from './interface';
import { getMailFeatures } from './mail';
import { getPassFeatures } from './pass';
import { getVPNFeatures } from './vpn';
import { getWalletFeatures } from './wallet';

export const getAllFeatures = ({
    plansMap,
    serversCount,
    freePlan,
    canAccessDistributionListFeature,
}: {
    plansMap: PlansMap;
    serversCount: VPNServersCountData;
    freePlan: FreePlanDefault;
    canAccessDistributionListFeature: boolean;
}) => {
    return {
        highlight: getHighlightFeatures(plansMap, freePlan),
        mail: getMailFeatures(plansMap, canAccessDistributionListFeature),
        calendar: getCalendarFeatures(plansMap),
        drive: getDriveFeatures(plansMap, freePlan),
        pass: getPassFeatures(),
        vpn: getVPNFeatures(serversCount),
        wallet: getWalletFeatures(),
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
