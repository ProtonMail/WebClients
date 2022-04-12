import { c } from 'ttag';
import { BRAND_NAME, PLAN_NAMES, PLANS, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { Plan, PlansMap, VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';
import { getPlusServers } from '@proton/shared/lib/vpn/features';

import { ShortPlan } from './interface';
import { getDriveAppFeature, getStorageFeature, getStorageFeatureB2B } from './drive';
import {
    getContactGroupsManagement,
    getFoldersAndLabelsFeature,
    getNAddressesFeature,
    getNAddressesFeatureB2B,
    getNDomainsFeature,
    getNMessagesFeature,
} from './mail';
import { getCalendarAppFeature } from './calendar';
import {
    getB2BHighSpeedVPNConnections,
    getCountries,
    getNetShield,
    getP2P,
    getSecureCore,
    getStreaming,
    getTor,
    getVPNAppFeature,
    getVPNConnections,
    getVPNSpeed,
} from './vpn';
import { getSupport } from './highlights';

const getCTA = (planName: string) => {
    return c('new_plans: action').t`Get ${planName}`;
};

export const getFreePlan = (): ShortPlan => {
    return {
        plan: PLANS.FREE,
        label: '',
        description: c('new_plans: info')
            .t`The no-cost starter account designed to empower everyone with privacy by default.`,
        cta: c('new_plans: action').t`Get ${BRAND_NAME} for free`,
        features: [
            getStorageFeature(-1),
            getNAddressesFeature({ n: 1 }),
            getFoldersAndLabelsFeature(3),
            getNMessagesFeature(150),
        ],
    };
};

export const getBundlePlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.BUNDLE,
        label: c('new_plans: info').t`Popular`,
        description: c('new_plans: info').t`Comprehensive privacy and security with all Proton services combined.`,
        cta: getCTA(PLAN_NAMES[PLANS.BUNDLE]),
        features: [
            getStorageFeature(plan.MaxSpace),
            getNAddressesFeature({ n: plan.MaxAddresses }),
            getFoldersAndLabelsFeature(Number.POSITIVE_INFINITY),
            getNMessagesFeature(Number.POSITIVE_INFINITY),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getSupport('priority'),
            getCalendarAppFeature(),
            getDriveAppFeature(),
            getVPNAppFeature(),
        ],
    };
};

export const getMailPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.MAIL,
        label: '',
        description: c('new_plans: info').t`Secure email with advanced features for your everyday communications.`,
        cta: getCTA(PLAN_NAMES[PLANS.MAIL]),
        features: [
            getStorageFeature(plan.MaxSpace),
            getNAddressesFeature({ n: plan.MaxAddresses }),
            getFoldersAndLabelsFeature(Number.POSITIVE_INFINITY),
            getNMessagesFeature(Number.POSITIVE_INFINITY),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getSupport('priority'),
            getCalendarAppFeature(),
        ],
    };
};
export const getVPNPlan = (vpnCountries: VPNCountries, serversCount: VPNServers): ShortPlan => {
    const plusServers = getPlusServers(serversCount[PLANS.VPN], vpnCountries[PLANS.VPN].count);
    return {
        plan: PLANS.VPN,
        label: '',
        description: c('new_plans: info')
            .t`The dedicated VPN solution that provides secure, unrestricted, high-speed access to the internet.`,
        cta: getCTA(PLAN_NAMES[PLANS.VPN]),
        features: [
            getCountries(plusServers, true),
            getVPNSpeed('highest', true),
            getVPNConnections(VPN_CONNECTIONS, true),
            getStreaming(true, true),
            getP2P(true, true),
            getNetShield(true, true),
            getSecureCore(true, true),
            getTor(true, true),
        ],
    };
};
export const getMailProPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.MAIL_PRO,
        label: '',
        description: c('new_plans: info').t`Secure email and calendar for professionals and businesses.`,
        cta: getCTA(PLAN_NAMES[PLANS.MAIL_PRO]),
        features: [
            getStorageFeatureB2B(plan.MaxSpace),
            getNAddressesFeatureB2B({ n: plan.MaxAddresses }),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getFoldersAndLabelsFeature(Number.POSITIVE_INFINITY),
            getContactGroupsManagement(),
            getCalendarAppFeature(),
        ],
    };
};

export const getBundleProPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.BUNDLE_PRO,
        label: '',
        description: c('new_plans: info')
            .t`Privacy and security suite for businesses, including all premium Proton services.`,
        cta: getCTA(PLAN_NAMES[PLANS.BUNDLE_PRO]),
        features: [
            getStorageFeatureB2B(plan.MaxSpace),
            getNAddressesFeatureB2B({ n: plan.MaxAddresses }),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getFoldersAndLabelsFeature(Number.POSITIVE_INFINITY),
            getContactGroupsManagement(),
            getCalendarAppFeature(),
            getDriveAppFeature(),
            getB2BHighSpeedVPNConnections(),
            getNetShield(true),
            getSecureCore(true),
        ],
    };
};

export const getShortPlan = (plan: PLANS, plansMap: PlansMap, vpnCountries: VPNCountries, vpnServers: VPNServers) => {
    if (plan === PLANS.FREE) {
        return getFreePlan();
    }
    const planData = plansMap[plan];
    if (!planData) {
        return null;
    }
    switch (plan) {
        case PLANS.MAIL:
            return getMailPlan(planData);
        case PLANS.VPN:
            return getVPNPlan(vpnCountries, vpnServers);
        case PLANS.MAIL_PRO:
            return getMailProPlan(planData);
        case PLANS.BUNDLE:
            return getBundlePlan(planData);
        case PLANS.BUNDLE_PRO:
            return getBundleProPlan(planData);
        default:
            return null;
    }
};
