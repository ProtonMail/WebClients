import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { updateInAppNotificationState } from '@proton/pass/store/actions';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationDisplayType, type InAppNotificationState } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

import { InAppNotificationBanner } from './InAppNotificationBanner';
import { InAppNotificationModal } from './InAppNotificationModal';

type InAppNotificationContextValue = {
    /** Changes the message state from Unread to Read or Dismissed */
    changeNotificationState: (messageId: string, state: InAppNotificationState) => void;
};

const InAppNotificationContext = createContext<InAppNotificationContextValue>({
    changeNotificationState: noop,
});

// Mapper function to prevent hot-reload pre-initialization errors
const getNotificationComponent = (displayType?: InAppNotificationDisplayType) =>
    ({
        [InAppNotificationDisplayType.BANNER]: InAppNotificationBanner,
        [InAppNotificationDisplayType.MODAL]: InAppNotificationModal,
    })[displayType!] ?? noop;

export const InAppNotificationProvider: FC<PropsWithChildren> = ({ children }) => {
    const inAppMessagesEnabled = useFeatureFlag(PassFeature.PassInAppMessages);
    const notification = useSelector(selectNextNotification);
    const updateNotificationStateRequest = useRequest(updateInAppNotificationState);

    const NotificationComponent = getNotificationComponent(notification?.content.displayType);

    const changeNotificationState = useCallback(
        (id: string, state: InAppNotificationState) => updateNotificationStateRequest.dispatch({ id, state }),
        []
    );

    const ctx = useMemo<InAppNotificationContextValue>(() => ({ changeNotificationState }), []);

    return (
        <InAppNotificationContext.Provider value={ctx}>
            {children}
            {inAppMessagesEnabled && !updateNotificationStateRequest.loading && <NotificationComponent />}
        </InAppNotificationContext.Provider>
    );
};

export const useInAppNotification = () => useContext(InAppNotificationContext);
