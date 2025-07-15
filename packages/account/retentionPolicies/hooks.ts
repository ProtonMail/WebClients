import { createHooks } from '@proton/redux-utilities';

import { retentionPoliciesThunk, selectRetentionPolicies } from './index';

const hooks = createHooks(retentionPoliciesThunk, selectRetentionPolicies);

export const useRetentionPolicies = hooks.useValue;
export const useGetRetentionPolicies = hooks.useGet;
