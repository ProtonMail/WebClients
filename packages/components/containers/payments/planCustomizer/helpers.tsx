import { c } from 'ttag';

import { type PlanIDs, getPlanNameFromIDs, getPlansWithAddons } from '@proton/payments';

export const getHasPlanCustomizer = (planIDs: PlanIDs) => {
    const planName = getPlanNameFromIDs(planIDs);
    if (!planName) {
        return false;
    }

    return getPlansWithAddons().includes(planName);
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
