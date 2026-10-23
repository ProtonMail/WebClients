import { c } from 'ttag';

import { PLAN_NAMES } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import { getPlanNameFromIDs } from '@proton/shared/lib/payments/plan/helpers';

export const getUpsellModalSubmitText = ({ planIDs }: { planIDs: PlanIDs }) => {
    const planID = getPlanNameFromIDs(planIDs);

    if (planID === undefined) {
        return c('Action').t`Upgrade`;
    }

    const planName = PLAN_NAMES[planID];

    return getPlanOrAppNameText(planName);
};
