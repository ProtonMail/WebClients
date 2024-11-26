import { useEffect } from 'react';

import metrics from '@proton/metrics';
import {
    addIPCHostUpdateListener,
    canListenInboxDesktopHostMessages,
    hasInboxDesktopFeature,
    invokeInboxDesktopIPC,
} from '@proton/shared/lib/desktop/ipcHelpers';

export const useInboxDesktopMetrics = () => {
    useEffect(() => {
        if (!canListenInboxDesktopHostMessages || !hasInboxDesktopFeature('HeartbeatMetrics')) {
            return;
        }

        const metricsListener = addIPCHostUpdateListener('sentHeartbeatMetrics', (payload) => {
            metrics.desktop_inbox_heartbeat_total.increment(payload.Labels);
        });

        invokeInboxDesktopIPC({ type: 'metricsListenerChanged', payload: 'ready' });

        return () => {
            invokeInboxDesktopIPC({ type: 'metricsListenerChanged', payload: 'removed' });
            metricsListener.removeListener();
        };
    }, []);
};
