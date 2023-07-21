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
    strictOriginCheck: [
        WorkerMessageType.ACTIVITY_PROBE,
        WorkerMessageType.ALIAS_CREATE,
        WorkerMessageType.ALIAS_OPTIONS,
        WorkerMessageType.AUTOFILL_SELECT,
        WorkerMessageType.AUTOSAVE_REQUEST,
        WorkerMessageType.EXPORT_REQUEST,
        WorkerMessageType.EXPORT_DECRYPT,
        WorkerMessageType.LOG_REQUEST,
        WorkerMessageType.ONBOARDING_ACK,
        WorkerMessageType.ONBOARDING_REQUEST,
        WorkerMessageType.OTP_CODE_GENERATE,
        WorkerMessageType.POPUP_INIT,
        WorkerMessageType.SESSION_RESUMED,
        WorkerMessageType.UNLOCK_REQUEST,
    ],
    onDisconnect: (portName) => portName.startsWith('popup') && store.dispatch(stateCache()),
});

export default WorkerMessageBroker;
