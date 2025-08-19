import { CacheType } from '@proton/redux-utilities';
import noop from '@proton/utils/noop';

import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { groupMembershipsThunk } from '../groupMemberships';
import { groupMembersEventLoopV6Thunk } from './index';

export const groupMembersLoop: CoreEventLoopV6Callback = ({ event, dispatch, api }) => {
    if (event.GroupMembers?.length) {
        // Force refresh group memberships when group members are updated. This is due to the fact that:
        // 1) no group memberships are returned in the event loop.
        // 2) getting group members requires organization scope, so listening to that event loop v6 update doesn't work for free users.
        // This is done in a fire-and-forget way, so it's not a big deal if it fails.
        // This is a best effort `groupMembershipsListener` for event loop v6.
        dispatch(groupMembershipsThunk({ cache: CacheType.None })).catch(noop);

        return dispatch(groupMembersEventLoopV6Thunk({ event, api }));
    }
};
