import { createHooks } from '@proton/redux-utilities';

import { selectUserInvitations, userInvitationsThunk } from './index';

const hooks = createHooks(userInvitationsThunk, selectUserInvitations);

export const useUserInvitations = hooks.useValue;
export const useGetUserInvitations = hooks.useGet;
