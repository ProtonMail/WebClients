import { createHooks } from '@proton/redux-utilities/hooks';

import { plansThunk, selectPlans } from './index';

const hooks = createHooks(plansThunk, selectPlans);

export const usePlans = hooks.useValue;
export const useGetPlans = hooks.useGet;
