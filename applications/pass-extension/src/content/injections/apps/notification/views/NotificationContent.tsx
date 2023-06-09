import { type VFC, useCallback, useState } from 'react';

import { NotificationsChildren } from '@proton/components';
import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { type Maybe, type PromptedFormEntry, WorkerMessageType } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { merge } from '@proton/pass/utils/object';

import { type IFrameMessage, IFrameMessageType, NotificationAction } from '../../../../types';
import { useIFrameContext, useRegisterMessageHandler } from '../../context/IFrameContextProvider';
import { Autosave } from './Autosave';

type NotificationAppState = {
    action: Maybe<NotificationAction>;
    submission: Maybe<PromptedFormEntry>;
};

const INITIAL_STATE = { action: undefined, submission: undefined };

export const NotificationContent: VFC = () => {
    const { closeIFrame } = useIFrameContext();
    const [{ action, submission }, setNotificationState] = useState<NotificationAppState>(INITIAL_STATE);

    const handleAction = useCallback(({ payload }: IFrameMessage<IFrameMessageType.NOTIFICATION_ACTION>) => {
        switch (payload.action) {
            case NotificationAction.AUTOSAVE_PROMPT: {
                return (
                    payload.action === NotificationAction.AUTOSAVE_PROMPT &&
                    setNotificationState((state) => merge(state, payload))
                );
            }
        }
    }, []);

    useRegisterMessageHandler(IFrameMessageType.NOTIFICATION_ACTION, handleAction);

    return (
        <div className="h100 p-5 bg-norm">
            <NotificationsChildren />
            {action === NotificationAction.AUTOSAVE_PROMPT && submission !== undefined && (
                <Autosave
                    submission={submission}
                    onAutoSaved={() => {
                        void sendMessage(
                            contentScriptMessage({
                                type: WorkerMessageType.TELEMETRY_EVENT,
                                payload: {
                                    event: createTelemetryEvent(TelemetryEventName.AutosaveDone, {}, {}),
                                },
                            })
                        );

                        setNotificationState(INITIAL_STATE);
                        closeIFrame();
                    }}
                />
            )}
        </div>
    );
};
