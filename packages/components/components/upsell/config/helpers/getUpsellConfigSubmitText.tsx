import { c } from 'ttag';

import { PLAN_NAMES, type PlanIDs } from '@proton/payments/index';
import { getPlanNameFromIDs } from '@proton/shared/lib/helpers/planIDs';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

export const getMailUpsellsSubmitText = ({ planIDs }: { planIDs: PlanIDs }) => {
    const planID = getPlanNameFromIDs(planIDs);

    if (planID === undefined) {
        return c('Action').t`Upgrade`;
    }

    const planName = PLAN_NAMES[planID];

    return getPlanOrAppNameText(planName);
};
