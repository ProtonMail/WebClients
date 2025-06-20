import { c } from 'ttag';

import { type PLANS, PLAN_TYPES, type PlanIDs, type PlansMap, getPlansWithAddons } from '@proton/payments';

export const getHasPlanCustomizer = ({ plansMap, planIDs }: { plansMap: PlansMap; planIDs: PlanIDs }) => {
    const [currentPlanName] =
        Object.entries(planIDs).find(([planName, planQuantity]) => {
            if (planQuantity) {
                const plan = plansMap[planName as keyof PlansMap];
                return plan?.Type === PLAN_TYPES.PLAN;
            }
            return false;
        }) || [];
    const currentPlan = plansMap?.[currentPlanName as keyof PlansMap];

    const hasPlanCustomizer = !!currentPlan && !!getPlansWithAddons().includes(currentPlan.Name as PLANS);

    return { currentPlan, hasPlanCustomizer };
};

// translator: This string is a part of a larger string asking the user to "contact" our sales team => full sentence: Should you need more than ${maxUsers} user accounts, please <contact> our Sales team
const contactString = c('plan customizer, users').t`contact`;
export const contactHref = (
    <a key={1} href="mailto:enterprise@proton.me">
        {contactString}
    </a>
);

export type DecreaseBlockedReason = 'forbidden-modification';

export type IncreaseBlockedReason = 'trial-limit';
