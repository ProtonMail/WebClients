import { type FC, useEffect } from 'react';

import type { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { NotificationHeader } from 'proton-pass-extension/app/content/services/inline/notification/app/components/NotificationHeader';
import type { NotificationRequest } from 'proton-pass-extension/app/content/services/inline/notification/notification.app';
import { useIFrameAppController } from 'proton-pass-extension/lib/components/Inline/IFrameApp';

const DURATION = 2_000;

type Props = Extract<NotificationRequest, { action: NotificationAction.TOAST }>;

export const Toast: FC<Props> = ({ message }) => {
    const controller = useIFrameAppController();

    useEffect(() => {
        const timer = setTimeout(controller.close, DURATION);
        return () => clearTimeout(timer);
    }, []);

    return <NotificationHeader title={message} wrapText />;
};
