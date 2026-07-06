import { c } from 'ttag';

import { PLAN_NAMES } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import { getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

export const getUpsellModalSubmitText = ({ planIDs }: { planIDs: PlanIDs }) => {
    const planID = getPlanNameFromIDs(planIDs);

    if (planID === undefined) {
        return c('Action').t`Upgrade`;
    }

    const planName = PLAN_NAMES[planID];

    return getPlanOrAppNameText(planName);
};
