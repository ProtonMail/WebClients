import { createMessageBroker } from '@proton/pass/lib/extension/message';
import { stateCache } from '@proton/pass/store/actions';
import { SessionLockStatus, WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { withContext } from './context';
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
        WorkerMessageType.UNLOCK_REQUEST,
    ],
    onDisconnect: withContext((ctx, portName) => {
        const isPopup = portName.startsWith('popup');
        const hasRegisteredLock = ctx.authStore.getLockStatus() === SessionLockStatus.REGISTERED;

        if (isPopup) {
            store.dispatch(stateCache());
            if (hasRegisteredLock) ctx.service.auth.checkLock().catch(noop);
        }
    }),
});

export default WorkerMessageBroker;
