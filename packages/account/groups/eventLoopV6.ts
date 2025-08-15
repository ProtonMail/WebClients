import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { groupsEventLoopV6Thunk, selectGroups } from './index';

export const groupsLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    if (event.Groups && selectGroups(state).value) {
        return dispatch(groupsEventLoopV6Thunk({ event, api }));
    }
};
