import { type FC, useCallback, useState } from 'react';

import {
    useIFrameContext,
    useRegisterMessageHandler,
} from 'proton-pass-extension/app/content/injections/apps/context/IFrameContextProvider';
import type { IFrameMessage, NotificationActions } from 'proton-pass-extension/app/content/types';
import { IFrameMessageType } from 'proton-pass-extension/app/content/types';

import { NotificationsChildren } from '@proton/components/containers';
import { Localized } from '@proton/pass/components/Core/Localized';
import type { MaybeNull } from '@proton/pass/types';

import { NotificationSwitch } from '../components/NotificationSwitch';

export const NotificationContent: FC = () => {
    const { closeIFrame, postMessage, settings, visible } = useIFrameContext();
    const [notificationState, setNotificationState] = useState<MaybeNull<NotificationActions>>(null);

    const handleAction = useCallback(
        ({ payload }: IFrameMessage<IFrameMessageType.NOTIFICATION_ACTION>) => setNotificationState(payload),
        []
    );

    useRegisterMessageHandler(IFrameMessageType.NOTIFICATION_ACTION, handleAction);

    return (
        <Localized>
            <NotificationSwitch
                onMessage={postMessage}
                settings={settings}
                state={notificationState}
                visible={visible}
                onClose={(options) => {
                    setNotificationState(null);
                    closeIFrame(options);
                }}
            >
                <NotificationsChildren />
            </NotificationSwitch>
        </Localized>
    );
};
