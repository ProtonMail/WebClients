import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { pipe, waitUntil } from '@proton/pass/utils/fp';

import { EXTENSION_PREFIX, NOTIFICATION_HEIGHT, NOTIFICATION_IFRAME_SRC, NOTIFICATION_WIDTH } from '../../constants';
import { createIFrameApp } from '../../injections/iframe/create-iframe-app';
import { IFrameMessageType, type InjectedNotification, type OpenNotificationOptions } from '../../types';

export const createNotification = (): InjectedNotification => {
    const iframe = createIFrameApp({
        id: 'notification',
        src: NOTIFICATION_IFRAME_SRC,
        animation: 'slidein',
        backdropClose: false,
        classNames: [`${EXTENSION_PREFIX}-iframe--fixed`],
        onClose: ({ userInitiated }) =>
            userInitiated &&
            sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.FORM_ENTRY_STASH,
                    payload: { reason: 'AUTOSAVE_DISMISSED' },
                })
            ),
        position: () => ({ top: 15, right: 15 }),
        dimensions: () => ({ width: NOTIFICATION_WIDTH, height: NOTIFICATION_HEIGHT }),
    });

    const open = async ({ action, submission }: OpenNotificationOptions) => {
        await waitUntil(() => iframe.state.ready, 50);
        iframe.sendPortMessage({ type: IFrameMessageType.NOTIFICATION_ACTION, payload: { action, submission } });
        iframe.open();

        if (!iframe.state.visible) {
            void sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.TELEMETRY_EVENT,
                    payload: {
                        event: createTelemetryEvent(TelemetryEventName.AutosaveDisplay, {}, {}),
                    },
                })
            );
        }
    };

    const notification: InjectedNotification = {
        getState: () => iframe.state,
        reset: pipe(iframe.reset, () => notification),
        init: pipe(iframe.init, () => notification),
        open: pipe(open, () => notification),
        close: pipe(iframe.close, () => notification),
        destroy: iframe.destroy,
    };

    return notification;
};
