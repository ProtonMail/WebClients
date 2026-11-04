import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { ConnectionError, ConnectionErrorReason } from 'livekit-client';

import { getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';

import { isConnectionTimeoutError } from '../../utils/connectionErrors';
import { toMeetCoreErrorEnum } from '../../wasm/meetCoreError';
import { MeetCoreStalledError } from '../../wasm/meetCoreStallRecovery';

export const REJOIN_RETRY_DELAYS_MS = [2 * SECOND, 5 * SECOND, 10 * SECOND, 20 * SECOND];

// navigator.onLine can stay false on a network that works, so a run still attempts now and then.
export const OFFLINE_RECHECK_MS = 30 * SECOND;

export const OFFLINE_GIVE_UP_MS = 5 * MINUTE;

export type RejoinOutcome =
    | { status: 'joined'; attempts: number }
    | { status: 'failed'; attempts: number; error: unknown }
    | { status: 'cancelled'; attempts: number };

interface RunRejoinAttemptsOptions {
    signal: AbortSignal;
    retryDelaysMs: readonly number[];
    waitWhileOffline: boolean;
}

const RETRYABLE_MEET_CORE_ERRORS: ReadonlySet<MeetCoreErrorEnum> = new Set([
    MeetCoreErrorEnum.HttpClientError,
    MeetCoreErrorEnum.NetworkTimeout,
    MeetCoreErrorEnum.WebSocketError,
    MeetCoreErrorEnum.MaxRetriesReached,
]);

const RETRYABLE_LIVEKIT_CONNECTION_ERRORS: ReadonlySet<ConnectionErrorReason> = new Set([
    ConnectionErrorReason.ServerUnreachable,
    ConnectionErrorReason.InternalError,
    ConnectionErrorReason.Timeout,
    ConnectionErrorReason.WebSocket,
    ConnectionErrorReason.Cancelled,
]);

const isRetryableRejoinError = (error: unknown) => {
    if (error instanceof MeetCoreStalledError) {
        return error.restarted;
    }
    if (error instanceof ConnectionError) {
        return RETRYABLE_LIVEKIT_CONNECTION_ERRORS.has(error.reason);
    }
    const meetCoreError = toMeetCoreErrorEnum(error);
    if (meetCoreError !== undefined) {
        return RETRYABLE_MEET_CORE_ERRORS.has(meetCoreError);
    }
    return getIsConnectionIssue(error) || isConnectionTimeoutError(error);
};

const waitForOnlineOrDelay = (delayMs: number, signal: AbortSignal) =>
    new Promise<void>((resolve) => {
        if (signal.aborted) {
            resolve();
            return;
        }
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const finish = () => {
            clearTimeout(timeoutId);
            window.removeEventListener('online', finish);
            signal.removeEventListener('abort', finish);
            resolve();
        };
        timeoutId = setTimeout(finish, delayMs);
        window.addEventListener('online', finish);
        signal.addEventListener('abort', finish);
    });

const withJitter = (delayMs: number) => delayMs * (0.5 + Math.random() / 2);

export const runRejoinAttempts = async (
    attempt: () => Promise<void>,
    { signal, retryDelaysMs, waitWhileOffline }: RunRejoinAttemptsOptions
): Promise<RejoinOutcome> => {
    let attempts = 0;
    let onlineFailures = 0;
    let offlineMs = 0;
    let lastError: unknown;

    for (;;) {
        if (waitWhileOffline && !navigator.onLine) {
            if (offlineMs >= OFFLINE_GIVE_UP_MS) {
                return { status: 'failed', attempts, error: lastError };
            }
            const waitStartedAtMs = Date.now();
            await waitForOnlineOrDelay(Math.min(OFFLINE_RECHECK_MS, OFFLINE_GIVE_UP_MS - offlineMs), signal);
            offlineMs += Date.now() - waitStartedAtMs;
        }
        if (signal.aborted) {
            return { status: 'cancelled', attempts };
        }

        attempts += 1;
        const attemptStartedOffline = waitWhileOffline && !navigator.onLine;
        const attemptStartedAtMs = Date.now();
        try {
            await attempt();
            return signal.aborted ? { status: 'cancelled', attempts } : { status: 'joined', attempts };
        } catch (error) {
            lastError = error;
        }
        if (attemptStartedOffline) {
            offlineMs += Date.now() - attemptStartedAtMs;
        }

        if (signal.aborted) {
            return { status: 'cancelled', attempts };
        }
        if (waitWhileOffline && !navigator.onLine) {
            continue;
        }
        if (onlineFailures === retryDelaysMs.length || !isRetryableRejoinError(lastError)) {
            return { status: 'failed', attempts, error: lastError };
        }
        await waitForOnlineOrDelay(withJitter(retryDelaysMs[onlineFailures]), signal);
        onlineFailures += 1;
    }
};
