import { useEffect, useRef } from 'react';

import type { App } from '@proton-meet/proton-meet-core';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import type { MLSGroupState } from '../types';

interface UseConnectionHealthCheckParams {
    wasmApp: App | null;
    mlsGroupStateRef: React.MutableRefObject<MLSGroupState | null>;
    setConnectionLost: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Hook to handle connection health check and user epoch health logging
 */
export const useConnectionHealthCheck = ({
    wasmApp,
    mlsGroupStateRef,
    setConnectionLost,
}: UseConnectionHealthCheckParams) => {
    const healthCheckAllowedRef = useRef(false);

    const isConnectionCheckInProgressRef = useRef(false);
    const isEpochHealthCheckInProgressRef = useRef(false);

    const reportMeetError = useMeetErrorReporting();

    const allowHealthCheck = () => {
        healthCheckAllowedRef.current = true;
    };

    const disallowHealthCheck = () => {
        healthCheckAllowedRef.current = false;
    };

    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;
        let healthCheckTimeout: NodeJS.Timeout | null = null;

        const checkConnection = async () => {
            if (wasmApp !== null && healthCheckAllowedRef.current && !isConnectionCheckInProgressRef.current) {
                try {
                    isConnectionCheckInProgressRef.current = true;

                    const isMlsUpToDate = await wasmApp.isMlsUpToDate();
                    setConnectionLost(!isMlsUpToDate);
                } catch (error) {
                    reportMeetError('Failed to get connection status', error);
                } finally {
                    isConnectionCheckInProgressRef.current = false;
                }
            }

            // Client trigger the next health check every 10 seconds.
            timeout = setTimeout(checkConnection, 10_000);
        };

        const logUserEpochHealth = async () => {
            if (
                healthCheckAllowedRef.current &&
                mlsGroupStateRef.current?.epoch !== undefined &&
                mlsGroupStateRef.current?.displayCode &&
                !isEpochHealthCheckInProgressRef.current
            ) {
                try {
                    isEpochHealthCheckInProgressRef.current = true;
                    await wasmApp?.logUserEpochHealth(
                        Number(mlsGroupStateRef.current.epoch),
                        mlsGroupStateRef.current.displayCode
                    );
                } catch (error) {
                    reportMeetError('Failed to log user epoch health', error);
                } finally {
                    isEpochHealthCheckInProgressRef.current = false;
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

    return { allowHealthCheck, disallowHealthCheck };
};
