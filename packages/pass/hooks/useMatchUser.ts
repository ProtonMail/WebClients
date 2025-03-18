import { useSelector } from 'react-redux';

import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectPassPlan, selectUserPlan } from '@proton/pass/store/selectors';
import { notIn } from '@proton/pass/utils/fp/predicates';

type MatchUserOptions = {
    paid?: boolean;
    planDisplayName?: string[];
    planInternalName?: string[];
};

export const useMatchUser = (options: MatchUserOptions): boolean => {
    const plan = useSelector(selectUserPlan);
    const passPlan = useSelector(selectPassPlan);

    if (!plan) return false;
    if (options.paid && !isPaidPlan(passPlan)) return false;
    if (options.planDisplayName && notIn(options.planDisplayName)(plan.DisplayName)) return false;
    return !(options.planInternalName && notIn(options.planInternalName)(plan.InternalName));
};
