import { useSelector } from 'react-redux';

import { isB2BUser } from '../lib/user/user.predicates';
import { selectUser, selectUserPlan } from '../store/selectors/user';
import { PassFeature } from '../types/api/features';
import { useFeatureFlag } from './useFeatureFlag';

/** Single gate for the softer upsell introduced by `PassLessAggressiveUpsell`:
 * navbar upgrade button removed, menu button replaced by a benefits card.
 *
 * B2C only - B2B keeps the current upsell, including an organization that has
 * been downgraded to free. See `isB2BUser` for how the two are told apart. */
export const useLessAggressiveUpsell = (): boolean => {
    const enabled = useFeatureFlag(PassFeature.PassLessAggressiveUpsell);
    const user = useSelector(selectUser);
    const plan = useSelector(selectUserPlan);

    return enabled && !isB2BUser(user, plan);
};
