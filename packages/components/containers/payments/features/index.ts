import { PLANS } from '@proton/shared/lib/constants';
import { Audience, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { getSupportFeatures, getTeamManagementFeatures } from './b2b';
import { getCalendarFeatures } from './calendar';
import { getDriveFeatures } from './drive';
import { getHighlightFeatures } from './highlights';
import { PlanCardFeature } from './interface';
import { getMailFeatures } from './mail';
import { getPassFeatures } from './pass';
import { getVPNFeatures } from './vpn';

export const getAllFeatures = ({
    plansMap,
    serversCount,
    calendarSharingEnabled,
    sentinelPassplusEnabled,
}: {
    plansMap: PlansMap;
    serversCount: VPNServersCountData;
    calendarSharingEnabled: boolean;
    sentinelPassplusEnabled: boolean;
}) => {
    return {
        highlight: getHighlightFeatures(plansMap, sentinelPassplusEnabled),
        mail: getMailFeatures(plansMap),
        calendar: getCalendarFeatures(plansMap, calendarSharingEnabled),
        drive: getDriveFeatures(plansMap),
        pass: getPassFeatures(),
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
