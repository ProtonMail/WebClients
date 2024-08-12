import { useEffect, useRef } from 'react';

import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import type { MessageWithSenderFactory } from '@proton/pass/lib/extension/message';
import { sendMessage } from '@proton/pass/lib/extension/message';
import type {
    AppState,
    ClientEndpoint,
    TabId,
    WorkerMessageResponse,
    WorkerMessageWithSender,
} from '@proton/pass/types';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import { type Awaiter, awaiter } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { omit } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

type WakeupOptions = { tabId: TabId; endpoint: ClientEndpoint; messageFactory: MessageWithSenderFactory };
type UseWorkerStateEventsOptions = WakeupOptions & { onWorkerStateChange: (state: AppState) => void };

const wakeup = (options: WakeupOptions): Promise<WorkerMessageResponse<WorkerMessageType.WORKER_WAKEUP>> =>
    sendMessage.on(
        options.messageFactory({
            type: WorkerMessageType.WORKER_WAKEUP,
            payload: { tabId: options.tabId },
        }),
        (response) => {
            if (response.type === 'success') return response;
            else {
                logger.warn(`[Endpoint::${options.endpoint}] wakeup failed`, response.error);
                throw new Error();
            }
        }
    );

export const useWorkerStateEvents = ({ onWorkerStateChange, ...options }: UseWorkerStateEventsOptions) => {
    const ready = useRef<Awaiter<void>>(awaiter());

    useEffect(() => {
        const onMessage = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background' && message.type === WorkerMessageType.WORKER_STATE_CHANGE) {
                ready.current.then(() => onWorkerStateChange(message.payload.state)).catch(noop);
            }
        };

        ExtensionContext.get().port.onMessage.addListener(onMessage);

        wakeup(options)
            .then((state) => onWorkerStateChange(omit(state, ['features', 'settings'])))
            .catch(() =>
                onWorkerStateChange({
                    booted: false,
                    localID: undefined,
                    loggedIn: false,
                    status: AppStatus.ERROR,
                    UID: undefined,
                })
            )
            .finally(ready.current.resolve);

        return () => ExtensionContext.get().port.onMessage.removeListener(onMessage);
    }, []);
};
