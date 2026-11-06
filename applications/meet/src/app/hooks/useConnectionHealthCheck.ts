import { useCallback, useEffect, useRef } from 'react';

import { ConnectionStateInfo } from '@proton-meet/proton-meet-core';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setIsWebsocketReconnecting } from '@proton/meet/store/slices/connectionSlice';
import type { MLSGroupState } from '@proton/meet/types/types';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../contexts/MeetCoreClientContext';
import { MeetCoreRestartedError } from '../wasm/meetCoreStallRecovery';

interface UseConnectionHealthCheckParams {
    mlsGroupStateRef: React.MutableRefObject<MLSGroupState | null>;
    onMlsFailed: () => void;
}

/**
 * Hook to handle connection health check and user epoch health logging
 */
export const useConnectionHealthCheck = ({ mlsGroupStateRef, onMlsFailed }: UseConnectionHealthCheckParams) => {
    const meetCoreClient = useMeetCoreClient();
    const dispatch = useMeetDispatch();

    const healthCheckAllowedRef = useRef(false);

    const isConnectionCheckInProgressRef = useRef(false);
    const isEpochHealthCheckInProgressRef = useRef(false);

    // Dispatching only on a change of the polled value lets the dev simulator's value stand while the core stays connected.
    const lastPolledIsWebsocketReconnectingRef = useRef(false);

    const { reportMeetError } = useMeetErrorReporting();

    const isWebsocketStateCheckEnabled = useFlag('MeetShowReconnectionBannerIfServerConnectionLost');
    const isWebsocketStateCheckEnabledRef = useRef(isWebsocketStateCheckEnabled);

    const resetWebsocketState = useCallback(() => {
        lastPolledIsWebsocketReconnectingRef.current = false;
        dispatch(setIsWebsocketReconnecting(false));
    }, [dispatch]);

    useEffect(() => {
        isWebsocketStateCheckEnabledRef.current = isWebsocketStateCheckEnabled;
    }, [isWebsocketStateCheckEnabled]);

    // A late allow from an abandoned rejoin can poll a meet-core that was left, so each allow starts from connected.
    const allowHealthCheck = useCallback(() => {
        healthCheckAllowedRef.current = true;
        resetWebsocketState();
    }, [resetWebsocketState]);

    const disallowHealthCheck = useCallback(() => {
        healthCheckAllowedRef.current = false;
        resetWebsocketState();
    }, [resetWebsocketState]);

    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;
        let healthCheckTimeout: NodeJS.Timeout | null = null;
        let websocketStateTimeout: NodeJS.Timeout | null = null;
        let isWebsocketStatePollingActive = true;

        const checkWebsocketState = async () => {
            if (!isWebsocketStateCheckEnabledRef.current && lastPolledIsWebsocketReconnectingRef.current) {
                resetWebsocketState();
            } else if (healthCheckAllowedRef.current && isWebsocketStateCheckEnabledRef.current) {
                try {
                    const websocketState = await meetCoreClient.getWsState();
                    if (!isWebsocketStatePollingActive) {
                        return;
                    }
                    const isWebsocketReconnecting = websocketState !== ConnectionStateInfo.Connected;
                    if (
                        healthCheckAllowedRef.current &&
                        isWebsocketStateCheckEnabledRef.current &&
                        isWebsocketReconnecting !== lastPolledIsWebsocketReconnectingRef.current
                    ) {
                        lastPolledIsWebsocketReconnectingRef.current = isWebsocketReconnecting;
                        dispatch(setIsWebsocketReconnecting(isWebsocketReconnecting));
                    }
                } catch (error) {
                    if (!(error instanceof MeetCoreRestartedError)) {
                        reportMeetError('Failed to get websocket state', error);
                    }
                }
            }

            if (isWebsocketStatePollingActive) {
                websocketStateTimeout = setTimeout(checkWebsocketState, 2_000);
            }
        };

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
        void checkWebsocketState();

        return () => {
            isWebsocketStatePollingActive = false;
            if (websocketStateTimeout) {
                clearTimeout(websocketStateTimeout);
            }
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
