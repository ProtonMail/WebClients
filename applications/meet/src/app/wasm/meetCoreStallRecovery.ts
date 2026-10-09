import type { ReportMeetError } from '@proton/meet/hooks/useMeetErrorReporting';
import { SECOND } from '@proton/shared/lib/constants';

import type { MeetCoreClient } from './MeetCoreClient';

// Leaving and starting a join only wait on meet-core's state lock, so they normally return in
// milliseconds. Taking longer means a request holding that lock has hung (its HTTP client has no
// timeout), and every later call would queue behind it until that request fails.
export const MEET_CORE_STALL_TIMEOUT_MS = 5 * SECOND;

export class MeetCoreRestartedError extends Error {
    public constructor() {
        super('Meet core was restarted');
        this.name = 'MeetCoreRestartedError';
    }
}

/**
 * - `done`: the call settled in time
 * - `restarted`: the call was dropped and meet-core now runs on a fresh instance
 * - `stuck`: the call timed out and meet-core couldn't be restarted
 */
type MeetCoreCallOutcome = 'done' | 'restarted' | 'stuck';

const TIMED_OUT = Symbol('timed out');

/**
 * Runs `call`, and if it hasn't settled within the timeout, reports it and restarts meet-core so the
 * calls that follow don't queue behind it. Rejects only when `call` itself fails.
 */
export const callMeetCoreOrRestart = async (
    meetCoreClient: MeetCoreClient,
    call: () => Promise<unknown>,
    {
        name,
        reportMeetError,
        timeoutMs = MEET_CORE_STALL_TIMEOUT_MS,
    }: { name: string; reportMeetError: ReportMeetError; timeoutMs?: number }
): Promise<MeetCoreCallOutcome> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<typeof TIMED_OUT>((resolve) => {
        timeoutId = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
    });

    try {
        if ((await Promise.race([call(), timeout])) !== TIMED_OUT) {
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
    }

    const restarted = await meetCoreClient.restart().catch(() => false);
    reportMeetError(`Meet core ${name} timed out`, { context: { timeoutMs, restarted } });

    return restarted ? 'restarted' : 'stuck';
};

export const leaveMeetingOrRestart = (meetCoreClient: MeetCoreClient, reportMeetError: ReportMeetError) =>
    callMeetCoreOrRestart(meetCoreClient, () => meetCoreClient.leaveMeeting(), {
        name: 'leaveMeeting',
        reportMeetError,
    });
