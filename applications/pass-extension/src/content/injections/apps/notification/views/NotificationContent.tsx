import { type VFC, useCallback, useState } from 'react';

import { NotificationsChildren } from '@proton/components/containers';
import type { MaybeNull } from '@proton/pass/types';

import type { NotificationSetActionPayload } from '../../../../types';
import { type IFrameMessage, IFrameMessageType, NotificationAction } from '../../../../types';
import { useIFrameContext, useRegisterMessageHandler } from '../../context/IFrameContextProvider';
import { NotificationSwitch } from '../components/NotificationSwitch';

export const NotificationContent: VFC = () => {
    const { closeIFrame, settings } = useIFrameContext();
    const [notificationState, setNotificationState] = useState<MaybeNull<NotificationSetActionPayload>>(null);

    const handleAction = useCallback(({ payload }: IFrameMessage<IFrameMessageType.NOTIFICATION_ACTION>) => {
        switch (payload.action) {
            case NotificationAction.AUTOSAVE_PROMPT: {
                return payload.action === NotificationAction.AUTOSAVE_PROMPT && setNotificationState(payload);
            }
        }
    }, []);

    useRegisterMessageHandler(IFrameMessageType.NOTIFICATION_ACTION, handleAction);

    return (
        <NotificationSwitch
            state={notificationState}
            settings={settings}
            onClose={() => {
                setNotificationState(null);
                closeIFrame();
            }}
        >
            <NotificationsChildren />
        </NotificationSwitch>
    );
};
