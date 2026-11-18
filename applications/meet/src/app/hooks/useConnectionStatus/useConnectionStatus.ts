import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { ConnectionState } from 'livekit-client';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsReconnecting,
    selectIsWebsocketReconnecting,
    selectMlsRetrying,
    selectReconnectionFailed,
} from '@proton/meet/store/slices/connectionSlice';
import { SECOND } from '@proton/shared/lib/constants';

import { type ReconnectingCause, getReconnectingCause } from './getReconnectingCause';

export type ConnectionStatus =
    | { phase: 'connected' }
    | { phase: 'reconnecting'; cause: ReconnectingCause }
    | { phase: 'reconnected' }
    | { phase: 'disconnected' };

const RECONNECTED_DURATION_MS = 3 * SECOND;

export const useConnectionStatus = (liveKitConnectionState: ConnectionState | null): ConnectionStatus => {
    const isReconnecting = useMeetSelector(selectIsReconnecting);
    const reconnectionFailed = useMeetSelector(selectReconnectionFailed);
    const mlsRetrying = useMeetSelector(selectMlsRetrying);
    const isWebsocketReconnecting = useMeetSelector(selectIsWebsocketReconnecting);
    const isDisconnected = isReconnecting || reconnectionFailed;

    const cause = getReconnectingCause({
        isReconnecting,
        mlsRetrying,
        isDisconnected,
        liveKitConnectionState,
        isWebsocketReconnecting,
    });

    const previousCauseRef = useRef(cause);
    const [isReconnected, setIsReconnected] = useState(false);

    useLayoutEffect(() => {
        const previousCause = previousCauseRef.current;
        if (cause === previousCause) {
            return;
        }
        previousCauseRef.current = cause;
        setIsReconnected(previousCause !== null && cause === null && !isDisconnected);
    }, [cause, isDisconnected]);

    useEffect(() => {
        if (!isReconnected) {
            return;
        }
        const timeout = setTimeout(() => setIsReconnected(false), RECONNECTED_DURATION_MS);
        return () => clearTimeout(timeout);
    }, [isReconnected]);

    if (cause) {
        return { phase: 'reconnecting', cause };
    }
    if (isDisconnected) {
        return { phase: 'disconnected' };
    }
    if (isReconnected) {
        return { phase: 'reconnected' };
    }
    return { phase: 'connected' };
};
