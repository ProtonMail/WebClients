import { createHooks } from '@proton/redux-utilities';

import { selectSubscription, subscriptionThunk } from './index';

const hooks = createHooks(subscriptionThunk, selectSubscription);

export const useSubscription = hooks.useValue;
export const useGetSubscription = hooks.useGet;
