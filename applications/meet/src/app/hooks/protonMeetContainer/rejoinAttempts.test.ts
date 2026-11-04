import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { ConnectionError } from 'livekit-client';

import { MeetCoreStalledError } from '../../wasm/meetCoreStallRecovery';
import { OFFLINE_GIVE_UP_MS, OFFLINE_RECHECK_MS, REJOIN_RETRY_DELAYS_MS, runRejoinAttempts } from './rejoinAttempts';

const offlineError = Object.assign(new Error('Offline'), { name: 'OfflineError' });
const networkError = Object.assign(new Error('Network error'), { name: 'NetworkError' });
const timeoutError = Object.assign(new Error('Request timed out'), { name: 'TimeoutError' });
const meetCoreError = (coreError: MeetCoreErrorEnum) =>
    Object.assign(new Error(`MLS setup failed: ${MeetCoreErrorEnum[coreError]}`), { coreError });

const lastRetryDelayMs = REJOIN_RETRY_DELAYS_MS[REJOIN_RETRY_DELAYS_MS.length - 1];
const allRetryDelaysMs = REJOIN_RETRY_DELAYS_MS.reduce((total, delayMs) => total + delayMs, 0);

let isOnline: boolean;
const goOnline = () => {
    isOnline = true;
    window.dispatchEvent(new Event('online'));
};

const startRun = (attempt: () => Promise<void>, options: Partial<Parameters<typeof runRejoinAttempts>[1]> = {}) => {
    const controller = new AbortController();
    let settled = false;
    const outcome = runRejoinAttempts(attempt, {
        signal: controller.signal,
        retryDelaysMs: REJOIN_RETRY_DELAYS_MS,
        waitWhileOffline: true,
        ...options,
    }).finally(() => {
        settled = true;
    });
    return { outcome, controller, isSettled: () => settled };
};

describe('runRejoinAttempts', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        isOnline = true;
        vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => isOnline);
        vi.spyOn(Math, 'random').mockReturnValue(1);
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('joins on the first attempt without waiting', async () => {
        const attempt = vi.fn().mockResolvedValue(undefined);

        await expect(startRun(attempt).outcome).resolves.toEqual({ status: 'joined', attempts: 1 });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('retries a connection issue after the first delay and joins', async () => {
        const attempt = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValue(undefined);
        const { outcome } = startRun(attempt);

        await vi.advanceTimersByTimeAsync(REJOIN_RETRY_DELAYS_MS[0] - 1);
        expect(attempt).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);
        await expect(outcome).resolves.toEqual({ status: 'joined', attempts: 2 });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('spreads each retry delay with jitter, never below half of it', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const attempt = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValue(undefined);
        const { outcome } = startRun(attempt);

        await vi.advanceTimersByTimeAsync(REJOIN_RETRY_DELAYS_MS[0] / 2 - 1);
        expect(attempt).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);
        await expect(outcome).resolves.toEqual({ status: 'joined', attempts: 2 });
    });

    it('fails with the last error once every retry delay is spent', async () => {
        const lastError = Object.assign(new Error('Unavailable'), { status: 503 });
        const attempt = vi.fn();
        REJOIN_RETRY_DELAYS_MS.forEach(() => attempt.mockRejectedValueOnce(networkError));
        attempt.mockRejectedValueOnce(lastError);
        const { outcome, isSettled } = startRun(attempt);

        await vi.advanceTimersByTimeAsync(allRetryDelaysMs - 1);
        expect(isSettled()).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await expect(outcome).resolves.toEqual({
            status: 'failed',
            attempts: REJOIN_RETRY_DELAYS_MS.length + 1,
            error: lastError,
        });
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each([
        { name: 'an offline API request', error: offlineError },
        { name: 'a timed out API request', error: timeoutError },
        { name: 'an API network error', error: networkError },
        { name: 'an unavailable API', error: Object.assign(new Error('Unavailable'), { status: 503 }) },
        { name: 'a meet-core call abandoned after a restart', error: new MeetCoreStalledError('joinMeeting', true) },
        { name: 'a meet-core HTTP failure', error: meetCoreError(MeetCoreErrorEnum.HttpClientError) },
        { name: 'a meet-core network timeout', error: meetCoreError(MeetCoreErrorEnum.NetworkTimeout) },
        { name: 'a meet-core websocket failure', error: meetCoreError(MeetCoreErrorEnum.WebSocketError) },
        { name: 'meet-core running out of retries', error: meetCoreError(MeetCoreErrorEnum.MaxRetriesReached) },
        { name: 'an unreachable LiveKit server', error: ConnectionError.serverUnreachable('unreachable') },
        { name: 'a LiveKit websocket failure', error: ConnectionError.websocket('closed') },
        { name: 'a LiveKit connect timeout', error: ConnectionError.timeout('timed out') },
        { name: 'a LiveKit peer connection failure', error: ConnectionError.internal('no pc connection') },
        { name: 'a cancelled LiveKit connect', error: ConnectionError.cancelled('Client initiated disconnect') },
        { name: 'our own LiveKit connect timeout', error: new Error('Connection timeout after 20000ms') },
    ])('retries $name', async ({ error }) => {
        const attempt = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(undefined);
        const { outcome } = startRun(attempt);

        await vi.advanceTimersByTimeAsync(REJOIN_RETRY_DELAYS_MS[0]);

        await expect(outcome).resolves.toEqual({ status: 'joined', attempts: 2 });
    });

    it.each([
        { name: 'an API rejection', error: Object.assign(new Error('Unprocessable'), { status: 422 }) },
        {
            name: 'a hung meet-core call that could not be restarted',
            error: new MeetCoreStalledError('joinMeeting', false),
        },
        { name: 'a locked meeting', error: meetCoreError(MeetCoreErrorEnum.MeetingLocked) },
        { name: 'a skewed device clock', error: meetCoreError(MeetCoreErrorEnum.CheckDeviceClock) },
        { name: 'a LiveKit token rejection', error: ConnectionError.notAllowed('not allowed', 403) },
        { name: 'a LiveKit leave request', error: ConnectionError.leaveRequest('leave', 0) },
        { name: 'an unknown error', error: new Error('Group key or epoch is missing') },
    ])('fails at once on $name', async ({ error }) => {
        const attempt = vi.fn().mockRejectedValue(error);

        await expect(startRun(attempt).outcome).resolves.toEqual({ status: 'failed', attempts: 1, error });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does not attempt while offline, and attempts as soon as the browser is back online', async () => {
        isOnline = false;
        const attempt = vi.fn().mockResolvedValue(undefined);
        const { outcome } = startRun(attempt);

        await vi.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS - 1);
        expect(attempt).not.toHaveBeenCalled();

        goOnline();
        await expect(outcome).resolves.toEqual({ status: 'joined', attempts: 1 });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('attempts anyway every OFFLINE_RECHECK_MS while the browser reports offline', async () => {
        isOnline = false;
        const attempt = vi.fn().mockRejectedValueOnce(offlineError).mockResolvedValue(undefined);
        const { outcome } = startRun(attempt);

        await vi.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS);
        expect(attempt).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS - 1);
        expect(attempt).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);
        await expect(outcome).resolves.toEqual({ status: 'joined', attempts: 2 });
    });

    it('does not spend the retry budget on failures while offline', async () => {
        isOnline = false;
        const offlineFailures = 3;
        const attempt = vi.fn();
        for (let failure = 0; failure < offlineFailures; failure++) {
            attempt.mockRejectedValueOnce(offlineError);
        }
        REJOIN_RETRY_DELAYS_MS.forEach(() => attempt.mockRejectedValueOnce(networkError));
        attempt.mockResolvedValue(undefined);
        const { outcome } = startRun(attempt);

        await vi.advanceTimersByTimeAsync(offlineFailures * OFFLINE_RECHECK_MS);
        expect(attempt).toHaveBeenCalledTimes(offlineFailures);

        goOnline();
        await vi.advanceTimersByTimeAsync(allRetryDelaysMs);

        await expect(outcome).resolves.toEqual({
            status: 'joined',
            attempts: offlineFailures + REJOIN_RETRY_DELAYS_MS.length + 1,
        });
    });

    it('fails with the last error after OFFLINE_GIVE_UP_MS of offline time', async () => {
        isOnline = false;
        const attempt = vi.fn().mockRejectedValue(offlineError);
        const { outcome, isSettled } = startRun(attempt);

        await vi.advanceTimersByTimeAsync(OFFLINE_GIVE_UP_MS - 1);
        expect(isSettled()).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await expect(outcome).resolves.toEqual({
            status: 'failed',
            attempts: OFFLINE_GIVE_UP_MS / OFFLINE_RECHECK_MS,
            error: offlineError,
        });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('an online event cuts a retry delay short', async () => {
        const attempt = vi.fn().mockRejectedValueOnce(networkError).mockResolvedValue(undefined);
        const { outcome } = startRun(attempt);
        await vi.advanceTimersByTimeAsync(1);

        goOnline();

        await expect(outcome).resolves.toEqual({ status: 'joined', attempts: 2 });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('without retry delays or offline waits, makes exactly one attempt, even while offline', async () => {
        isOnline = false;
        const attempt = vi.fn().mockRejectedValue(offlineError);

        await expect(startRun(attempt, { retryDelaysMs: [], waitWhileOffline: false }).outcome).resolves.toEqual({
            status: 'failed',
            attempts: 1,
            error: offlineError,
        });
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each([
        { wait: 'a retry delay', offline: false, error: networkError },
        { wait: 'an offline wait', offline: true, error: offlineError },
    ])('aborting during $wait resolves cancelled at once and makes no further attempt', async ({ offline, error }) => {
        isOnline = !offline;
        const attempt = vi.fn().mockRejectedValue(error);
        const { outcome, controller } = startRun(attempt);
        await vi.advanceTimersByTimeAsync(offline ? OFFLINE_RECHECK_MS : 0);
        expect(attempt).toHaveBeenCalledTimes(1);

        controller.abort();

        await expect(outcome).resolves.toEqual({ status: 'cancelled', attempts: 1 });
        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(OFFLINE_GIVE_UP_MS + lastRetryDelayMs);
        expect(attempt).toHaveBeenCalledTimes(1);
    });

    it.each([
        { settles: 'succeeds', settle: (resolve: () => void) => resolve() },
        { settles: 'fails', settle: (_: () => void, reject: (error: unknown) => void) => reject(networkError) },
    ])('an attempt that $settles after the abort resolves cancelled', async ({ settle }) => {
        let resolveAttempt!: () => void;
        let rejectAttempt!: (error: unknown) => void;
        const attempt = vi.fn(
            () =>
                new Promise<void>((resolve, reject) => {
                    resolveAttempt = resolve;
                    rejectAttempt = reject;
                })
        );
        const { outcome, controller } = startRun(attempt);

        controller.abort();
        settle(resolveAttempt, rejectAttempt);

        await expect(outcome).resolves.toEqual({ status: 'cancelled', attempts: 1 });
        expect(attempt).toHaveBeenCalledTimes(1);
    });
});
