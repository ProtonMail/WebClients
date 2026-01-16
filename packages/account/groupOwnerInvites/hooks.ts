import { createHooks } from '@proton/redux-utilities';

import { groupOwnerInvitesThunk, selectGroupOwnerInvites } from './index';

const hooks = createHooks(groupOwnerInvitesThunk, selectGroupOwnerInvites);

export const useGroupOwnerInvites = hooks.useValue;
export const useGetGroupOwnerInvites = hooks.useGet;
