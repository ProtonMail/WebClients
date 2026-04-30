import { createHooks } from '@proton/redux-utilities/hooks';

import { membersThunk, selectMembers } from './index';

const hooks = createHooks(membersThunk, selectMembers);

export const useMembers = hooks.useValue;
export const useGetMembers = hooks.useGet;
