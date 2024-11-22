import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getInAppNotifications, updateInAppNotificationState } from '@proton/pass/store/actions';
import { getInAppNotificationsRequest, updateInAppNotificationStateRequest } from '@proton/pass/store/actions/requests';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationDisplayType } from '@proton/pass/types';
import type { NotificationState } from '@proton/pass/types/data/notification';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';
import { epochToMs } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { Banner } from './Banner';
import { Modal } from './Modal';

type InAppMessagesContextValue = {
    /** Changes the message state from Unread to Read or Dismissed */
    changeNotificationState: (messageId: string, state: NotificationState) => void;
};

const InAppMessagesContext = createContext<InAppMessagesContextValue>({
    changeNotificationState: noop,
});

// Mapper function to prevent hot-reload pre-initialization errors
const getNotificationComponent = (displayType?: InAppNotificationDisplayType) =>
    ({
        [InAppNotificationDisplayType.BANNER]: Banner,
        [InAppNotificationDisplayType.MODAL]: Modal,
    })[displayType!] ?? noop;

export const InAppMessagesProvider: FC<PropsWithChildren> = ({ children }) => {
    const interval = useRef<NodeJS.Timeout>();
    const notification = useSelector(selectNextNotification);
    const getNotification = useRequest(getInAppNotifications, { initialRequestId: getInAppNotificationsRequest() });
    const updateNotificationStateRequest = useRequest(updateInAppNotificationState, {
        initialRequestId: updateInAppNotificationStateRequest(),
    });

    const NotificationComponent = getNotificationComponent(notification?.content.displayType);

    const changeNotificationState = useCallback(
        (id: string, state: NotificationState) => updateNotificationStateRequest.dispatch({ id, state }),
        []
    );

    const ctx = useMemo<InAppMessagesContextValue>(() => ({ changeNotificationState }), []);

    useEffect(() => {
        interval.current = setInterval(getNotification.dispatch, epochToMs(UNIX_HOUR * 2));
        return () => clearInterval(interval.current);
    }, []);

    return (
        <InAppMessagesContext.Provider value={ctx}>
            {children}
            {!updateNotificationStateRequest.loading && <NotificationComponent />}
        </InAppMessagesContext.Provider>
    );
};

export const useInAppMessages = () => useContext(InAppMessagesContext);
