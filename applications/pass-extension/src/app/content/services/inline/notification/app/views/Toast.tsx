import { type FC, useEffect } from 'react';

import { useIFrameAppController } from '../../../../../../../lib/components/Inline/IFrameApp';
import type { NotificationAction } from '../../../../../constants.runtime';
import type { NotificationRequest } from '../../notification.app';
import { NotificationHeader } from '../components/NotificationHeader';

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
