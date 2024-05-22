import { createHooks } from '@proton/redux-utilities';

import { memberThunk, selectMember } from './index';

const hooks = createHooks(memberThunk, selectMember);

export const useMember = hooks.useValue;
export const useGetMember = hooks.useGet;
