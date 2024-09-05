import { withContext } from 'proton-pass-extension/app/worker/context/inject';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { clientReady } from '@proton/pass/lib/client';
import { createMessageBroker } from '@proton/pass/lib/extension/message/message-broker';
import { MessageVersionMismatchError } from '@proton/pass/lib/extension/message/send-message';
import { cacheRequest } from '@proton/pass/store/actions';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

/* For security reasons : limit the type of messages that
 * can be processed via externally connectable resources.
 * When we detect a popup port being disconnected : this
 * likely means the popup was closed : dispatch a cache request
 * in order to save the latest popup state */
const WorkerMessageBroker = createMessageBroker({
    allowExternal: [
        WorkerMessageType.ACCOUNT_EXTENSION,
        WorkerMessageType.ACCOUNT_FORK,
        WorkerMessageType.ACCOUNT_ONBOARDING,
        WorkerMessageType.ACCOUNT_PROBE,
    ],
    strictOriginCheck: [
        WorkerMessageType.ALIAS_CREATE,
        WorkerMessageType.ALIAS_OPTIONS,
        WorkerMessageType.AUTH_CHECK,
        WorkerMessageType.AUTH_UNLOCK,
        WorkerMessageType.AUTOFILL_IDENTITY,
        WorkerMessageType.AUTOFILL_LOGIN,
        WorkerMessageType.AUTOSAVE_REQUEST,
        WorkerMessageType.EXPORT_REQUEST,
        WorkerMessageType.IMPORT_DECRYPT,
        WorkerMessageType.LOG_REQUEST,
        WorkerMessageType.ONBOARDING_ACK,
        WorkerMessageType.ONBOARDING_REQUEST,
        WorkerMessageType.OTP_CODE_GENERATE,
        WorkerMessageType.PASSKEY_CREATE,
        WorkerMessageType.PASSKEY_GET,
        WorkerMessageType.POPUP_INIT,
    ],
    onError: withContext((ctx, err) => {
        if (err instanceof MessageVersionMismatchError) void ctx.service.activation.reload();
    }),
    onDisconnect: withContext((ctx, portName) => {
        const isPopup = portName.startsWith('popup');
        const hasRegisteredLock = ctx.authStore.getLockMode() !== LockMode.NONE;

        /** check if the client is ready before triggering this
         * cache request as we may be in an on-going boot */
        if (isPopup && clientReady(ctx.getState().status)) {
            ctx.service.store.dispatch(cacheRequest({ throttle: true }));
            if (hasRegisteredLock) ctx.service.auth.checkLock().catch(noop);
        }
    }),
});

export default WorkerMessageBroker;
