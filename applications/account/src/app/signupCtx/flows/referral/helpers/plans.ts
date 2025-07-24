import { type AppIntent } from '@proton/components/containers/login/interface';
import { CYCLE, type Cycle, PLANS, type PlanIDs } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';

import { type AvailablePlan } from '../../../context/SignupContext';

export const unlimited: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.BUNDLE]: 1 },
};

const mailPlus: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.MAIL]: 1 },
};

const drivePlus: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.DRIVE]: 1 },
};

const passPlus: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.PASS]: 1 },
};

const vpnPlus: { planIDs: PlanIDs } = {
    planIDs: { [PLANS.VPN2024]: 1 },
};

type SupportedReferralPlans = PLANS.BUNDLE | PLANS.MAIL | PLANS.DRIVE | PLANS.PASS | PLANS.VPN2024;

const referralPlanMap: Record<SupportedReferralPlans, PlanIDs> = {
    [PLANS.BUNDLE]: unlimited.planIDs,
    [PLANS.MAIL]: mailPlus.planIDs,
    [PLANS.DRIVE]: drivePlus.planIDs,
    [PLANS.PASS]: passPlus.planIDs,
    [PLANS.VPN2024]: vpnPlus.planIDs,
};

export const getReferralPlanIDsFromPlan = (plan: PLANS | undefined): PlanIDs => {
    if (!plan || !(plan in referralPlanMap)) {
        return {};
    }

    return referralPlanMap[plan as SupportedReferralPlans];
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
