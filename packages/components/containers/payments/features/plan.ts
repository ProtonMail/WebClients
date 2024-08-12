import { c } from 'ttag';

import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import {
    BRAND_NAME,
    DUO_MAX_USERS,
    FAMILY_MAX_USERS,
    PLANS,
    PLAN_NAMES,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import type { FreePlanDefault, Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';
import isTruthy from '@proton/utils/isTruthy';

import { getRequire2FA, getSSOIntegration } from './b2b';
import { getCalendarAppFeature, getNCalendarsFeature } from './calendar';
import {
    getDriveAppFeature,
    getFreeDriveStorageFeature,
    getFreeMailStorageFeature,
    getStorageFeature,
    getStorageFeatureB2B,
} from './drive';
import { get24x7Support, getAdminPanel, getSentinel, getSupport, getUsersFeature } from './highlights';
import type { PlanCardFeatureDefinition, ShortPlan, ShortPlanLike } from './interface';
import {
    getContactGroupsManagement,
    getFoldersAndLabelsFeature,
    getMailAppFeature,
    getNAddressesFeature,
    getNAddressesFeatureB2B,
    getNDomainsFeature,
    getNMessagesFeature,
    getSMTPToken,
} from './mail';
import {
    FREE_PASS_ALIASES,
    FREE_VAULTS,
    FREE_VAULT_SHARING,
    PASS_BIZ_VAULTS,
    PASS_BIZ_VAULT_SHARING,
    PASS_PLUS_VAULTS,
    PASS_PLUS_VAULT_SHARING,
    PASS_PRO_VAULTS,
    PASS_PRO_VAULT_SHARING,
    get2FAAuthenticator,
    getCustomFields,
    getDataBreachMonitoring,
    getDevices,
    getDevicesAndAliases,
    getGroupManagement,
    getHideMyEmailAliases,
    getLoginsAndNotes,
    getPassAppFeature,
    getProtonPassFeature,
    getVaultSharing,
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
import {
    WALLET_PLUS_WALLETS,
    WALLET_PLUS_WALLET_ACCOUNTS,
    WALLET_PLUS_WALLET_EMAIL,
    getBitcoinViaEmail,
    getWalletAccounts,
    getWalletAppFeature,
    getWalletEmailAddresses,
    getWallets,
} from './wallet';

export const getAllAppsFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: info').t`All ${BRAND_NAME} apps and their premium features`,
        included: true,
    };
};

export const getEarlyAccessFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: info').t`Early access to new apps and features`,
        included: true,
    };
};

export const getCTA = (planName: string) => {
    return c('new_plans: action').t`Get ${planName}`;
};

export const getFreePlan = (freePlan: FreePlanDefault): ShortPlan => {
    return {
        plan: PLANS.FREE,
        title: PLAN_NAMES[PLANS.FREE],
        label: '',
        description: c('new_plans: info')
            .t`The no-cost starter account designed to empower everyone with privacy by default.`,
        cta: c('new_plans: action').t`Get ${BRAND_NAME} for free`,
        features: [
            getFreeMailStorageFeature(freePlan),
            getFreeDriveStorageFeature(freePlan),
            getNAddressesFeature({ n: 1 }),
            getFoldersAndLabelsFeature(3),
            getNMessagesFeature(150),
            getSupport('limited'),
        ],
    };
};

export const getBundlePlan = ({
    plan,
    vpnServersCountData,
    freePlan,
}: {
    freePlan: FreePlanDefault;
    plan: Plan;
    vpnServersCountData: VPNServersCountData;
}): ShortPlan => {
    return {
        plan: PLANS.BUNDLE,
        title: plan.Title,
        label: c('new_plans: info').t`Popular`,
        description: c('new_plans: info')
            .t`Comprehensive privacy and security with all ${BRAND_NAME} services combined.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeature(plan.MaxSpace, { freePlan }),
            getNAddressesFeature({ n: plan.MaxAddresses }),
            getFoldersAndLabelsFeature('unlimited'),
            getNMessagesFeature('unlimited'),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getSentinel(true),
            getSupport('priority'),
            getCalendarAppFeature(),
            getDriveAppFeature(),
            getVPNAppFeature({ serversCount: vpnServersCountData }),
            getPassAppFeature(),
        ],
    };
};

export const getDrivePlan = ({
    plan,
    boldStorageSize,
    freePlan,
}: {
    freePlan: FreePlanDefault;
    plan: Plan;
    boldStorageSize?: boolean;
}): ShortPlan => {
    return {
        plan: PLANS.DRIVE,
        title: plan.Title,
        label: '',
        description: c('new_plans: info')
            .t`Secure cloud storage that lets you store, sync, and share files easily and securely.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeature(plan.MaxSpace, { boldStorageSize, freePlan }),
            getNAddressesFeature({ n: plan.MaxAddresses || 1 }),
            getNCalendarsFeature(plan.MaxCalendars || MAX_CALENDARS_FREE),
            getVPNConnections(1),
            getSupport('priority'),
        ],
    };
};

export const getDriveBusinessPlan = ({
    plan,
}: {
    freePlan: FreePlanDefault;
    plan: Plan;
    boldStorageSize?: boolean;
}): ShortPlan => {
    return {
        plan: PLANS.DRIVE_BUSINESS,
        title: plan.Title,
        label: '',
        description: c('new_plans: info')
            .t`Protect sensitive business information and collaborate securely.asdfasdfsdf`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeatureB2B(plan.MaxSpace, { subtext: false, unit: 'TB' }),
            getNAddressesFeature({ n: plan.MaxAddresses || 1 }),
            getNCalendarsFeature(plan.MaxCalendars || MAX_CALENDARS_FREE),
            getVPNConnections(1),
            getSupport('priority'),
        ],
    };
};

export const getPassPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.PASS,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`For next-level password management and identity protection.`,
        cta: getCTA(plan.Title),
        features: [
            getLoginsAndNotes('paid'),
            getDevices(),
            getHideMyEmailAliases('unlimited'),
            getVaults(PASS_PLUS_VAULTS),
            getVaultSharing(PASS_PLUS_VAULT_SHARING),
            get2FAAuthenticator(true),
            getCustomFields(true),
            getSentinel(true),
            getSupport('priority'),
        ],
    };
};

export const getPassProPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.PASS_PRO,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Essential protection and secure collaboration for unlimited users.`,
        cta: getCTA(plan.Title),
        features: [
            getLoginsAndNotes('paid'),
            getDevices(),
            getHideMyEmailAliases('unlimited'),
            getVaults(PASS_PRO_VAULTS),
            getVaultSharing(PASS_PRO_VAULT_SHARING),
            get2FAAuthenticator(true),
            getCustomFields(true),
            getAdminPanel(),
            get24x7Support(),
            getDataBreachMonitoring(true),
        ],
    };
};

export const getPassBusinessPlan = (plan?: Plan): ShortPlan => {
    const title = plan?.Title || '';
    return {
        plan: PLANS.PASS_BUSINESS,
        title,
        label: '',
        description: c('new_plans: info').t`Advanced protection for teams that goes beyond industry standards.`,
        cta: getCTA(title),
        features: [
            getLoginsAndNotes('paid'),
            getDevices(),
            getHideMyEmailAliases('unlimited'),
            getVaults(PASS_BIZ_VAULTS),
            getVaultSharing(PASS_BIZ_VAULT_SHARING),
            get2FAAuthenticator(true),
            getCustomFields(true),
            getSentinel(true),
            getAdminPanel(),
            get24x7Support(),
            getRequire2FA(true),
            getSSOIntegration(true),
            getGroupManagement(true),
            getDataBreachMonitoring(true),
        ],
    };
};

export const getPassEssentialsSignupPlan = (plan?: Plan): ShortPlan => {
    const title = plan?.Title || '';
    return {
        plan: PLANS.PASS_PRO,
        title,
        label: '',
        description: '',
        cta: getCTA(title),
        features: [getLoginsAndNotes('paid'), getDevicesAndAliases(), get2FAAuthenticator(true)],
    };
};

export const getPassBusinessSignupPlan = (plan?: Plan): ShortPlan => {
    const title = plan?.Title || '';
    return {
        plan: PLANS.PASS_BUSINESS,
        title,
        label: '',
        description: '',
        cta: getCTA(title),
        features: [getSSOIntegration(true), getRequire2FA(true), getSentinel(true)],
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
        features: [
            getLoginsAndNotes('free'),
            getDevices(),
            getVaults(FREE_VAULTS),
            getVaultSharing(FREE_VAULT_SHARING),
            getHideMyEmailAliases(FREE_PASS_ALIASES),
        ],
    };
};

export const getMailPlan = ({ plan, freePlan }: { plan: Plan; freePlan: FreePlanDefault }): ShortPlan => {
    return {
        plan: PLANS.MAIL,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Secure email with advanced features for your everyday communications.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeature(plan.MaxSpace, { freePlan }),
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

export const getFreeDrivePlan = (freePlan: FreePlanDefault): ShortPlan => {
    return {
        plan: PLANS.FREE,
        title: PLAN_NAMES[PLANS.FREE],
        label: '',
        description: c('new_plans: info')
            .t`The no-cost starter account designed to empower everyone with privacy by default.`,
        cta: c('new_plans: action').t`Get ${BRAND_NAME} for free`,
        features: [getFreeDriveStorageFeature(freePlan), getNAddressesFeature({ n: 1 })],
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

export const getVPNPassPlan = (plan: Plan, serversCount: VPNServersCountData): ShortPlan => {
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
            getProtonPassFeature(),
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
        description: c('new_plans: info').t`Encrypted email and calendar to get you started.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeatureB2B(plan.MaxSpace, { subtext: false }),
            getNAddressesFeatureB2B({ n: plan.MaxAddresses }),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getFoldersAndLabelsFeature('unlimited'),
            getContactGroupsManagement(),
            getCalendarAppFeature(),
            getSMTPToken(true),
        ],
    };
};

export const getMailBusinessPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.MAIL_BUSINESS,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Enhanced security and premium features for teams.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeatureB2B(plan.MaxSpace, { subtext: false }),
            getNAddressesFeatureB2B({ n: plan.MaxAddresses }),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getFoldersAndLabelsFeature('unlimited'),
            getContactGroupsManagement(),
            getCalendarAppFeature(),
            getSMTPToken(true),
        ],
    };
};

export const getBundleProPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.BUNDLE_PRO_2024,
        title: plan.Title,
        label: '',
        description: c('new_plans: info')
            .t`All ${BRAND_NAME} business apps and premium features to protect your entire business.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeatureB2B(plan.MaxSpace, { subtext: false }),
            getNAddressesFeatureB2B({ n: plan.MaxAddresses }),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getSentinel(true),
            getFoldersAndLabelsFeature('unlimited'),
            getContactGroupsManagement(),
            getCalendarAppFeature(),
            getDriveAppFeature(),
            getPassAppFeature(),
            getB2BHighSpeedVPNConnections(),
            getNetShield(true),
            getSecureCore(true),
            getSMTPToken(true),
        ],
    };
};

export const getVisionaryPlan = ({
    serversCount,
    plan,
    freePlan,
    walletEnabled,
}: {
    serversCount: VPNServersCountData;
    plan: Plan;
    freePlan: FreePlanDefault;
    walletEnabled?: boolean;
}): ShortPlan => {
    const planName = plan.Title;
    return {
        plan: PLANS.VISIONARY,
        title: plan.Title,
        label: '',
        description: c('Subscription reminder')
            .t`${planName} gives you all apps, all features, early access to new releases, and everything you need to be in control of your data and its security.`,
        cta: getCTA(plan.Title),
        features: [
            getStorageFeature(plan.MaxSpace, { freePlan }),
            getUsersFeature(plan.MaxMembers),
            getEarlyAccessFeature(),
            getSentinel(true),
            getMailAppFeature(),
            getCalendarAppFeature(),
            getDriveAppFeature(),
            getPassAppFeature(),
            getVPNAppFeature({ serversCount, family: false }),
            walletEnabled && getWalletAppFeature(),
        ].filter(isTruthy),
    };
};

export const getFamilyPlan = ({
    freePlan,
    plan,
    serversCount,
}: {
    freePlan: FreePlanDefault;
    plan: Plan;
    serversCount: VPNServersCountData;
}): ShortPlan => {
    return {
        plan: PLANS.FAMILY,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Protect your family’s privacy with all ${BRAND_NAME} services combined.`,
        cta: getCTA(plan.Title),
        features: [
            getUsersFeature(FAMILY_MAX_USERS),
            getStorageFeature(plan.MaxSpace, { family: true, freePlan }),
            getNAddressesFeature({ n: plan.MaxAddresses, family: true }),
            getFoldersAndLabelsFeature(Number.POSITIVE_INFINITY),
            getNMessagesFeature(Number.POSITIVE_INFINITY),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getSentinel(true),
            getCalendarAppFeature({ family: true }),
            getDriveAppFeature({ family: true }),
            getVPNAppFeature({
                family: true,
                serversCount,
            }),
            getPassAppFeature(),
            getSupport('priority'),
            getSMTPToken(true),
        ],
    };
};

export const getDuoPlan = ({
    freePlan,
    plan,
    serversCount,
}: {
    freePlan: FreePlanDefault;
    plan: Plan;
    serversCount: VPNServersCountData;
}): ShortPlan => {
    return {
        plan: PLANS.DUO,
        title: plan.Title,
        label: '',
        description: c('new_plans: info').t`Unlimited privacy and more storage for up to 2 people.`,
        cta: getCTA(plan.Title),
        features: [
            getUsersFeature(DUO_MAX_USERS),
            getStorageFeature(plan.MaxSpace, { duo: true, freePlan }),
            getNAddressesFeature({ n: plan.MaxAddresses, duo: true }),
            getFoldersAndLabelsFeature(Number.POSITIVE_INFINITY),
            getNMessagesFeature(Number.POSITIVE_INFINITY),
            getNDomainsFeature({ n: plan.MaxDomains }),
            getSentinel(true),
            getCalendarAppFeature({ duo: true }),
            getDriveAppFeature({ duo: true }),
            getVPNAppFeature({
                duo: true,
                serversCount,
            }),
            getPassAppFeature(),
            getSupport('priority'),
            getSMTPToken(true),
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

export const getWalletPlan = (plan: Plan): ShortPlan => {
    return {
        plan: PLANS.WALLET,
        title: plan.Title,
        label: '',
        description: c('wallet_signup_2024: Info').t`A safer way to hold your Bitcoin`,
        cta: getCTA(plan.Title),
        features: [
            getWallets(WALLET_PLUS_WALLETS),
            getWalletAccounts(WALLET_PLUS_WALLET_ACCOUNTS),
            getWalletEmailAddresses(WALLET_PLUS_WALLET_EMAIL),
            getBitcoinViaEmail(),
            getSentinel(true),
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
        vpnServers: VPNServersCountData;
        freePlan: FreePlanDefault;
    }
) => {
    if (plan === PLANS.FREE) {
        return getFreePlan(options.freePlan);
    }

    const planData = plansMap[plan];
    if (!planData) {
        return null;
    }

    const { vpnServers, boldStorageSize, freePlan } = options;

    switch (plan) {
        case PLANS.MAIL:
            return getMailPlan({ plan: planData, freePlan });
        case PLANS.VPN:
        case PLANS.VPN2024:
            return getVPNPlan(planData, vpnServers);
        case PLANS.VPN_PASS_BUNDLE:
            return getVPNPassPlan(planData, vpnServers);
        case PLANS.DRIVE:
            return getDrivePlan({ plan: planData, boldStorageSize, freePlan });
        case PLANS.DRIVE_BUSINESS:
            return getDriveBusinessPlan({ plan: planData, boldStorageSize, freePlan });
        case PLANS.PASS:
            return getPassPlan(planData);
        case PLANS.MAIL_PRO:
            return getMailProPlan(planData);
        case PLANS.MAIL_BUSINESS:
            return getMailBusinessPlan(planData);
        case PLANS.BUNDLE:
            return getBundlePlan({ plan: planData, vpnServersCountData: vpnServers, freePlan });
        case PLANS.BUNDLE_PRO:
        case PLANS.BUNDLE_PRO_2024:
            return getBundleProPlan(planData);
        case PLANS.VISIONARY:
            return getVisionaryPlan({ serversCount: vpnServers, plan: planData, freePlan });
        case PLANS.FAMILY:
            return getFamilyPlan({ plan: planData, serversCount: vpnServers, freePlan });
        case PLANS.DUO:
            return getDuoPlan({ plan: planData, serversCount: vpnServers, freePlan });
        case PLANS.VPN_PRO:
            return getVPNProPlan(planData, vpnServers);
        case PLANS.VPN_BUSINESS:
            return getVPNBusinessPlan(planData, vpnServers);
        case PLANS.PASS_PRO:
            return getPassProPlan(planData);
        case PLANS.PASS_BUSINESS:
            return getPassBusinessPlan(planData);
        case PLANS.WALLET:
            return getWalletPlan(planData);
        default:
            return null;
    }
};
