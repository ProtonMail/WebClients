import { createMessageBroker } from '@proton/pass/extension/message';
import { stateCache } from '@proton/pass/store';
import { WorkerMessageType } from '@proton/pass/types';

import store from './store';

/* For security reasons : limit the type of messages that
 * can be processed via externally connectable resources.
 * When we detect a popup port being disconnected : this
 * likely means the popup was closed : dispatch a cache request
 * in order to save the latest popup state */
const WorkerMessageBroker = createMessageBroker({
    allowExternal: [
        WorkerMessageType.ACCOUNT_FORK,
        WorkerMessageType.ACCOUNT_EXTENSION,
        WorkerMessageType.ACCOUNT_PROBE,
        WorkerMessageType.ACCOUNT_ONBOARDING,
    ],
    onDisconnect: (portName) => portName.startsWith('popup') && store.dispatch(stateCache()),
});

export default WorkerMessageBroker;
