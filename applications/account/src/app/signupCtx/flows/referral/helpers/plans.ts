import { type AppIntent } from '@proton/components/containers/login/interface';
import { CYCLE, type Cycle, PLANS, type PlanIDs } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';

import { type AvailablePlan } from '../../../context/SignupContext';

type ReferralSelectedPlan = {
    planIDs: PlanIDs;
    trial?: boolean;
};

export const unlimited: ReferralSelectedPlan = {
    planIDs: { [PLANS.BUNDLE]: 1 },
    trial: true,
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
    trial: true,
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
    .filter(([, { trial }]) => trial)
    .map(([plan]) => plan as SupportedReferralPlans);

export const getReferralSelectedPlan = (plan: SupportedReferralPlans | undefined): ReferralSelectedPlan => {
    if (!plan || !(plan in referralPlanMap)) {
        return referralPlanMap[PLANS.BUNDLE];
    }

    return referralPlanMap[plan];
};

export const getAvailablePlansWithCycles = (plans: { planIDs: PlanIDs }[], cycles: Cycle[]): AvailablePlan[] => {
    const availablePlans: AvailablePlan[] = [];

    cycles.forEach((cycle) => {
        plans.forEach(({ planIDs }) => {
            availablePlans.push({ planIDs, cycle });
        });
    });

    return availablePlans;
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
