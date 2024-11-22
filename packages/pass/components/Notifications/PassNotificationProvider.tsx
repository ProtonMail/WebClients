import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getInAppNotifications } from '@proton/pass/store/actions';
import { getInAppNotificationsRequest } from '@proton/pass/store/actions/requests';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationDisplayType } from '@proton/pass/types';
import type { NotificationState } from '@proton/pass/types/data/notification';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';
import { epochToMs } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { Banner } from './Banner';
import { Modal } from './Modal';

type NotificationContextValue = {
    /** Changes the message status from Unread to Read or Dismissed */
    changeNotificationStatus: (messageId: string, status: NotificationState) => void;
};

export const NotificationContext = createContext<NotificationContextValue>({
    changeNotificationStatus: noop,
});

const NotificationComponentMap: Record<InAppNotificationDisplayType, FC> = {
    [InAppNotificationDisplayType.BANNER]: Banner,
    [InAppNotificationDisplayType.MODAL]: Modal,
};

export const PassNotificationProvider: FC<PropsWithChildren> = ({ children }) => {
    const interval = useRef<NodeJS.Timeout>();
    const { dispatch } = useRequest(getInAppNotifications, { initialRequestId: getInAppNotificationsRequest() });
    const notification = useSelector(selectNextNotification);
    const NotificationComponent = notification ? NotificationComponentMap[notification.content.displayType] : noop;

    const changeNotificationStatus = useCallback((notificationId: string, status: NotificationState) => {
        // eslint-disable-next-line no-console
        console.log(notificationId, status);
    }, []);

    const ctx = useMemo<NotificationContextValue>(() => ({ changeNotificationStatus }), []);

    useEffect(() => {
        interval.current = setInterval(dispatch, epochToMs(UNIX_HOUR * 2));
        return () => clearInterval(interval.current);
    }, []);

    return (
        <NotificationContext.Provider value={ctx}>
            {children}
            <NotificationComponent />
        </NotificationContext.Provider>
    );
};

export const usePassNotification = () => useContext(NotificationContext);
