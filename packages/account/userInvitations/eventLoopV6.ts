import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { selectUserInvitations, userInvitationsEventLoopV6Thunk } from './index';

export const userInvitationsLoops: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.UserInvitations?.length && selectUserInvitations(state)?.value) {
        return dispatch(userInvitationsEventLoopV6Thunk({ event, api }));
    }
};
