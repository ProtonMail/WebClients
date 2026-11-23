import { createHooks } from '@proton/redux-utilities/hooks';

import { getPlansThunk, selectPlans } from './index';

const hooks = createHooks(getPlansThunk, selectPlans);

export const usePlans = hooks.useValue;
export const useGetPlans = hooks.useGet;
