import { createHooks } from '@proton/redux-utilities';

import { selectUserEligibility, userEligibilityThunk } from '../slices';

const hooks = createHooks(userEligibilityThunk, selectUserEligibility);

export const useUserEligibility = hooks.useValue;
export const useGetUserEligibility = hooks.useGet;
