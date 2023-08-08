import { c } from 'ttag';

import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import { BRAND_NAME, FAMILY_MAX_USERS, PLANS, PLAN_NAMES, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';

import { getCalendarAppFeature, getNCalendarsFeature } from './calendar';
import { getDriveAppFeature, getStorageFeature, getStorageFeatureB2B } from './drive';
import { getSupport, getUsersFeature } from './highlights';
import { ShortPlan, ShortPlanLike } from './interface';
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
    FREE_VAULTS,
    PASS_PLUS_VAULTS,
    get2FAAuthenticator,
    getCustomFields,
    getDevices,
    getHideMyEmailAliases,
    getLoginsAndNotes,
    getPassAppFeature,
    getVaults,
} from './pass';
import {
    get24x7SupportVPNFeature,
    getAESEncryptionVPNFeature,
    getAutoConnectVPNFeature,
    getB2BHighSpeedVPNConnections,
    getBandwidth,
    getBrowserExtensionVPNFeature,
    getCensorshipCircumventionVPNFeature,
    getCentralControlPanelVPNFeature,
    getCountries,
    getDedicatedServersVPNFeature,
    getDoubleHop,
    getKillSwitch,
    getMultiPlatformSupportVPNFeature,
    getNetShield,
    getNoLogs,
    getP2P,
    getPrioritySupport,
    getPrivateGatewaysVPNFeature,
    getProtectDevices,
    getRequire2FAVPNFeature,
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
            getPassAppFeature(),
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
            getLoginsAndNotes(),
            getDevices(),
            getVaults(PASS_PLUS_VAULTS),
            getHideMyEmailAliases('unlimited'),
            get2FAAuthenticator(true),
            getCustomFields(true),
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
        features: [getLoginsAndNotes(), getDevices(), getVaults(FREE_VAULTS), getHideMyEmailAliases(FREE_PASS_ALIASES)],
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
            getPassAppFeature(),
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
            getPassAppFeature(),
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
            getPassAppFeature(),
            getSupport('priority'),
        ],
    };
};

export const getVPNProPlan = (plan: Plan, serversCount: VPNServersCountData | undefined): ShortPlan => {
    const plusServers = getPlusServers(serversCount?.paid.servers, serversCount?.paid.countries);
    return {
        plan: PLANS.VPN_PRO,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Safely access internet from anywhere with essential network monitoring`,
        cta: getCTA(plan.Title),
        features: [
            getCountries(plusServers),
            getAESEncryptionVPNFeature(),
            getBandwidth(),
            getCensorshipCircumventionVPNFeature(),
            getCentralControlPanelVPNFeature(),
            getKillSwitch(),
            getAutoConnectVPNFeature(),
            getMultiPlatformSupportVPNFeature(),
            get24x7SupportVPNFeature(),
        ],
    };
};

export const getVPNBusinessPlan = (plan: Plan, serversCount: VPNServersCountData | undefined): ShortPlan => {
    const plusServers = getPlusServers(serversCount?.paid.servers, serversCount?.paid.countries);
    return {
        plan: PLANS.VPN_BUSINESS,
        title: plan.Title,
        label: '',
        description: c('new_plans: info')
            .t`Advanced network security and access management with dedicated secure Gateways`,
        cta: getCTA(plan.Title),
        features: [
            getCountries(plusServers),
            getAESEncryptionVPNFeature(),
            getBandwidth(),
            getCensorshipCircumventionVPNFeature(),
            getCentralControlPanelVPNFeature(),
            getKillSwitch(),
            getAutoConnectVPNFeature(),
            getMultiPlatformSupportVPNFeature(),
            get24x7SupportVPNFeature(),
            getPrivateGatewaysVPNFeature(),
            getDedicatedServersVPNFeature(),
            getRequire2FAVPNFeature(),
            getNetShield(true),
            getBrowserExtensionVPNFeature(),
        ],
    };
};

export const getVPNEnterprisePlan = (serversCount: VPNServersCountData | undefined): ShortPlanLike => {
    const plusServers = getPlusServers(serversCount?.paid.servers, serversCount?.paid.countries);
    return {
        isPlanLike: true,
        plan: 'PLANS.VPN_ENTERPRISE',
        title: c('new_plans: Title').t`VPN Enterprise`,
        label: '',
        description: c('new_plans: info')
            .t`Tailor-made solutions for larger organizations with specific security needs`,
        features: [
            getCountries(plusServers),
            getAESEncryptionVPNFeature(),
            getBandwidth(),
            getCensorshipCircumventionVPNFeature(),
            getCentralControlPanelVPNFeature(),
            getKillSwitch(),
            getAutoConnectVPNFeature(),
            getMultiPlatformSupportVPNFeature(),
            get24x7SupportVPNFeature(),
            getPrivateGatewaysVPNFeature(),
            getDedicatedServersVPNFeature(),
            getRequire2FAVPNFeature(),
            getNetShield(true),
            getBrowserExtensionVPNFeature(),
        ],
    };
};

/**
 * Takes a plans map, a plan and some options and returns short visual plan details
 *
 * @param options.boldStorageSize Whether or not print the storage size in bold
 * @param options.vpnServers Details about vpn servers. WARNING: If this option is not provided, then VPN plan won't be returned
 */
export const getShortPlan = (
    plan: PLANS,
    plansMap: PlansMap,
    options: {
        boldStorageSize?: boolean;
        vpnServers?: VPNServersCountData;
    } = {}
) => {
    if (plan === PLANS.FREE) {
        return getFreePlan();
    }

    const planData = plansMap[plan];
    if (!planData) {
        return null;
    }

    const { vpnServers, boldStorageSize } = options;

    switch (plan) {
        case PLANS.MAIL:
            return getMailPlan(planData);
        case PLANS.VPN:
            return vpnServers && getVPNPlan(planData, vpnServers);
        case PLANS.DRIVE:
            return getDrivePlan(planData, boldStorageSize);
        case PLANS.PASS_PLUS:
            return getPassPlan(planData);
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
        case PLANS.VPN_PRO:
            return getVPNProPlan(planData, vpnServers);
        case PLANS.VPN_BUSINESS:
            return getVPNBusinessPlan(planData, vpnServers);
        default:
            return null;
    }
};
