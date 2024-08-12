import { c } from 'ttag';

import { PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import type { PlanIDs, PlansMap } from '@proton/shared/lib/interfaces';

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
    const hasPlanCustomizer = Boolean(
        currentPlan &&
            [
                PLANS.MAIL_PRO,
                PLANS.MAIL_BUSINESS,
                PLANS.DRIVE_PRO,
                PLANS.DRIVE_BUSINESS,
                PLANS.BUNDLE_PRO,
                PLANS.BUNDLE_PRO_2024,
                PLANS.ENTERPRISE,
                PLANS.VPN_PRO,
                PLANS.VPN_BUSINESS,
                PLANS.PASS_PRO,
                PLANS.PASS_BUSINESS,
            ].includes(currentPlan.Name as PLANS)
    );
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
