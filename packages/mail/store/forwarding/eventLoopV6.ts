import type { MailEventLoopV6Callback } from '../mailEventLoop/interface';
import { incomingForwardingEventLoopV6Thunk, selectIncomingForwarding } from './incoming';
import { outgoingForwardingEventLoopV6Thunk, selectOutgoingForwarding } from './outgoing';

export const forwardingsLoop: MailEventLoopV6Callback = ({ event, state, dispatch, api }) => {
    const promises = [];

    if (event.IncomingForwardings?.length && selectIncomingForwarding(state).value) {
        promises.push(dispatch(incomingForwardingEventLoopV6Thunk({ event, api })));
    }

    if (event.OutgoingForwardings?.length && selectOutgoingForwarding(state).value) {
        promises.push(dispatch(outgoingForwardingEventLoopV6Thunk({ event, api })));
    }

    if (promises.length) {
        return Promise.all(promises);
    }
};
