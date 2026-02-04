import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { groupOwnerInvitesEventLoopV6Thunk } from './index';

export const groupOwnerInvitesLoop: CoreEventLoopV6Callback = ({ event, dispatch }) => {
    if (event.GroupOwners?.length) {
        return dispatch(groupOwnerInvitesEventLoopV6Thunk({ event }));
    }
};
