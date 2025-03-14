/* eslint-disable no-console */
import { getPlanNameFromIDs } from '@proton/shared/lib/helpers/planIDs';

import { PLANS } from '../core/constants';
import { type PlanIDs } from '../core/interface';

// #region Example: Get plan name from planIDs object
const planIDs: PlanIDs = {
    [PLANS.MAIL]: 1,
};

const planName = getPlanNameFromIDs(planIDs);
console.assert(planName === PLANS.MAIL, 'planName should be PLANS.MAIL');
// #endregion
