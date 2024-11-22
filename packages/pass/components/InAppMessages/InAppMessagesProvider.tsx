import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { getInAppNotifications, updateInAppNotificationState } from '@proton/pass/store/actions';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationDisplayType, type InAppNotificationState } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';
import { epochToMs } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { Banner } from './Banner';
import { Modal } from './Modal';

type InAppMessagesContextValue = {
    /** Changes the message state from Unread to Read or Dismissed */
    changeNotificationState: (messageId: string, state: InAppNotificationState) => void;
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
    const inAppMessagesEnabled = useFeatureFlag(PassFeature.PassInAppMessages);
    const notification = useSelector(selectNextNotification);
    const getNotification = useRequest(getInAppNotifications);
    const updateNotificationStateRequest = useRequest(updateInAppNotificationState);

    const NotificationComponent = getNotificationComponent(notification?.content.displayType);

    const changeNotificationState = useCallback(
        (id: string, state: InAppNotificationState) => updateNotificationStateRequest.dispatch({ id, state }),
        []
    );

    const ctx = useMemo<InAppMessagesContextValue>(() => ({ changeNotificationState }), []);

    useEffect(() => {
        if (inAppMessagesEnabled) interval.current = setInterval(getNotification.dispatch, epochToMs(UNIX_HOUR * 2));
        return () => clearInterval(interval.current);
    }, []);

    return (
        <InAppMessagesContext.Provider value={ctx}>
            {children}
            {inAppMessagesEnabled && !updateNotificationStateRequest.loading && <NotificationComponent />}
        </InAppMessagesContext.Provider>
    );
};

export const useInAppMessages = () => useContext(InAppMessagesContext);
