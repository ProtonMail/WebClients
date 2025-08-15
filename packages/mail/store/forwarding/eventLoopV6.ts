import type { MailEventLoopV6Callback } from '../mailEventLoop/interface';
import {
    incomingForwardingEventLoopV6Thunk,
    outgoingForwardingEventLoopV6Thunk,
    selectIncomingForwarding,
    selectOutgoingForwarding,
} from './index';

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
