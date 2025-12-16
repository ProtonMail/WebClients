import { useEffect } from 'react';

import { ConnectionStateInfo } from '@proton-meet/proton-meet-core';
import type { App } from '@proton-meet/proton-meet-core';

import type { MLSGroupState } from '../types';

interface UseConnectionHealthCheckParams {
    wasmApp: App | null;
    mlsGroupStateRef: React.MutableRefObject<MLSGroupState | null>;
    startHealthCheck: React.MutableRefObject<boolean>;
    setConnectionLost: React.Dispatch<React.SetStateAction<boolean>>;
    reportMeetError: (message: string, error: unknown) => void;
}

/**
 * Hook to handle connection health check and user epoch health logging
 */
export const useConnectionHealthCheck = ({
    wasmApp,
    mlsGroupStateRef,
    startHealthCheck,
    setConnectionLost,
    reportMeetError,
}: UseConnectionHealthCheckParams) => {
    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;
        let healthCheckTimeout: NodeJS.Timeout | null = null;

        const checkConnection = async () => {
            let isWebsocketHasReconnected = false;
            if (wasmApp?.getWsState && startHealthCheck.current) {
                try {
                    isWebsocketHasReconnected = await wasmApp.isWebsocketHasReconnected();
                    const connectionStatus = await wasmApp.getWsState();

                    if (connectionStatus !== ConnectionStateInfo.Reconnecting) {
                        try {
                            const isMlsUpToDate = await wasmApp.isMlsUpToDate();

                            if (!isMlsUpToDate) {
                                setConnectionLost(true);
                            }
                        } catch (error) {
                            reportMeetError('Failed to check MLS status', error);
                            setConnectionLost(true);
                        }
                    } else {
                        setConnectionLost(false);
                    }
                } catch (error) {
                    reportMeetError('Failed to get connection status', error);
                }
            }

            // If the websocket has reconnected, check the connection every 5 seconds.
            // Otherwise, check the connection every 30 seconds to avoid overwhelming the server.
            timeout = setTimeout(checkConnection, isWebsocketHasReconnected ? 5_000 : 30_000);
        };

        const logUserEpochHealth = async () => {
            if (
                startHealthCheck.current &&
                mlsGroupStateRef.current?.epoch !== undefined &&
                mlsGroupStateRef.current?.displayCode
            ) {
                try {
                    await wasmApp?.logUserEpochHealth(
                        Number(mlsGroupStateRef.current.epoch),
                        mlsGroupStateRef.current.displayCode
                    );
                } catch (error) {
                    reportMeetError('Failed to log user epoch health', error);
                }
            }
            healthCheckTimeout = setTimeout(logUserEpochHealth, 30_000);
        };

        void checkConnection();
        void logUserEpochHealth();

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (healthCheckTimeout) {
                clearTimeout(healthCheckTimeout);
            }
        };
    }, []);
};
