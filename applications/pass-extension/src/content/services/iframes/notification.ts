import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { FormType, WorkerMessageType } from '@proton/pass/types';
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
import type { NotificationActions } from '../../types';
import { IFrameMessageType, type InjectedNotification, NotificationAction } from '../../types';

export const createNotification = (): InjectedNotification => {
    const iframe = createIFrameApp<NotificationAction>({
        id: 'notification',
        src: NOTIFICATION_IFRAME_SRC,
        animation: 'slidein',
        backdropClose: false,
        classNames: [`${EXTENSION_PREFIX}-iframe--fixed`],
        onClose: (_, options) =>
            options?.userInitiated &&
            sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.FORM_ENTRY_STASH,
                    payload: { reason: 'AUTOSAVE_DISMISSED' },
                })
            ),
        position: () => ({ top: 15, right: 15 }),
        dimensions: ({ action }) => ({
            width: NOTIFICATION_WIDTH,
            height: action === NotificationAction.AUTOFILL_OTP_PROMPT ? NOTIFICATION_HEIGHT_SM : NOTIFICATION_HEIGHT,
        }),
    });

    const open = async (payload: NotificationActions) => {
        await waitUntil(() => iframe.state.ready, 50);

        if (!iframe.state.visible) {
            iframe.sendPortMessage({ type: IFrameMessageType.NOTIFICATION_ACTION, payload });
            iframe.open(payload.action);
        }
    };

    iframe.registerMessageHandler(
        IFrameMessageType.NOTIFICATION_AUTOFILL_OTP,
        withContext(({ service: { formManager, autofill } }, { payload: { code } }) => {
            const form = formManager.getTrackedForms().find(({ formType }) => formType === FormType.MFA);
            if (!form) return;

            autofill.autofillOTP(form, code);
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
