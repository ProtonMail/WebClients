import type { ComponentType, FC } from 'react';
import { useSelector } from 'react-redux';

import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getPassWebUrl } from '@proton/pass/components/Navigation/routing';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { useTelemetryEvent } from '@proton/pass/hooks/useTelemetryEvent';
import { updateInAppNotificationState } from '@proton/pass/store/actions';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationCtaType, InAppNotificationState } from '@proton/pass/types';
import type { InAppNotification, TelemetryInAppNotificationStatus } from '@proton/pass/types/data/notification';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

type InAppNotificationProps<P extends object> = P & {
    /** Changes the message state from Unread to Read or Dismissed */
    changeNotificationState: (messageId: string, state: InAppNotificationState) => void;
    /** Marks the notification as read and stores the event in Telemetry */
    readMessage: () => void;
    /** Based on the CTA Ref, returns the full path to redirect to */
    getRedirectTo: (path: string) => string;
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
        const { onLink, onTelemetry } = usePassCore();
        const { API_URL } = usePassConfig();
        const authStore = useAuthStore();
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

        const getRedirectTo = (path: string) => `/${getLocalIDPath(authStore?.getLocalID())}${path}`;

        const readMessage = () => {
            const { cta } = notification.content;

            if (!cta) return;

            onTelemetry(
                TelemetryEventName.PassNotificationCTAClick,
                {},
                { notificationKey: notification.notificationKey }
            );
            changeNotificationState(notification.id, InAppNotificationState.READ);

            if (EXTENSION_BUILD) return onLink(getPassWebUrl(API_URL) + getRedirectTo(cta.ref).substring(1));
            if (cta.type === InAppNotificationCtaType.external_link) return onLink(cta.ref, { replace: true });
        };

        useTelemetryEvent(
            TelemetryEventName.PassNotificationDisplay,
            {},
            { notificationKey: notification.notificationKey }
        )([]);

        return (
            <Component
                {...props}
                readMessage={readMessage}
                changeNotificationState={changeNotificationState}
                getRedirectTo={getRedirectTo}
                notification={notification}
            />
        );
    };

    WrappedComponent.displayName = `WithInAppNotification<${Component.displayName ?? 'Component'}>`;

    return WrappedComponent;
};
