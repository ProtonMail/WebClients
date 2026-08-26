import { createHooks } from '@proton/redux-utilities/hooks';

import { mspSubsidiariesThunk, selectMspSubsidiaries } from './index';

const hooks = createHooks(mspSubsidiariesThunk, selectMspSubsidiaries);

export const useMspSubsidiaries = hooks.useValue;
