import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { groupMembersEventLoopV6Thunk } from './index';

export const groupMembersLoop: CoreEventLoopV6Callback = ({ event, dispatch, api }) => {
    if (event.GroupMembers?.length) {
        return dispatch(groupMembersEventLoopV6Thunk({ event, api }));
    }
};
