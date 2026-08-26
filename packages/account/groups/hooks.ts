import { createHooks } from '@proton/redux-utilities/hooks';

import { groupThunk, selectGroups } from './index';

const hooks = createHooks(groupThunk, selectGroups);

export const useGroups = hooks.useValue;
