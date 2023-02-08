import { PLANS } from '@proton/shared/lib/constants';
import { Audience, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { getSupportFeatures, getTeamManagementFeatures } from './b2b';
import { getCalendarFeatures } from './calendar';
import { getDriveFeatures } from './drive';
import { getHighlightFeatures } from './highlights';
import { PlanCardFeature } from './interface';
import { getMailFeatures } from './mail';
import { getVPNFeatures } from './vpn';

export const getAllFeatures = (plansMap: PlansMap, serversCount: VPNServersCountData) => {
    return {
        highlight: getHighlightFeatures(plansMap),
        mail: getMailFeatures(plansMap),
        calendar: getCalendarFeatures(plansMap),
        drive: getDriveFeatures(plansMap),
        vpn: getVPNFeatures(serversCount),
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
