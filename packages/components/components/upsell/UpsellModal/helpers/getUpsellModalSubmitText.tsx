import { c } from 'ttag';

import { PLAN_NAMES, type PlanIDs, getPlanNameFromIDs } from '@proton/payments';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

export const getUpsellModalSubmitText = ({ planIDs }: { planIDs: PlanIDs }) => {
    const planID = getPlanNameFromIDs(planIDs);

    if (planID === undefined) {
        return c('Action').t`Upgrade`;
    }

    const planName = PLAN_NAMES[planID];

    return getPlanOrAppNameText(planName);
};
