import type { Filter } from '@proton/components/containers/filters/interfaces';

import { FILTER_STATUS, FREE_USER_ACTIVE_FILTERS_LIMIT } from '../constants';
import type { UserModel } from '../interfaces';

export const hasReachedFiltersLimit = (user: UserModel, userFilters: Filter[]) => {
    const enabledFiltersLength = userFilters.filter((filter) => filter.Status === FILTER_STATUS.ENABLED).length;
    return !user.hasPaidMail && enabledFiltersLength >= FREE_USER_ACTIVE_FILTERS_LIMIT;
};
