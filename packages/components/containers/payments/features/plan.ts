import { c } from 'ttag';

import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import { BRAND_NAME, FAMILY_MAX_USERS, PLANS, PLAN_NAMES, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';

import { getCalendarAppFeature, getNCalendarsFeature } from './calendar';
import { getDriveAppFeature, getStorageFeature, getStorageFeatureB2B } from './drive';
import { getSupport, getUsersFeature } from './highlights';
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
    FREE_PASS_ALIASES,
    PASS_PLUS_VAULTS,
    get2FAAuthenticator,
    getCustomDomainForEmailAliases,
    getDataBreachMonitoring,
    getDevices,
    getE2Encryption,
    getForwardingMailboxes,
    getHideMyEmailAliases,
    getLoginsAndNotes,
    getSharing,
    getVaults,
} from './pass';
import {
    getB2BHighSpeedVPNConnections,
    getCountries,
    getDoubleHop,
    getNetShield,
    getNoLogs,
    getP2P,
    getPrioritySupport,
    getProtectDevices,
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
        description: c('new_plans: info')
            .t`Comprehensive privacy and security with all ${BRAND_NAME} services combined.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeature(plan.MaxSpace),
            getNAddressesFeature({ n: plan.MaxAddresses }),
            getFoldersAndLabelsFeature('unlimited'),
            getNMessagesFeature('unlimited'),
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
            getNCalendarsFeature(plan.MaxCalendars || MAX_CALENDARS_FREE),
            getVPNConnections(1),
            getSupport('priority'),
        ],
    };
};

export const getPassPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.PASS_PLUS,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`For next-level password management and identity protection.`,
        cta: getCTA(plan.Title),
        features: [
            get2FAAuthenticator(true),
            getVaults(PASS_PLUS_VAULTS),
            getHideMyEmailAliases('unlimited'),
            getCustomDomainForEmailAliases(true),
            getForwardingMailboxes('multiple'),
            getSharing(true),
            getDataBreachMonitoring(true),
            getSupport('priority'),
        ],
    };
};

export const getFreePassPlan = (): ShortPlan => {
    return {
        plan: PLANS.FREE,
        title: PLAN_NAMES[PLANS.FREE],
        label: '',
        description: c('new_plans: info')
            .t`The no-cost starter account designed to empower everyone with privacy by default.`,
        cta: c('new_plans: action').t`Get ${BRAND_NAME} for free`,
        features: [getLoginsAndNotes(), getDevices(), getHideMyEmailAliases(FREE_PASS_ALIASES), getE2Encryption()],
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
            getFoldersAndLabelsFeature('unlimited'),
            getNMessagesFeature('unlimited'),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getSupport('priority'),
            getCalendarAppFeature(),
        ],
    };
};

export const getFreeVPNPlan = (serversCount: VPNServersCountData): ShortPlan => {
    const freeServers = getFreeServers(serversCount.free.servers, serversCount.free.countries);
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

export const getFreeDrivePlan = (): ShortPlan => {
    return {
        plan: PLANS.FREE,
        title: PLAN_NAMES[PLANS.FREE],
        label: '',
        description: c('new_plans: info')
            .t`The no-cost starter account designed to empower everyone with privacy by default.`,
        cta: c('new_plans: action').t`Get ${BRAND_NAME} for free`,
        features: [getStorageFeature(-1), getNAddressesFeature({ n: 1 })],
    };
};

export const getVPNPlan = (plan: Plan, serversCount: VPNServersCountData): ShortPlan => {
    const plusServers = getPlusServers(serversCount.paid.servers, serversCount.paid.countries);
    return {
        plan: PLANS.VPN,
        title: plan.Title,
        label: '',
        description: c('new_plans: info')
            .t`The dedicated VPN solution that provides secure, unrestricted, high-speed access to the internet.`,
        cta: getCTA(plan.Title),
        features: [
            getCountries(plusServers),
            getVPNSpeed('highest'),
            getProtectDevices(VPN_CONNECTIONS),
            getStreaming(true),
            getP2P(true),
            getDoubleHop(true),
            getNetShield(true),
            getTor(true),
            getPrioritySupport(),
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
            getFoldersAndLabelsFeature('unlimited'),
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
            .t`Privacy and security suite for businesses, including all premium ${BRAND_NAME} services.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeatureB2B(plan.MaxSpace),
            getNAddressesFeatureB2B({ n: plan.MaxAddresses }),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getFoldersAndLabelsFeature('unlimited'),
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
            getFoldersAndLabelsFeature('unlimited'),
            getContactGroupsManagement(),
            getCalendarAppFeature(),
            getDriveAppFeature(),
            getB2BHighSpeedVPNConnections(),
            getNetShield(true),
            getSecureCore(true),
        ],
    };
};

export const getFamilyPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.FAMILY,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Protect your family’s privacy with all ${BRAND_NAME} services combined.`,
        cta: getCTA(plan.Title),
        features: [
            getUsersFeature(FAMILY_MAX_USERS),
            getStorageFeature(plan.MaxSpace, { family: true }),
            getNAddressesFeature({ n: plan.MaxAddresses, family: true }),
            getFoldersAndLabelsFeature(Number.POSITIVE_INFINITY),
            getNMessagesFeature(Number.POSITIVE_INFINITY),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getCalendarAppFeature({ family: true }),
            getDriveAppFeature({ family: true }),
            getVPNAppFeature({ family: true }),
            getSupport('priority'),
        ],
    };
};

export const getShortPlan = (
    plan: PLANS,
    plansMap: PlansMap,
    vpnServers: VPNServersCountData,
    options: { boldStorageSize?: boolean } = {},
    isPassPlusEnabled: boolean
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
            return getVPNPlan(planData, vpnServers);
        case PLANS.DRIVE:
            return getDrivePlan(planData, boldStorageSize);
        case PLANS.PASS_PLUS:
            return isPassPlusEnabled ? getPassPlan(planData) : null;
        case PLANS.MAIL_PRO:
            return getMailProPlan(planData);
        case PLANS.BUNDLE:
            return getBundlePlan(planData);
        case PLANS.BUNDLE_PRO:
            return getBundleProPlan(planData);
        case PLANS.NEW_VISIONARY:
            return getNewVisionaryPlan(planData);
        case PLANS.FAMILY:
            return getFamilyPlan(planData);
        default:
            return null;
    }
};
