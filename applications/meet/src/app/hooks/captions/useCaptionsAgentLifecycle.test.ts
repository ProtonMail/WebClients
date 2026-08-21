import { act, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';
import { STT_AGENT_PREFIX } from '@proton/meet/utils/agents';

import { CAPTIONS_AGENT_DISABLE_GRACE_MS } from '../../constants';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import type { MeetCoreClient } from '../../wasm/MeetCoreClient';
import { useCaptionsAgentLifecycle } from './useCaptionsAgentLifecycle';
import { useCaptionsWantersCount } from './useCaptionsWantersCount';

const consoleError = vi.fn();
const reportMeetError = vi.fn();

const MEETING_LINK_NAME = 'meeting-link';

const state = vi.hoisted(() => ({
    joinedRoom: true,
    meetingLinkName: 'meeting-link',
    agentIdentities: [] as string[],
}));

vi.mock('@proton/meet', () => ({
    useMeetErrorReporting: () => ({ reportMeetError }),
}));

// Runs the real selector against a minimal state, rather than stubbing its result.
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

// One act block per waiting period: a timer armed by an effect is only armed once React has
// flushed, which act does on exit.
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

        // The agent is still in the room while the backend tears it down.
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

        // The agent dropped out of the group with captions still switched on.
        mockLifecycleState({ wanters: 1, agentPresent: false });
        rerender();
        await flush();

        expect(requestCalls()).toHaveLength(2);
    });

    it('does not ask again while waiting for a first agent to arrive', async () => {
        mockLifecycleState({ wanters: 1, agentPresent: false });

        const { rerender } = render();
        await flush();

        // Core is still staggering, so the agent is legitimately absent for a while.
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

    // Core arbitrates a takeover by a later-ranked client, so a failure here is reported and left
    // alone rather than retried locally.
    it('reports a failed request without retrying it', async () => {
        meetCoreClient.requestClosedCaptions.mockRejectedValue(new Error('service unavailable'));
        mockLifecycleState({ wanters: 1, agentPresent: false });

        render();
        await flush();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 3);

        expect(requestCalls()).toHaveLength(1);
        expect(reportMeetError).toHaveBeenCalledWith(
            'Failed to request closed captions',
            expect.objectContaining({ context: { error: expect.any(Error) } })
        );
    });

    it('reports a failed stop without retrying it', async () => {
        meetCoreClient.stopClosedCaptions.mockRejectedValue(new Error('service unavailable'));
        mockLifecycleState({ wanters: 0, agentPresent: true });

        render();
        await advance(CAPTIONS_AGENT_DISABLE_GRACE_MS * 3);

        expect(stopCalls()).toHaveLength(1);
        expect(reportMeetError).toHaveBeenCalledWith(
            'Failed to stop closed captions',
            expect.objectContaining({ context: { error: expect.any(Error) } })
        );
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

        // Demand disappears while the request is still in core's stagger.
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
