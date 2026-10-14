import { createHooks } from '@proton/redux-utilities/hooks';

import { allSubscriptionsThunk, selectAllSubscriptions } from './index';

const hooks = createHooks(allSubscriptionsThunk, selectAllSubscriptions);

export const useAllSubscriptions = hooks.useValue;
export const useGetAllSubscriptions = hooks.useGet;
