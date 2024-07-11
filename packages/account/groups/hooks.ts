import { createHooks } from '@proton/redux-utilities';

import { groupThunk, selectGroups } from './index';

const hooks = createHooks(groupThunk, selectGroups);

export const useGroups = hooks.useValue;
export const useGetGroups = hooks.useGet;
