import { act, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';
import { STT_AGENT_PREFIX } from '@proton/meet/utils/agents';

import { CAPTIONS_AGENT_DISABLE_GRACE_MS, PROVIDER_FAILED_ERROR_CODE } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import type { MeetCoreClient } from '../../wasm/MeetCoreClient';
import { useCaptionsAgentLifecycle } from './useCaptionsAgentLifecycle';
import { useCaptionsAvailability } from './useCaptionsAvailability';
import { useCaptionsPreference } from './useCaptionsPreference';
import { useCaptionsWantersCount } from './useCaptionsWantersCount';

const consoleError = vi.fn();
const reportMeetError = vi.fn();
const createNotification = vi.fn();
const setWantsCaptions = vi.fn().mockResolvedValue(undefined);

const MEETING_LINK_NAME = 'meeting-link';

const errorWithCode = (message: string, code?: number): Error => {
    const err = new Error(message);
    if (typeof code === 'number') {
        (err as { code?: number }).code = code;
    }
    return err;
};

const state = vi.hoisted(() => ({
    joinedRoom: true,
    meetingLinkName: 'meeting-link',
    agentIdentities: [] as string[],
}));

vi.mock('@proton/meet', () => ({
    useMeetErrorReporting: () => ({ reportMeetError }),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification }),
}));

vi.mock('./useCaptionsPreference', () => ({
    useCaptionsPreference: vi.fn(),
}));

vi.mock('./useCaptionsAvailability', () => ({
    useCaptionsAvailability: vi.fn(),
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: (state: MeetState) => unknown) =>
        selector({
            connection: { joinedRoom: state.joinedRoom },
            currentMeeting: { meetingLinkName: state.meetingLinkName },
            agentParticipants: { agentIdentities: state.agentIdentities },
        } as unknown as MeetState),
}));

vi.mock('../../contexts/MeetCoreClientContext', () => ({
    useMeetCoreClient: vi.fn(),
}));

vi.mock('./useCaptionsWantersCount', () => ({
    useCaptionsWantersCount: vi.fn(),
}));

const createMeetCoreClient = () => ({
    requestClosedCaptions: vi.fn().mockResolvedValue(undefined),
    stopClosedCaptions: vi.fn().mockResolvedValue(undefined),
});

let meetCoreClient: ReturnType<typeof createMeetCoreClient>;

const mockLifecycleState = ({ wanters, agentPresent }: { wanters: number; agentPresent: boolean }) => {
    vi.mocked(useCaptionsWantersCount).mockReturnValue(wanters);
    state.agentIdentities = agentPresent ? [`${STT_AGENT_PREFIX}test-device`] : [];
};

const requestCalls = () => meetCoreClient.requestClosedCaptions.mock.calls;
const stopCalls = () => meetCoreClient.stopClosedCaptions.mock.calls;

const render = () => renderHook(() => useCaptionsAgentLifecycle());

const flush = () => act(async () => {});

const advance = (ms: number) =>
    act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });

describe('useCaptionsAgentLifecycle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(consoleError);
        meetCoreClient = createMeetCoreClient();
        vi.mocked(useMeetCoreClient).mockReturnValue(meetCoreClient as unknown as MeetCoreClient);
        vi.mocked(useCaptionsPreference).mockReturnValue({
            wantsCaptions: true,
            setWantsCaptions,
        });
        vi.mocked(useCaptionsAvailability).mockReturnValue({ isCaptionsDisabled: false });
        state.joinedRoom = true;
        state.agentIdentities = [];
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('asks for an agent once demand appears', async () => {
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(requestCalls()).toEqual([[MEETING_LINK_NAME]]);
    });

    it('asks once rather than on every participant update', async () => {
        mockLifecycleState({ wanters: 1, agentPresent: false });

        const { rerender } = render();
        await flush();

        mockLifecycleState({ wanters: 2, agentPresent: false });
        rerender();
        await flush();

        expect(requestCalls()).toHaveLength(1);
    });

    it('stops the agent once the grace period elapses without demand', async () => {
        mockLifecycleState({ wanters: 0, agentPresent: true });

        render();

        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS);

        expect(stopCalls()).toEqual([[MEETING_LINK_NAME]]);
    });

    it('cancels a request that has not produced an agent once demand disappears', async () => {
        mockLifecycleState({ wanters: 1, agentPresent: false });

        const { rerender } = render();
        await flush();
        expect(requestCalls()).toHaveLength(1);

        mockLifecycleState({ wanters: 0, agentPresent: false });
        rerender();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS);

        expect(stopCalls()).toHaveLength(1);
    });

    it('asks for nothing when there was never any demand', async () => {
        mockLifecycleState({ wanters: 0, agentPresent: false });

        render();

        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS);

        expect(requestCalls()).toHaveLength(0);
        expect(stopCalls()).toHaveLength(0);
    });

    it('does not ask to stop an agent that left on its own during the grace period', async () => {
        mockLifecycleState({ wanters: 0, agentPresent: true });

        const { rerender } = render();

        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS / 2);

        mockLifecycleState({ wanters: 0, agentPresent: false });
        rerender();

        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS);

        expect(stopCalls()).toHaveLength(0);
    });

    it('cancels the stop when demand returns during the grace period', async () => {
        mockLifecycleState({ wanters: 0, agentPresent: true });

        const { rerender } = render();

        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS / 2);

        mockLifecycleState({ wanters: 1, agentPresent: true });
        rerender();

        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS);

        expect(stopCalls()).toHaveLength(0);
        expect(requestCalls()).toHaveLength(0);
    });

    it('asks again when demand returns after a stop was already sent', async () => {
        mockLifecycleState({ wanters: 0, agentPresent: true });

        const { rerender } = render();

        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS);
        expect(stopCalls()).toHaveLength(1);

        mockLifecycleState({ wanters: 1, agentPresent: true });
        rerender();
        await flush();

        expect(requestCalls()).toHaveLength(1);
    });

    it('asks again when an agent leaves while captions are still wanted', async () => {
        mockLifecycleState({ wanters: 1, agentPresent: false });

        const { rerender } = render();
        await flush();
        expect(requestCalls()).toHaveLength(1);

        mockLifecycleState({ wanters: 1, agentPresent: true });
        rerender();
        await flush();

        mockLifecycleState({ wanters: 1, agentPresent: false });
        rerender();
        await flush();

        expect(requestCalls()).toHaveLength(2);
    });

    it('does not ask again while waiting for a first agent to arrive', async () => {
        mockLifecycleState({ wanters: 1, agentPresent: false });

        const { rerender } = render();
        await flush();

        rerender();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 3);

        expect(requestCalls()).toHaveLength(1);
    });

    it('stands down once the meeting has ended', async () => {
        state.joinedRoom = false;
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(requestCalls()).toHaveLength(0);
        expect(stopCalls()).toHaveLength(0);
    });

    it('does not ask for an agent while the host has captions disabled', async () => {
        vi.mocked(useCaptionsAvailability).mockReturnValue({ isCaptionsDisabled: true });
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 3);

        expect(requestCalls()).toHaveLength(0);
    });

    it('dismisses the agent when the host disables captions mid-meeting', async () => {
        mockLifecycleState({ wanters: 1, agentPresent: true });

        const { rerender } = render();
        await flush();

        vi.mocked(useCaptionsAvailability).mockReturnValue({ isCaptionsDisabled: true });
        rerender();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 2);

        expect(stopCalls()).toEqual([[MEETING_LINK_NAME]]);
    });

    it('reports a failed request to Sentry when the orchestrator flagged a provider failure', async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(
            errorWithCode('service unavailable', PROVIDER_FAILED_ERROR_CODE)
        );
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 3);

        expect(requestCalls()).toHaveLength(1);
        expect(reportMeetError).toHaveBeenCalledWith(
            'Failed to request live captions',
            expect.objectContaining({ context: { error: expect.any(Error) } })
        );
    });

    it('reports a failed stop to Sentry when the orchestrator flagged a provider failure', async () => {
        meetCoreClient.stopClosedCaptions.mockRejectedValue(
            errorWithCode('service unavailable', PROVIDER_FAILED_ERROR_CODE)
        );
        mockLifecycleState({ wanters: 0, agentPresent: true });

        render();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 3);

        expect(stopCalls()).toHaveLength(1);
        expect(reportMeetError).toHaveBeenCalledWith(
            'Failed to stop live captions',
            expect.objectContaining({ context: { error: expect.any(Error) } })
        );
    });

    it('reports a failed request to Sentry when the API returns a 5xx code', async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(errorWithCode('Internal server error', 500));
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(reportMeetError).toHaveBeenCalledTimes(1);
        expect(reportMeetError).toHaveBeenCalledWith(
            'Failed to request live captions',
            expect.objectContaining({ context: { error: expect.any(Error) } })
        );
    });

    it('does not report a policy refusal to Sentry (host-disabled captions, etc.)', async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(
            errorWithCode('Live captions have been disabled by the host', 2026)
        );
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('does not report a failure with no code to Sentry', async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(new Error('boom'));
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('shows the API error message in a toast when the failure is not a server error', async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(
            errorWithCode('Live captions have been disabled by the host', 2026)
        );
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
                text: 'Live captions have been disabled by the host',
            })
        );
    });

    it("shows a generic toast for a 5xx (the API's message is meaningless to the user)", async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(errorWithCode('Internal server error', 500));
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(createNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'error',
                text: 'Failed to request live captions',
            })
        );
    });

    it('clears the local wants-captions preference when the request fails, so the loading UI drops immediately', async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(
            errorWithCode('Live captions have been disabled by the host', 2026)
        );
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(setWantsCaptions).toHaveBeenCalledWith(false);
    });

    it('stays quiet on a failed request when this client did not ask for captions itself', async () => {
        vi.mocked(useCaptionsPreference).mockReturnValue({ wantsCaptions: false, setWantsCaptions });
        meetCoreClient.requestClosedCaptions.mockRejectedValue(
            errorWithCode('Live captions have been disabled by the host', 2026)
        );
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(requestCalls()).toHaveLength(1);
        expect(createNotification).not.toHaveBeenCalled();
        expect(setWantsCaptions).not.toHaveBeenCalled();
    });

    it('stays quiet on a failure with no code, leaving the takeover to run', async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(new Error('boom'));
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();

        expect(createNotification).not.toHaveBeenCalled();
        expect(setWantsCaptions).not.toHaveBeenCalled();
    });

    it('does not toast a failed stop, which nobody asked for', async () => {
        meetCoreClient.stopClosedCaptions.mockRejectedValue(errorWithCode('service unavailable', 500));
        mockLifecycleState({ wanters: 0, agentPresent: true });

        render();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 3);

        expect(stopCalls()).toHaveLength(1);
        expect(createNotification).not.toHaveBeenCalled();
    });

    it('does not touch the local wants-captions preference when a stop fails', async () => {
        meetCoreClient.stopClosedCaptions.mockRejectedValue(errorWithCode('service unavailable', 500));
        mockLifecycleState({ wanters: 0, agentPresent: true });

        render();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 3);

        expect(stopCalls()).toHaveLength(1);
        expect(setWantsCaptions).not.toHaveBeenCalled();
    });

    it('sends the opposite request when demand flips while core is staggering', async () => {
        let resolveRequest: () => void = () => {};
        meetCoreClient.requestClosedCaptions.mockReturnValue(
            new Promise<void>((resolve) => {
                resolveRequest = resolve;
            })
        );
        mockLifecycleState({ wanters: 1, agentPresent: false });

        const { rerender } = render();
        await flush();
        expect(requestCalls()).toHaveLength(1);

        mockLifecycleState({ wanters: 0, agentPresent: false });
        rerender();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS);
        expect(stopCalls()).toHaveLength(0);

        await act(async () => {
            resolveRequest();
        });

        expect(stopCalls()).toHaveLength(1);
    });
});
