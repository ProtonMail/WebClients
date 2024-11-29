import type { ComponentType, FC } from 'react';
import { useSelector } from 'react-redux';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { updateInAppNotificationState } from '@proton/pass/store/actions';
import { selectNextNotification } from '@proton/pass/store/selectors';
import { InAppNotificationCtaType, InAppNotificationState } from '@proton/pass/types';
import { InAppNotification } from '@proton/pass/types/data/notification';

type InAppNotificationProps<P extends object> = P & {
    /** Changes the message state from Unread to Read or Dismissed */
    changeNotificationState: (messageId: string, state: InAppNotificationState) => void;
    /** Marks the notification as read and redirect to the CTA Ref */
    navigateToUrl: () => void;
    /** The notification to be displayed */
    notification: InAppNotification;
};

export const withInAppNotification = <P extends object>(Component: ComponentType<InAppNotificationProps<P>>): FC<P> => {
    const WrappedComponent: FC<P> = (props) => {
        const { onLink } = usePassCore();
        const updateNotificationStateRequest = useRequest(updateInAppNotificationState);
        const notification = useSelector(selectNextNotification)!;

        const changeNotificationState = (id: string, state: InAppNotificationState) =>
            updateNotificationStateRequest.dispatch({ id, state });

        const navigateToUrl = () => {
            const { cta } = notification.content;

            if (!cta?.ref) return;

            changeNotificationState(notification.id, InAppNotificationState.READ);
            onLink(cta.ref, { replace: cta.type === InAppNotificationCtaType.internal_navigation });
        };

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
