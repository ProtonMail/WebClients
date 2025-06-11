import { createHooks } from '@proton/redux-utilities';

import { filtersThunk, selectFilters } from './index';

const hooks = createHooks(filtersThunk, selectFilters);

export const useFilters = hooks.useValue;
export const useGetFilters = hooks.useGet;
