import type { ComponentType, FC } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { updateInAppNotificationState } from '@proton/pass/store/actions';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationCtaType, InAppNotificationState } from '@proton/pass/types';
import type { InAppNotification, TelemetryInAppNotificationStatus } from '@proton/pass/types/data/notification';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { getEpoch } from '@proton/pass/utils/time/epoch';

type InAppNotificationProps<P extends object> = P & {
    /** Changes the message state from Unread to Read or Dismissed */
    changeNotificationState: (messageId: string, state: InAppNotificationState) => void;
    /** Marks the notification as read and redirect to the CTA Ref */
    navigateToUrl: () => void;
    /** The notification to be displayed */
    notification: InAppNotification;
};

const TelemetryStatusName: Record<InAppNotificationState, TelemetryInAppNotificationStatus> = {
    [InAppNotificationState.READ]: 'read',
    [InAppNotificationState.UNREAD]: 'unread',
    [InAppNotificationState.DISMISSED]: 'dismissed',
};

export const withInAppNotification = <P extends object>(Component: ComponentType<InAppNotificationProps<P>>): FC<P> => {
    const WrappedComponent: FC<P> = (props) => {
        const { onTelemetry, onLink } = usePassCore();
        const updateNotificationStateRequest = useRequest(updateInAppNotificationState);
        const notification = useSelector(selectNextNotification(getEpoch()))!;

        const changeNotificationState = (id: string, state: InAppNotificationState) => {
            onTelemetry(
                TelemetryEventName.PassNotificationChangeStatus,
                {},
                {
                    notificationKey: notification.notificationKey,
                    notificationStatus: TelemetryStatusName[notification.state],
                }
            );
            updateNotificationStateRequest.dispatch({ id, state });
        };

        const navigateToUrl = () => {
            const { cta } = notification.content;

            if (!cta?.ref) return;
            onTelemetry(
                TelemetryEventName.PassNotificationCTAClick,
                {},
                { notificationKey: notification.notificationKey }
            );
            changeNotificationState(notification.id, InAppNotificationState.READ);
            onLink(cta.ref, { replace: cta.type === InAppNotificationCtaType.internal_navigation });
        };

        useTelemetryEvent(
            TelemetryEventName.PassNotificationDisplay,
            {},
            { notificationKey: notification.notificationKey }
        )([]);

        return (
            <Component
                {...props}
                navigateToUrl={navigateToUrl}
                changeNotificationState={changeNotificationState}
                notification={notification}
            />
        );
    };

    WrappedComponent.displayName = `WithInAppNotification<${Component.displayName ?? 'Component'}>`;

    return WrappedComponent;
};
