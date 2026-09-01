import type { ComponentType } from 'react';

import NotificationsProvider from '../containers/notifications/Provider';

export const withNotifications =
    () =>
    <T extends {}>(Component: ComponentType<T>) =>
        function NotificationsProviderHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <NotificationsProvider>
                    <Component {...props} />
                </NotificationsProvider>
            );
        };
