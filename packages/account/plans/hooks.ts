import { createHooks } from '@proton/redux-utilities';

import { plansThunk, selectPlans } from './index';

const hooks = createHooks(plansThunk, selectPlans, { periodic: true });

export const usePlans = hooks.useValue;
export const useGetPlans = hooks.useGet;
