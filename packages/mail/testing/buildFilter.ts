import { FILTER_STATUS } from '@proton/shared/lib/constants';
import type { Filter } from '@proton/sieve/filterModel';

export const buildFilter = (value?: Partial<Filter>): Filter => {
    return {
        ID: 'filter-id',
        Name: 'Filter',
        Status: FILTER_STATUS.ENABLED,
        Priority: 1,
        Version: 2,
        Simple: undefined,
        Sieve: 'require ["fileinto"];',
        Tree: undefined,
        ...value,
    };
};
