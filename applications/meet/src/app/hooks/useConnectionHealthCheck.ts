import { useCallback, useEffect, useRef } from 'react';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import type { MLSGroupState } from '@proton/meet/types/types';

import { useMeetCoreClient } from '../contexts/MeetCoreClientContext';

interface UseConnectionHealthCheckParams {
    mlsGroupStateRef: React.MutableRefObject<MLSGroupState | null>;
    onMlsFailed: () => void;
}

/**
 * Hook to handle connection health check and user epoch health logging
 */
export const useConnectionHealthCheck = ({ mlsGroupStateRef, onMlsFailed }: UseConnectionHealthCheckParams) => {
    const meetCoreClient = useMeetCoreClient();

    const healthCheckAllowedRef = useRef(false);

    const isConnectionCheckInProgressRef = useRef(false);
    const isEpochHealthCheckInProgressRef = useRef(false);

    const { reportMeetError } = useMeetErrorReporting();

    const allowHealthCheck = useCallback(() => {
        healthCheckAllowedRef.current = true;
    }, []);

    const disallowHealthCheck = useCallback(() => {
        healthCheckAllowedRef.current = false;
    }, []);

    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;
        let healthCheckTimeout: NodeJS.Timeout | null = null;

        const checkConnection = async () => {
            if (healthCheckAllowedRef.current && !isConnectionCheckInProgressRef.current) {
                try {
                    isConnectionCheckInProgressRef.current = true;

                    const isMlsUpToDate = await meetCoreClient.isMlsUpToDate();
                    if (!isMlsUpToDate) {
                        onMlsFailed();
                    }
                } catch (error) {
                    reportMeetError('Failed to get connection status', error);
                } finally {
                    isConnectionCheckInProgressRef.current = false;
                }
            }

            // Client trigger the next health check every 5 seconds.
            timeout = setTimeout(checkConnection, 5_000);
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
                    await meetCoreClient.logUserEpochHealth(
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { allowHealthCheck, disallowHealthCheck };
};
