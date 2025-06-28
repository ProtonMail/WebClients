import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { createMessageBroker } from 'proton-pass-extension/lib/message/message-broker';
import { MessageVersionMismatchError } from 'proton-pass-extension/lib/message/send-message';
import { isPagePort, isPopupPort, tabIDFromPortName } from 'proton-pass-extension/lib/utils/port';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { clientReady } from '@proton/pass/lib/client';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { cacheRequest } from '@proton/pass/store/actions';
import { requestCancel } from '@proton/pass/store/request/actions';
import { selectPendingPopupRequests, selectPendingSettingsRequests } from '@proton/pass/store/selectors/extension';
import { or } from '@proton/pass/utils/fp/predicates';
import { logId, logger } from '@proton/pass/utils/logger';
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
        WorkerMessageType.LOG_REQUEST,
        WorkerMessageType.SPOTLIGHT_ACK,
        WorkerMessageType.SPOTLIGHT_REQUEST,
        WorkerMessageType.OTP_CODE_GENERATE,
        WorkerMessageType.PASSKEY_CREATE,
        WorkerMessageType.PASSKEY_GET,
        WorkerMessageType.POPUP_INIT,
    ],
    onError: withContext((ctx, err) => {
        if (err instanceof MessageVersionMismatchError) void ctx.service.activation.reload();
    }),
    onDisconnect: withContext((ctx, portName) => {
        const isPopup = isPopupPort(portName);
        const isPage = isPagePort(portName);
        const invalidate: string[] = [];

        if (isPage || isPopup) {
            /** If no remaining page or popup ports we can safely clear the storage */
            const remaining = WorkerMessageBroker.ports.query(or(isPopupPort, isPagePort));
            if (remaining.length === 0) void fileStorage.clearAll();

            if (clientReady(ctx.getState().status)) {
                const tabId = tabIDFromPortName(portName);
                const state = ctx.service.store.getState();

                /** check if the client is ready before triggering this
                 * cache request as we may be in an on-going boot */
                if (isPopup) {
                    invalidate.push(...selectPendingPopupRequests(tabId)(state));
                    ctx.service.store.dispatch(cacheRequest({ throttle: true }));
                    const hasRegisteredLock = ctx.authStore.getLockMode() !== LockMode.NONE;
                    if (hasRegisteredLock) ctx.service.auth.checkLock().catch(noop);
                }

                if (isPage) invalidate.push(...selectPendingSettingsRequests(tabId)(state));

                invalidate.forEach((requestID) => {
                    logger.info(`[MessageBroker] Invalidating ${logId(requestID)} for tab#${tabId}`);
                    ctx.service.store.dispatch(requestCancel(requestID));
                });
            }
        }
    }),
});

export default WorkerMessageBroker;
