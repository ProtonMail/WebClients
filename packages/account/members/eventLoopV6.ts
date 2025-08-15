import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { membersEventLoopV6Thunk, selectMembers } from './index';

export const membersLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.Members?.length && selectMembers(state)?.value) {
        return dispatch(membersEventLoopV6Thunk({ event, api }));
    }
};
