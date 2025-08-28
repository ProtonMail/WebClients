import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { incomingEventLoopV6Thunk } from './incomingActions';
import { selectIncomingDelegatedAccess, selectOutgoingDelegatedAccess } from './index';
import { outgoingEventLoopV6Thunk } from './outgoingActions';

export const delegatedAccessLoop: CoreEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    const promises = [];
    if (event.IncomingDelegatedAccess?.length && selectIncomingDelegatedAccess(state)?.value) {
        promises.push(dispatch(incomingEventLoopV6Thunk({ event, api })));
    }
    if (event.OutgoingDelegatedAccess?.length && selectOutgoingDelegatedAccess(state)?.value) {
        promises.push(dispatch(outgoingEventLoopV6Thunk({ event, api })));
    }
    return Promise.all(promises);
};
