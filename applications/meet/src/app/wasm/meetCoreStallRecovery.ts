import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { SECOND } from '@proton/shared/lib/constants';

import type { MeetCoreClient } from './MeetCoreClient';

// Leaving and starting a join only wait on meet-core's state lock, so they normally return in
// milliseconds. Taking longer means a request holding that lock has hung (its HTTP client has no
// timeout), and every later call would queue behind it until that request fails.
export const MEET_CORE_STALL_TIMEOUT_MS = 5 * SECOND;

export const MEET_CORE_JOIN_TIMEOUT_MS = 20 * SECOND;

export class MeetCoreRestartedError extends Error {
    public constructor() {
        super('Meet core was restarted');
        this.name = 'MeetCoreRestartedError';
    }
}

export class MeetCoreStalledError extends Error {
    public readonly restarted: boolean;

    public constructor(name: string, restarted: boolean) {
        super(`Meet core ${name} stalled`);
        this.name = 'MeetCoreStalledError';
        this.restarted = restarted;
    }
}

/**
 * - `done`: the call settled in time
 * - `restarted`: the call was dropped and meet-core now runs on a fresh instance
 * - `stuck`: the call timed out and meet-core couldn't be restarted
 */
type MeetCoreCallOutcome = 'done' | 'restarted' | 'stuck';

interface MeetCoreCallOptions {
    name: string;
    reportMeetError: ReportMeetError;
    timeoutMs?: number;
    signal?: AbortSignal;
}

const TIMED_OUT = Symbol('timed out');

/**
 * Runs `call`, and if it hasn't settled within the timeout, reports it and restarts meet-core so the
 * calls that follow don't queue behind it.
 */
export const callMeetCoreOrRestart = async (
    meetCoreClient: MeetCoreClient,
    call: () => Promise<unknown>,
    { name, reportMeetError, timeoutMs = MEET_CORE_STALL_TIMEOUT_MS, signal }: MeetCoreCallOptions
): Promise<MeetCoreCallOutcome> => {
    signal?.throwIfAborted();

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let rejectOnAbort = () => {};
    const timeoutOrAbort = new Promise<typeof TIMED_OUT>((resolve, reject) => {
        timeoutId = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
        rejectOnAbort = () => reject(signal?.reason);
        signal?.addEventListener('abort', rejectOnAbort);
    });

    try {
        if ((await Promise.race([call(), timeoutOrAbort])) !== TIMED_OUT) {
            return 'done';
        }
    } catch (error) {
        // Another stalled call already restarted meet-core, which dropped this one
        if (error instanceof MeetCoreRestartedError) {
            return 'restarted';
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
        signal?.removeEventListener('abort', rejectOnAbort);
    }

    const restarted = await meetCoreClient.restart().catch(() => false);
    reportMeetError(`Meet core ${name} timed out`, { context: { timeoutMs, restarted } });

    return restarted ? 'restarted' : 'stuck';
};

export const callMeetCoreWithinDeadline = async <T>(
    meetCoreClient: MeetCoreClient,
    call: () => Promise<T>,
    options: MeetCoreCallOptions & { timeoutMs: number }
): Promise<T> => {
    let value!: T;
    const outcome = await callMeetCoreOrRestart(
        meetCoreClient,
        async () => {
            value = await call();
        },
        options
    );
    if (outcome !== 'done') {
        throw new MeetCoreStalledError(options.name, outcome === 'restarted');
    }
    return value;
};

export const leaveMeetingOrRestart = (meetCoreClient: MeetCoreClient, reportMeetError: ReportMeetError) =>
    callMeetCoreOrRestart(meetCoreClient, () => meetCoreClient.leaveMeeting(), {
        name: 'leaveMeeting',
        reportMeetError,
    });
