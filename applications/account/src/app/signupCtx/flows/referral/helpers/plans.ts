import type { AppIntent } from '@proton/components/containers/login/interface';
import { CYCLE, PLANS, type PlanIDs } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';

import getAvailablePlansWithCycles from '../../../helpers/getAvailablePlansWithCycles';

type ReferralSelectedPlan = {
    planIDs: PlanIDs;
    requiresPaymentMethod?: boolean;
};

export const unlimited: ReferralSelectedPlan = {
    planIDs: { [PLANS.BUNDLE]: 1 },
    requiresPaymentMethod: true,
};

const mailPlus: ReferralSelectedPlan = {
    planIDs: { [PLANS.MAIL]: 1 },
};

const drivePlus: ReferralSelectedPlan = {
    planIDs: { [PLANS.DRIVE]: 1 },
};

const passPlus: ReferralSelectedPlan = {
    planIDs: { [PLANS.PASS]: 1 },
};

const vpnPlus: ReferralSelectedPlan = {
    planIDs: { [PLANS.VPN2024]: 1 },
    requiresPaymentMethod: true,
};

export type SupportedReferralPlans = PLANS.BUNDLE | PLANS.MAIL | PLANS.DRIVE | PLANS.PASS | PLANS.VPN2024;

const referralPlanMap: Record<SupportedReferralPlans, ReferralSelectedPlan> = {
    [PLANS.BUNDLE]: unlimited,
    [PLANS.MAIL]: mailPlus,
    [PLANS.DRIVE]: drivePlus,
    [PLANS.PASS]: passPlus,
    [PLANS.VPN2024]: vpnPlus,
};

/**
 * Trial plans require payment token
 */
export const plansRequiringPaymentToken: SupportedReferralPlans[] = Object.entries(referralPlanMap)
    .filter(([, { requiresPaymentMethod }]) => requiresPaymentMethod)
    .map(([plan]) => plan as SupportedReferralPlans);

export const autoRenewingPlans: SupportedReferralPlans[] = Object.entries(referralPlanMap)
    .filter(([, { requiresPaymentMethod }]) => requiresPaymentMethod)
    .map(([plan]) => plan as SupportedReferralPlans);

export const getReferralSelectedPlan = (plan: SupportedReferralPlans | undefined): ReferralSelectedPlan => {
    if (!plan || !(plan in referralPlanMap)) {
        return referralPlanMap[PLANS.BUNDLE];
    }

    return referralPlanMap[plan];
};

export const REFERRAL_DEAFULT_CYCLE = CYCLE.YEARLY;
export const REFERRAL_DEFAULT_PLAN = PLANS.BUNDLE;

export const availableReferralPlans = getAvailablePlansWithCycles(
    [unlimited, mailPlus, drivePlus, passPlus, vpnPlus],
    [REFERRAL_DEAFULT_CYCLE]
);

export const getAppIntentFromReferralPlan = (plan: PLANS): AppIntent | undefined => {
    if (plan === PLANS.MAIL) {
        return { app: APPS.PROTONMAIL };
    }
    if (plan === PLANS.DRIVE) {
        return { app: APPS.PROTONDRIVE };
    }
    if (plan === PLANS.PASS) {
        return { app: APPS.PROTONPASS };
    }
    if (plan === PLANS.VPN2024) {
        return { app: APPS.PROTONVPN_SETTINGS };
    }

    return undefined;
};
