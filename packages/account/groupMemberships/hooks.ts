import { createHooks } from '@proton/redux-utilities';

import { groupMembershipsThunk, selectGroupMemberships } from './index';

const hooks = createHooks(groupMembershipsThunk, selectGroupMemberships);

export const useGroupMemberships = hooks.useValue;
export const useGetGroupMemberships = hooks.useGet;
