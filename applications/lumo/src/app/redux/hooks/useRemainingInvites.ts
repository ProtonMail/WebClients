import { createHooks } from '@proton/redux-utilities';

import { remainingInvitesThunk, selectRemainingInvites } from '../slices/meta/remainingInvites';

const hooks = createHooks(remainingInvitesThunk, selectRemainingInvites);

export const useRemainingInvites = hooks.useValue;
export const useGetRemainingInvites = hooks.useGet;
