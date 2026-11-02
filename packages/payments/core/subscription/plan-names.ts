import { getPlanName } from '@proton/shared/lib/payments/subscription/helpers/plan-info';
import isTruthy from '@proton/utils/isTruthy';

import type { PLANS } from '../constants';
import type { Subscription } from './interface';

export const getPlanNamesOfSubscriptions = (
    subscriptions: Subscription[],
    planNameWithoutSubscriptions: PLANS
): PLANS[] => {
    if (subscriptions.length === 0) {
        return [planNameWithoutSubscriptions];
    }

    return subscriptions.map((subscription) => getPlanName(subscription)).filter(isTruthy);
};
