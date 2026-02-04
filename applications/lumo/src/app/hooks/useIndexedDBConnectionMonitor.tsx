import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';

/**
 * Hook that monitors IndexedDB connection status and shows notifications
 * when connection is lost or restored.
 */
export const useIndexedDBConnectionMonitor = () => {
    const { createNotification } = useNotifications();
    const reconnectionNotificationShown = useRef(false);
    const connectionFailedNotificationShown = useRef(false);

    useEffect(() => {
        const handleConnectionFailed = (event: Event) => {
            // Only show the notification once to avoid spam
            if (!connectionFailedNotificationShown.current) {
                connectionFailedNotificationShown.current = true;

                createNotification({
                    text: c('collider_2025:Error')
                        .t`Database connection lost. Please refresh the page to continue.`,
                    type: 'error',
                });
            }
        };

        const handleReconnected = (event: Event) => {

            // Only show reconnection notification if we previously showed a failure
            if (reconnectionNotificationShown.current || connectionFailedNotificationShown.current) {
                createNotification({
                    text: c('collider_2025:Success').t`Database connection restored.`,
                    type: 'success',
                });

                // Reset flags
                reconnectionNotificationShown.current = false;
                connectionFailedNotificationShown.current = false;
            }
        };

        // Listen for IndexedDB connection events
        window.addEventListener('indexeddb-connection-failed', handleConnectionFailed);
        window.addEventListener('indexeddb-reconnected', handleReconnected);

        return () => {
            window.removeEventListener('indexeddb-connection-failed', handleConnectionFailed);
            window.removeEventListener('indexeddb-reconnected', handleReconnected);
        };
    }, [createNotification]);
};
