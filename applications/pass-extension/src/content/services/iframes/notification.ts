import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { MaybeNull } from '@proton/pass/types';
import { FormField, FormType, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { pipe, waitUntil } from '@proton/pass/utils/fp';

import {
    EXTENSION_PREFIX,
    NOTIFICATION_HEIGHT,
    NOTIFICATION_HEIGHT_SM,
    NOTIFICATION_IFRAME_SRC,
    NOTIFICATION_WIDTH,
} from '../../constants';
import { withContext } from '../../context/context';
import { createIFrameApp } from '../../injections/iframe/create-iframe-app';
import {
    IFrameMessageType,
    type InjectedNotification,
    NotificationAction,
    type OpenNotificationOptions,
} from '../../types';

type IFrameNotificationState = { action: MaybeNull<NotificationAction> };

const getNotificationHeight = ({ action }: IFrameNotificationState) => {
    if (action === NotificationAction.AUTOFILL_OTP_PROMPT) return NOTIFICATION_HEIGHT_SM;
    return NOTIFICATION_HEIGHT;
};

export const createNotification = (): InjectedNotification => {
    const state: IFrameNotificationState = { action: null };

    const iframe = createIFrameApp({
        id: 'notification',
        src: NOTIFICATION_IFRAME_SRC,
        animation: 'slidein',
        backdropClose: false,
        classNames: [`${EXTENSION_PREFIX}-iframe--fixed`],
        onClose: (options) =>
            options?.userInitiated &&
            sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.FORM_ENTRY_STASH,
                    payload: { reason: 'AUTOSAVE_DISMISSED' },
                })
            ),
        position: () => ({ top: 15, right: 15 }),
        dimensions: () => ({
            width: NOTIFICATION_WIDTH,
            height: getNotificationHeight(state),
        }),
    });

    const open = async (payload: OpenNotificationOptions) => {
        state.action = payload.action;
        await waitUntil(() => iframe.state.ready, 50);
        iframe.sendPortMessage({ type: IFrameMessageType.NOTIFICATION_ACTION, payload });
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

    iframe.registerMessageHandler(
        IFrameMessageType.NOTIFICATION_AUTOFILL_OTP,
        withContext(({ service: { formManager } }, message) => {
            const { code } = message.payload;
            const form = formManager.getTrackedForms().find(({ formType }) => formType === FormType.MFA);
            if (form) {
                /* if we have multiple OTP fields then we're dealing
                 * with an OTP code field spread out into multiple text
                 * inputs : in this case, prefer a "paste autofill" */
                const otps = form.getFieldsFor(FormField.OTP);
                otps?.[0]?.autofill(code, { paste: otps.length > 1 });
            }
        })
    );

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
