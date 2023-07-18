import { type VFC, useCallback, useState } from 'react';

import { NotificationsChildren } from '@proton/components/containers';
import type { MaybeNull } from '@proton/pass/types';

import type { NotificationActions } from '../../../../types';
import { type IFrameMessage, IFrameMessageType } from '../../../../types';
import { useIFrameContext, useRegisterMessageHandler } from '../../context/IFrameContextProvider';
import { NotificationSwitch } from '../components/NotificationSwitch';

export const NotificationContent: VFC = () => {
    const { closeIFrame, postMessage, settings, visible } = useIFrameContext();
    const [notificationState, setNotificationState] = useState<MaybeNull<NotificationActions>>(null);

    const handleAction = useCallback(
        ({ payload }: IFrameMessage<IFrameMessageType.NOTIFICATION_ACTION>) => setNotificationState(payload),
        []
    );

    useRegisterMessageHandler(IFrameMessageType.NOTIFICATION_ACTION, handleAction);

    return (
        <NotificationSwitch
            state={notificationState}
            visible={visible}
            settings={settings}
            onMessage={postMessage}
            onClose={(options) => {
                setNotificationState(null);
                closeIFrame(options);
            }}
        >
            <NotificationsChildren />
        </NotificationSwitch>
    );
};
