import { PLANS } from '../core/constants';
import { type PlanIDs } from '../core/interface';
import { getPlanNameFromIDs } from '../core/plan/helpers';

// #region Example: Get plan name from planIDs object
const planIDs: PlanIDs = {
    [PLANS.MAIL]: 1,
};

const planName = getPlanNameFromIDs(planIDs);
console.assert(planName === PLANS.MAIL, 'planName should be PLANS.MAIL');
// #endregion
