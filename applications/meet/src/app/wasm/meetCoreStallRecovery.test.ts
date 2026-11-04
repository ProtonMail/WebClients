import type { MeetCoreClient } from './MeetCoreClient';
import { createMeetCoreClientMock } from './__mocks__/MeetCoreClient.mock';
import {
    MEET_CORE_JOIN_TIMEOUT_MS,
    MEET_CORE_STALL_TIMEOUT_MS,
    MeetCoreRestartedError,
    MeetCoreStalledError,
    callMeetCoreOrRestart,
    callMeetCoreWithinDeadline,
    leaveMeetingOrRestart,
} from './meetCoreStallRecovery';

const neverSettles = () => new Promise<void>(() => {});
const mlsSetupDroppedByRestart = () =>
    Object.assign(new Error('MLS setup failed'), { coreError: new MeetCoreRestartedError() });

describe('callMeetCoreOrRestart', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('returns done without restarting when the call settles in time', async () => {
        const meetCoreClient = createMeetCoreClientMock();
        const reportMeetError = vi.fn();

        const outcome = await callMeetCoreOrRestart(meetCoreClient, () => Promise.resolve(), {
            name: 'leaveMeeting',
            reportMeetError,
        });

        expect(outcome).toBe('done');
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('reports and restarts meet-core when the call does not settle in time', async () => {
        const meetCoreClient = createMeetCoreClientMock();
        const reportMeetError = vi.fn();

        const outcomePromise = callMeetCoreOrRestart(meetCoreClient, neverSettles, {
            name: 'leaveMeeting',
            reportMeetError,
        });

        await vi.advanceTimersByTimeAsync(MEET_CORE_STALL_TIMEOUT_MS - 1);
        expect(meetCoreClient.restart).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);

        await expect(outcomePromise).resolves.toBe('restarted');
        expect(meetCoreClient.restart).toHaveBeenCalledTimes(1);
        expect(reportMeetError).toHaveBeenCalledWith('Meet core leaveMeeting timed out', {
            context: { timeoutMs: MEET_CORE_STALL_TIMEOUT_MS, restarted: true },
        });
    });

    it('returns stuck when meet-core cannot be restarted', async () => {
        const meetCoreClient = createMeetCoreClientMock({ restart: vi.fn().mockResolvedValue(false) });
        const reportMeetError = vi.fn();

        const outcomePromise = callMeetCoreOrRestart(meetCoreClient, neverSettles, {
            name: 'leaveMeeting',
            reportMeetError,
        });
        await vi.advanceTimersByTimeAsync(MEET_CORE_STALL_TIMEOUT_MS);

        await expect(outcomePromise).resolves.toBe('stuck');
        expect(reportMeetError).toHaveBeenCalledWith('Meet core leaveMeeting timed out', {
            context: { timeoutMs: MEET_CORE_STALL_TIMEOUT_MS, restarted: false },
        });
    });

    it('rethrows when the call fails, without restarting', async () => {
        const meetCoreClient = createMeetCoreClientMock();
        const error = new Error('boom');

        await expect(
            callMeetCoreOrRestart(meetCoreClient, () => Promise.reject(error), {
                name: 'leaveMeeting',
                reportMeetError: vi.fn(),
            })
        ).rejects.toBe(error);
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
    });

    it.each([
        { call: 'a meet-core call', error: () => new MeetCoreRestartedError() },
        { call: 'an MLS setup', error: mlsSetupDroppedByRestart },
    ])('treats $call dropped by another restart as restarted', async ({ error }) => {
        const meetCoreClient = createMeetCoreClientMock();
        const reportMeetError = vi.fn();

        const outcome = await callMeetCoreOrRestart(meetCoreClient, () => Promise.reject(error()), {
            name: 'leaveMeeting',
            reportMeetError,
        });

        expect(outcome).toBe('restarted');
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('stops waiting when the signal aborts, without restarting', async () => {
        const meetCoreClient = createMeetCoreClientMock();
        const reportMeetError = vi.fn();
        const controller = new AbortController();

        const outcomePromise = callMeetCoreOrRestart(meetCoreClient, neverSettles, {
            name: 'joinMeeting',
            reportMeetError,
            signal: controller.signal,
        });
        controller.abort();
        const rejection = expect(outcomePromise).rejects.toBe(controller.signal.reason);
        await vi.advanceTimersByTimeAsync(MEET_CORE_STALL_TIMEOUT_MS);

        await rejection;
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('does not start the call when the signal has already aborted', async () => {
        const meetCoreClient = createMeetCoreClientMock();
        const call = vi.fn().mockResolvedValue(undefined);
        const controller = new AbortController();
        controller.abort();

        await expect(
            callMeetCoreOrRestart(meetCoreClient, call, {
                name: 'joinMeeting',
                reportMeetError: vi.fn(),
                signal: controller.signal,
            })
        ).rejects.toBe(controller.signal.reason);
        expect(call).not.toHaveBeenCalled();
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
    });
});

describe('callMeetCoreWithinDeadline', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const callWithinJoinDeadline = <T>(
        meetCoreClient: MeetCoreClient,
        call: () => Promise<T>,
        reportMeetError = vi.fn()
    ) =>
        callMeetCoreWithinDeadline(meetCoreClient, call, {
            name: 'joinMeeting',
            reportMeetError,
            timeoutMs: MEET_CORE_JOIN_TIMEOUT_MS,
        });

    it('returns what the call returned when it settles in time', async () => {
        const meetCoreClient = createMeetCoreClientMock();

        await expect(
            callWithinJoinDeadline(meetCoreClient, () => Promise.resolve({ key: 'group-key', epoch: 1n }))
        ).resolves.toEqual({ key: 'group-key', epoch: 1n });
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
    });

    it('restarts meet-core once and throws a stall that says so when the call outlives the deadline', async () => {
        const meetCoreClient = createMeetCoreClientMock();
        const reportMeetError = vi.fn();

        const callPromise = callWithinJoinDeadline(meetCoreClient, neverSettles, reportMeetError);
        const rejection = expect(callPromise).rejects.toThrow(MeetCoreStalledError);
        await vi.advanceTimersByTimeAsync(MEET_CORE_JOIN_TIMEOUT_MS - 1);
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);

        await rejection;
        await expect(callPromise).rejects.toMatchObject({ restarted: true });
        expect(meetCoreClient.restart).toHaveBeenCalledTimes(1);
        expect(reportMeetError).toHaveBeenCalledWith('Meet core joinMeeting timed out', {
            context: { timeoutMs: MEET_CORE_JOIN_TIMEOUT_MS, restarted: true },
        });
    });

    it('throws a stall that says meet-core was not restarted when it cannot be', async () => {
        const meetCoreClient = createMeetCoreClientMock({ restart: vi.fn().mockResolvedValue(false) });

        const callPromise = callWithinJoinDeadline(meetCoreClient, neverSettles);
        const rejection = expect(callPromise).rejects.toThrow(MeetCoreStalledError);
        await vi.advanceTimersByTimeAsync(MEET_CORE_JOIN_TIMEOUT_MS);

        await rejection;
        await expect(callPromise).rejects.toMatchObject({ restarted: false });
    });

    it('rethrows the call failing on its own, without restarting', async () => {
        const meetCoreClient = createMeetCoreClientMock();
        const error = new Error('boom');

        await expect(callWithinJoinDeadline(meetCoreClient, () => Promise.reject(error))).rejects.toBe(error);
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
    });

    it('throws a stall that says meet-core was restarted when another restart dropped the MLS setup', async () => {
        const meetCoreClient = createMeetCoreClientMock();

        const callPromise = callWithinJoinDeadline(meetCoreClient, () => Promise.reject(mlsSetupDroppedByRestart()));

        await expect(callPromise).rejects.toThrow(MeetCoreStalledError);
        await expect(callPromise).rejects.toMatchObject({ restarted: true });
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
    });
});

describe('leaveMeetingOrRestart', () => {
    it('leaves the meeting', async () => {
        const meetCoreClient = createMeetCoreClientMock();

        await expect(leaveMeetingOrRestart(meetCoreClient, vi.fn())).resolves.toBe('done');
        expect(meetCoreClient.leaveMeeting).toHaveBeenCalledTimes(1);
    });
});
