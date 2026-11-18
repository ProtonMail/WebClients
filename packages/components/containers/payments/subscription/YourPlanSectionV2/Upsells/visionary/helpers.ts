import type { ReactNode } from 'react';

import { c } from 'ttag';

import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import { getPricePerCycle } from '@proton/payments/core/price-helpers';
import {
    getSubscriptionsArray,
    hasBundle,
    hasDeprecatedVPN,
    hasDuo,
    hasFamily,
    hasLumoAddon,
    hasMeetAddon,
    hasVPN2024,
    hasVPNPassBundle,
    hasVisionary,
    isManagedExternally,
} from '@proton/payments/core/subscription/helpers';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { APPS, BRAND_NAME, MAIL_SHORT_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { FreePlanDefault, Plan } from '@proton/shared/lib/payments/plan/interface';

import { getVersionHistory } from '../../../../features/drive';
import { getSentinel } from '../../../../features/highlights';
import { getProtonScribe } from '../../../../features/mail';
import { FREE_PASS_ALIASES, FREE_VAULTS, PASS_PLUS_VAULTS } from '../../../../features/pass';
import { getEarlyAccessFeature } from '../../../../features/plan';

export type VisionaryUpsellSubscriberPlan = 'vpnPlus' | 'vpnPassBundle' | 'unlimited' | 'duo' | 'family';

/**
 * Plan the subscriber holds, among the ones the Visionary upsell is offered to.
 * Meet and Lumo add-ons on top of these plans are allowed.
 */
export const getVisionaryUpsellSubscriberPlan = (
    subscription: MaybeFreeSubscription
): VisionaryUpsellSubscriberPlan | undefined => {
    if (hasVPN2024(subscription) || hasDeprecatedVPN(subscription)) {
        return 'vpnPlus';
    }
    if (hasVPNPassBundle(subscription)) {
        return 'vpnPassBundle';
    }
    if (hasBundle(subscription)) {
        return 'unlimited';
    }
    if (hasDuo(subscription)) {
        return 'duo';
    }
    if (hasFamily(subscription)) {
        return 'family';
    }
};

export const getIsVisionaryUpsellEligible = ({
    app,
    user,
    subscription,
    visionaryPlan,
}: {
    app: ProductParam;
    user: UserModel;
    subscription: MaybeFreeSubscription;
    visionaryPlan: Plan | undefined;
}): boolean => {
    if (app !== APPS.PROTONVPN_SETTINGS || user.isFree || !user.canPay) {
        return false;
    }

    if (!subscription || !isPaidSubscription(subscription)) {
        return false;
    }

    if (getSubscriptionsArray(subscription).length !== 1 || isManagedExternally(subscription)) {
        return false;
    }

    if (hasVisionary(subscription) || !getVisionaryUpsellSubscriberPlan(subscription)) {
        return false;
    }

    return !!getPricePerCycle(visionaryPlan, CYCLE.MONTHLY) && !!getPricePerCycle(visionaryPlan, CYCLE.YEARLY);
};

export type VisionaryUpsellLayout =
    /** Section heading, Unlimited and Visionary full cards side by side, then the VPN for Business banner */
    | 'fullPair'
    /** Cycle deals of the current plan, then compact Unlimited and Visionary cards side by side */
    | 'cycleDealsThenCompactPair'
    /** Group offer of the current plan and Visionary as compact cards side by side */
    | 'groupOfferPair'
    /** Offer of the current plan, then Visionary alone at full width in its compact form */
    | 'ownOfferThenVisionary';

const isLongCycle = (cycle: CYCLE | undefined) => cycle === CYCLE.YEARLY || cycle === CYCLE.TWO_YEARS;

export const getVisionaryUpsellLayout = (
    subscriberPlan: VisionaryUpsellSubscriberPlan,
    cycle: CYCLE | undefined
): VisionaryUpsellLayout => {
    switch (subscriberPlan) {
        case 'vpnPassBundle':
            return 'fullPair';
        case 'vpnPlus':
            return isLongCycle(cycle) ? 'fullPair' : 'cycleDealsThenCompactPair';
        case 'unlimited':
        case 'duo':
            return isLongCycle(cycle) ? 'groupOfferPair' : 'ownOfferThenVisionary';
        case 'family':
        default:
            return 'ownOfferThenVisionary';
    }
};

export interface UpgradeWindowPrice {
    currency: Currency;
    /** 12-month price, per month */
    pricePerMonth: number;
    /** Price of the monthly billing, struck through */
    monthlyPrice: number;
    /** Total billed every 12 months */
    yearlyTotal: number;
    /** Discount of the 12-month billing over the monthly one, in percent */
    discountPercent: number;
}

export const getUpgradeWindowPrice = (plan: Plan | undefined): UpgradeWindowPrice | undefined => {
    const monthlyPrice = getPricePerCycle(plan, CYCLE.MONTHLY);
    const yearlyTotal = getPricePerCycle(plan, CYCLE.YEARLY);
    if (!plan || !monthlyPrice || !yearlyTotal) {
        return;
    }

    const pricePerMonth = yearlyTotal / CYCLE.YEARLY;

    return {
        currency: plan.Currency,
        pricePerMonth,
        monthlyPrice,
        yearlyTotal,
        discountPercent: Math.round((1 - pricePerMonth / monthlyPrice) * 100),
    };
};

export type ComparisonRowId =
    | 'ultra-servers'
    | 'premium-apps'
    | 'meet-professional'
    | 'lumo-plus'
    | 'scribe'
    | 'new-services'
    | 'early-access'
    | 'storage'
    | 'vpn-devices'
    | 'sentinel'
    | 'users'
    | 'addresses'
    | 'domains'
    | 'calendars'
    | 'aliases'
    | 'vaults'
    | 'version-history';

/** `true` and `false` render as a check and a cross */
export type ComparisonValue = boolean | string;

export interface ComparisonRow {
    id: ComparisonRowId;
    label: ReactNode;
    tooltip?: string;
    current: ComparisonValue;
    offered: ComparisonValue;
}

export const VISIONARY_COMPARISON_ROWS: ComparisonRowId[] = [
    'ultra-servers',
    'premium-apps',
    'meet-professional',
    'lumo-plus',
    'scribe',
    'new-services',
    'early-access',
    'storage',
    'vpn-devices',
    'sentinel',
    'users',
    'addresses',
    'domains',
];

export const UNLIMITED_COMPARISON_ROWS: ComparisonRowId[] = [
    'premium-apps',
    'storage',
    'addresses',
    'calendars',
    'aliases',
    'vaults',
    'version-history',
];

export const getUltraServersTooltip = () =>
    c('Visionary upsell')
        .t`A higher-capacity tier of ${VPN_APP_NAME} servers: far fewer people share each one, and they use ${BRAND_NAME}-owned IP addresses. Quick Connect picks them automatically where available.`;

type ComparedPlan = VisionaryUpsellSubscriberPlan | 'visionary';

// translator: ${limit} is a storage size ("6 GB") or a number of users ("6")
const getUpToText = (limit: string) => c('Visionary upsell').t`Up to ${limit}`;

const hasPremiumApps = (plan: ComparedPlan) => plan !== 'vpnPlus' && plan !== 'vpnPassBundle';
const hasPremiumPass = (plan: ComparedPlan) => plan !== 'vpnPlus';

const getStorageValue = (comparedPlan: ComparedPlan, plan: Plan | undefined, freePlan: FreePlanDefault) => {
    if (!hasPremiumApps(comparedPlan) || !plan) {
        const freeStorage = humanSize({
            bytes: freePlan.MaxDriveRewardSpace + freePlan.MaxBaseRewardSpace,
            fraction: 0,
        });
        return getUpToText(freeStorage);
    }

    // The storage of Duo is slightly less than 2 TB, it's displayed as 2 TB everywhere
    const bytes = comparedPlan === 'duo' ? sizeUnits.TB * 2 : plan.MaxSpace;
    const storage = humanSize({ bytes, fraction: 0, unitOptions: { max: 'TB' } });
    return plan.MaxMembers > 1 ? c('Visionary upsell').t`${storage} shared` : storage;
};

const getVpnDevicesValue = (plan: Plan | undefined) => {
    if (!plan) {
        return false;
    }
    if (plan.MaxMembers > 1) {
        const devicesPerUser = Math.round(plan.MaxVPN / plan.MaxMembers);
        return c('Visionary upsell').t`${devicesPerUser} per user`;
    }
    return String(plan.MaxVPN);
};

const getUsersValue = (plan: Plan | undefined) => {
    const users = Math.max(plan?.MaxMembers ?? 1, 1);
    return users > 1 ? getUpToText(String(users)) : String(users);
};

const getCountValue = (n: number | undefined) => (n ? String(n) : false);

interface ComparedPlanDetails {
    comparedPlan: ComparedPlan;
    plan: Plan | undefined;
    hasMeet: boolean;
    hasLumo: boolean;
}

const getValue = (
    id: ComparisonRowId,
    { comparedPlan, plan, hasMeet, hasLumo }: ComparedPlanDetails,
    freePlan: FreePlanDefault
): ComparisonValue => {
    const isVisionary = comparedPlan === 'visionary';
    switch (id) {
        case 'ultra-servers':
        case 'new-services':
        case 'early-access':
            return isVisionary;
        case 'premium-apps':
            return hasPremiumApps(comparedPlan);
        case 'meet-professional':
            return isVisionary || hasMeet;
        case 'lumo-plus':
            return isVisionary || hasLumo;
        case 'scribe':
            return isVisionary || comparedPlan === 'duo' || comparedPlan === 'family';
        case 'sentinel':
            return hasPremiumApps(comparedPlan);
        case 'storage':
            return getStorageValue(comparedPlan, plan, freePlan);
        case 'vpn-devices':
            return getVpnDevicesValue(plan);
        case 'users':
            return getUsersValue(plan);
        case 'addresses':
            return getCountValue(Math.max(plan?.MaxAddresses ?? 0, freePlan.MaxAddresses));
        case 'domains':
            return getCountValue(plan?.MaxDomains);
        case 'calendars':
            return String(hasPremiumApps(comparedPlan) ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE);
        case 'aliases':
            return hasPremiumPass(comparedPlan) ? c('Visionary upsell').t`Unlimited` : String(FREE_PASS_ALIASES);
        case 'vaults':
            return String(hasPremiumPass(comparedPlan) ? PASS_PLUS_VAULTS : FREE_VAULTS);
        case 'version-history':
            return hasPremiumApps(comparedPlan)
                ? c('Visionary upsell').t`10 years`
                : c('Visionary upsell').t`Previous versions`;
    }
};

const getLabel = (id: ComparisonRowId): ReactNode => {
    switch (id) {
        case 'ultra-servers':
            return c('Visionary upsell').t`Ultra servers`;
        case 'premium-apps':
            return c('Visionary upsell').t`Premium Mail, Calendar, Drive and Pass`;
        case 'meet-professional':
            return `${BRAND_NAME} ${PLAN_NAMES[PLANS.MEET]}`;
        case 'lumo-plus':
            return `${BRAND_NAME} ${PLAN_NAMES[PLANS.LUMO]}`;
        case 'scribe':
            return getProtonScribe(true).text;
        case 'new-services':
            return c('Visionary upsell').t`New ${BRAND_NAME} services at no extra cost`;
        case 'early-access':
            return getEarlyAccessFeature().text;
        case 'storage':
            return c('Visionary upsell').t`Storage`;
        case 'vpn-devices':
            return c('Visionary upsell').t`VPN devices at once`;
        case 'sentinel':
            return getSentinel(true).text;
        case 'users':
            return c('Visionary upsell').t`Users`;
        case 'addresses':
            return c('Visionary upsell').t`Email addresses`;
        case 'domains':
            return c('Visionary upsell').t`Custom email domains`;
        case 'calendars':
            return c('Visionary upsell').t`Calendars`;
        case 'aliases':
            return c('Visionary upsell').t`Hide-my-email aliases`;
        case 'vaults':
            return c('Visionary upsell').t`Password vaults`;
        case 'version-history':
            return getVersionHistory().text;
    }
};

/**
 * Rows of the upgrade window table, comparing the subscriber's plan with the offered one.
 * Limits (storage, devices, users, addresses, domains) come from the plans service.
 */
export const getComparisonRows = ({
    offeredPlanName,
    subscriberPlan,
    subscription,
    currentPlan,
    offeredPlan,
    freePlan,
}: {
    offeredPlanName: PLANS.VISIONARY | PLANS.BUNDLE;
    subscriberPlan: VisionaryUpsellSubscriberPlan;
    subscription: MaybeFreeSubscription;
    currentPlan: Plan | undefined;
    offeredPlan: Plan | undefined;
    freePlan: FreePlanDefault;
}): ComparisonRow[] => {
    const isVisionary = offeredPlanName === PLANS.VISIONARY;
    const rowIds = isVisionary ? VISIONARY_COMPARISON_ROWS : UNLIMITED_COMPARISON_ROWS;

    const current: ComparedPlanDetails = {
        comparedPlan: subscriberPlan,
        plan: currentPlan,
        hasMeet: hasMeetAddon(subscription),
        hasLumo: hasLumoAddon(subscription),
    };
    const offered: ComparedPlanDetails = {
        comparedPlan: isVisionary ? 'visionary' : 'unlimited',
        plan: offeredPlan,
        hasMeet: false,
        hasLumo: false,
    };

    return rowIds.map((id) => ({
        id,
        label: getLabel(id),
        tooltip: id === 'ultra-servers' ? getUltraServersTooltip() : undefined,
        current: getValue(id, current, freePlan),
        offered: getValue(id, offered, freePlan),
    }));
};

export const getVisionaryCardDescription = () =>
    c('Visionary upsell')
        .t`Named after the crowdfunding supporters who made ${BRAND_NAME} ${MAIL_SHORT_APP_NAME} possible in 2014. Every premium ${BRAND_NAME} service, in one plan.`;

export const getUltraServersFeatureText = () => c('Visionary upsell').t`Ultra servers, reserved for you`;

/** The plan title is only "Visionary" */
export const getVisionaryTitle = () => `${BRAND_NAME} ${PLAN_NAMES[PLANS.VISIONARY]}`;

export const getSubscribersOnlyLabel = () => c('Visionary upsell').t`Subscribers only`;
