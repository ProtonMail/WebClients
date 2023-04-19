import { Filter } from '@proton/components/containers/filters/interfaces';
import { FILTER_STATUS, FREE_USER_ACTIVE_FILTERS_LIMIT } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';

export const hasReachedFiltersLimit = (user: UserModel, userFilters: Filter[]) => {
    const { hasPaidMail } = user;

    const enabledFilters = userFilters.filter((filter) => filter.Status === FILTER_STATUS.ENABLED);

    return !hasPaidMail && enabledFilters.length >= FREE_USER_ACTIVE_FILTERS_LIMIT;
};
