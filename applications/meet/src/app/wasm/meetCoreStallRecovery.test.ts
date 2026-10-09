import { createMeetCoreClientMock } from './__mocks__/MeetCoreClient.mock';
import {
    MEET_CORE_STALL_TIMEOUT_MS,
    MeetCoreRestartedError,
    callMeetCoreOrRestart,
    leaveMeetingOrRestart,
} from './meetCoreStallRecovery';

const neverSettles = () => new Promise<void>(() => {});

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

    it('treats a call dropped by another restart as restarted', async () => {
        const meetCoreClient = createMeetCoreClientMock();
        const reportMeetError = vi.fn();

        const outcome = await callMeetCoreOrRestart(
            meetCoreClient,
            () => Promise.reject(new MeetCoreRestartedError()),
            { name: 'leaveMeeting', reportMeetError }
        );

        expect(outcome).toBe('restarted');
        expect(meetCoreClient.restart).not.toHaveBeenCalled();
        expect(reportMeetError).not.toHaveBeenCalled();
    });
});

describe('leaveMeetingOrRestart', () => {
    it('leaves the meeting', async () => {
        const meetCoreClient = createMeetCoreClientMock();

        await expect(leaveMeetingOrRestart(meetCoreClient, vi.fn())).resolves.toBe('done');
        expect(meetCoreClient.leaveMeeting).toHaveBeenCalledTimes(1);
    });
});
