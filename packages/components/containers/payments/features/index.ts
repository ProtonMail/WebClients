import { PLANS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';
import { Audience, PlansMap, VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';
import { getHighlightFeatures } from './highlights';
import { getMailFeatures } from './mail';
import { getCalendarFeatures } from './calendar';
import { getDriveFeatures } from './drive';
import { getVPNFeatures } from './vpn';
import { getSupportFeatures, getTeamManagementFeatures } from './b2b';
import { PlanCardFeature } from './interface';

export const getAllFeatures = (plansMap: PlansMap, vpnCountries: VPNCountries, serversCount: VPNServers) => {
    return {
        highlight: getHighlightFeatures(plansMap),
        mail: getMailFeatures(plansMap),
        calendar: getCalendarFeatures(plansMap),
        drive: getDriveFeatures(plansMap),
        vpn: getVPNFeatures(vpnCountries, serversCount),
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
