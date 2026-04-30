import { createHooks } from '@proton/redux-utilities/hooks';

import { memberThunk, selectMember } from './index';

const hooks = createHooks(memberThunk, selectMember);

export const useMember = hooks.useValue;
export const useGetMember = hooks.useGet;
