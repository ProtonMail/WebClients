import { createHooks } from '@proton/redux-utilities/hooks';

import { selectSubscription, subscriptionThunk } from './index';

const hooks = createHooks(subscriptionThunk, selectSubscription);

/** @deprecated Use useAllSubscriptions, or useEntitlementChecksForOrgAndUser to check what the user has. */
export const useSubscription = hooks.useValue;
export const useGetSubscription = hooks.useGet;
