import { c } from 'ttag';

import { BRAND_NAME, PLANS, PLAN_NAMES, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { Plan, PlansMap, VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';

import { getCalendarAppFeature, getNCalendarsFeature } from './calendar';
import { getDriveAppFeature, getStorageFeature, getStorageFeatureB2B } from './drive';
import { getSupport } from './highlights';
import { ShortPlan } from './interface';
import {
    getContactGroupsManagement,
    getFoldersAndLabelsFeature,
    getNAddressesFeature,
    getNAddressesFeatureB2B,
    getNDomainsFeature,
    getNMessagesFeature,
} from './mail';
import {
    getB2BHighSpeedVPNConnections,
    getCountries,
    getNetShield,
    getNoLogs,
    getP2P,
    getSecureCore,
    getStreaming,
    getTor,
    getVPNAppFeature,
    getVPNConnections,
    getVPNSpeed,
} from './vpn';

const getCTA = (planName: string) => {
    return c('new_plans: action').t`Get ${planName}`;
};

export const getFreePlan = (): ShortPlan => {
    return {
        plan: PLANS.FREE,
        title: PLAN_NAMES[PLANS.FREE],
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
        title: plan.Title,
        label: c('new_plans: info').t`Popular`,
        description: c('new_plans: info').t`Comprehensive privacy and security with all Proton services combined.`,
        cta: getCTA(plan.Title),
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

export const getDrivePlan = (plan: Plan, boldStorageSize?: boolean): ShortPlan => {
    return {
        plan: PLANS.DRIVE,
        title: plan.Title,
        label: '',
        description: c('new_plans: info')
            .t`Secure cloud storage that lets you store, sync, and share files easily and securely.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeature(plan.MaxSpace, { boldStorageSize }),
            getNAddressesFeature({ n: plan.MaxAddresses || 1 }),
            getNCalendarsFeature(1),
            getVPNConnections(1),
            getSupport('priority'),
        ],
    };
};

export const getMailPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.MAIL,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Secure email with advanced features for your everyday communications.`,
        cta: getCTA(plan.Title),
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

export const getFreeVPNPlan = (vpnCountries: VPNCountries, serversCount: VPNServers): ShortPlan => {
    const freeServers = getFreeServers(serversCount.free_vpn, vpnCountries.free_vpn.count);
    return {
        plan: PLANS.FREE,
        title: PLAN_NAMES[PLANS.FREE],
        label: '',
        description: c('new_plans: info')
            .t`The no-cost starter account designed to empower everyone with privacy by default.`,
        cta: c('new_plans: action').t`Get ${BRAND_NAME} for free`,
        features: [getVPNConnections(1), getCountries(freeServers), getVPNSpeed('medium'), getNoLogs()],
    };
};
export const getVPNPlan = (plan: Plan, vpnCountries: VPNCountries, serversCount: VPNServers): ShortPlan => {
    const plusServers = getPlusServers(serversCount[PLANS.VPN], vpnCountries[PLANS.VPN].count);
    return {
        plan: PLANS.VPN,
        title: plan.Title,
        label: '',
        description: c('new_plans: info')
            .t`The dedicated VPN solution that provides secure, unrestricted, high-speed access to the internet.`,
        cta: getCTA(plan.Title),
        features: [
            getVPNConnections(VPN_CONNECTIONS, true),
            getCountries(plusServers, true),
            getVPNSpeed('highest', true),
            getNoLogs(true),
            getNetShield(true, true),
            getStreaming(true, true),
            getP2P(true, true),
            getSecureCore(true, true),
            getTor(true, true),
        ],
    };
};
export const getMailProPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.MAIL_PRO,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Secure email and calendar for professionals and businesses.`,
        cta: getCTA(plan.Title),
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
        title: plan.Title,
        label: '',
        description: c('new_plans: info')
            .t`Privacy and security suite for businesses, including all premium Proton services.`,
        cta: getCTA(plan.Title),
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

export const getNewVisionaryPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.NEW_VISIONARY,
        title: plan.Title,
        label: '',
        description: '',
        cta: getCTA(plan.Title),
        features: [
            getStorageFeature(plan.MaxSpace),
            getNAddressesFeature({ n: plan.MaxAddresses }),
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

export const getShortPlan = (
    plan: PLANS,
    plansMap: PlansMap,
    vpnCountries: VPNCountries,
    vpnServers: VPNServers,
    options: { boldStorageSize?: boolean } = {}
) => {
    const { boldStorageSize } = options;
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
            return getVPNPlan(planData, vpnCountries, vpnServers);
        case PLANS.DRIVE:
            return getDrivePlan(planData, boldStorageSize);
        case PLANS.MAIL_PRO:
            return getMailProPlan(planData);
        case PLANS.BUNDLE:
            return getBundlePlan(planData);
        case PLANS.BUNDLE_PRO:
            return getBundleProPlan(planData);
        case PLANS.NEW_VISIONARY:
            return getNewVisionaryPlan(planData);
        default:
            return null;
    }
};
