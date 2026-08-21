import { act, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';
import { STT_AGENT_PREFIX } from '@proton/meet/utils/agents';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { setupAgentLeftEvent, setupAgentPendingEvent } from '../../utils/wasmUtils';
import type { MeetCoreClient } from '../../wasm/MeetCoreClient';
import { useLiveCaptionsFeatureEnabled } from '../captions/useLiveCaptionsFeatureEnabled';
import { ADMISSION_SETTLE_MS, RECONCILE_DELAY_MS, useMlsSession } from './useMlsSession';

const reportMeetError = vi.fn();

const state = vi.hoisted(() => ({ agentIdentities: [] as string[] }));

vi.mock('@proton/components/hooks/useAuthentication', () => ({
    default: () => ({ hasSession: () => true, getUID: () => 'session-uid' }),
}));

vi.mock('@proton/meet', () => ({
    useMeetErrorReporting: () => ({ reportMeetError }),
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetDispatch: () => vi.fn(),
    // Runs the real selector against a minimal state, rather than stubbing its result.
    useMeetSelector: (selector: (state: MeetState) => unknown) =>
        selector({ agentParticipants: { agentIdentities: state.agentIdentities } } as unknown as MeetState),
}));

vi.mock('../../contexts/MeetCoreClientContext', () => ({
    useMeetCoreClient: vi.fn(),
}));

vi.mock('../captions/useLiveCaptionsFeatureEnabled', () => ({
    useLiveCaptionsFeatureEnabled: vi.fn(),
}));

vi.mock('../../utils/wasmUtils', () => ({
    setupAgentPendingEvent: vi.fn(),
    setupAgentLeftEvent: vi.fn(),
    setupLiveKitAdminChangeEvent: vi.fn(),
    setupWasmDependencies: vi.fn(),
}));

vi.mock('../useNotifyError', () => ({
    useNotifyError: () => vi.fn(),
}));

const MEETING_LINK_NAME = 'meeting-link';
const MEETING_PASSWORD = 'meeting-password';
const AGENT_DEVICE_ID = 'agent-device-1';

const createMeetCoreClient = () => ({
    joinMeetingWithAccessTokenWithSwitchJoinType: vi.fn().mockResolvedValue(undefined),
    setMlsGroupUpdateHandler: vi.fn().mockResolvedValue(undefined),
    setLiveKitAdminChangeHandler: vi.fn().mockResolvedValue(undefined),
    setMlsSyncStateUpdateHandler: vi.fn().mockResolvedValue(undefined),
    setAgentPendingHandler: vi.fn().mockResolvedValue(undefined),
    setAgentLeftHandler: vi.fn().mockResolvedValue(undefined),
    listPendingAgents: vi.fn().mockResolvedValue([]),
    admitAgent: vi.fn().mockResolvedValue(undefined),
    getGroupKey: vi.fn().mockResolvedValue({ key: 'group-key', epoch: 1n }),
    getGroupDisplayCode: vi.fn().mockResolvedValue({ full_code: 'display-code' }),
});

let meetCoreClient: ReturnType<typeof createMeetCoreClient>;

const createParams = () => ({
    getGroupKeyInfo: vi.fn().mockResolvedValue({ key: 'group-key', epoch: 1n }),
    onNewGroupKeyInfo: vi.fn().mockResolvedValue(undefined),
    updateAdminParticipant: vi.fn().mockResolvedValue(undefined),
    allowHealthCheck: vi.fn(),
    triggerFullReconnectionRef: { current: vi.fn() },
    currentKeyRef: { current: null },
    mlsGroupStateRef: { current: null },
});

// The wasm side announces a pending agent through this callback.
const notifyAgentPending = async (deviceId: string) => {
    const [{ onAgentPending }] = vi.mocked(setupAgentPendingEvent).mock.calls[0];
    await act(async () => {
        await onAgentPending(deviceId);
    });
};

const notifyAgentLeft = async (deviceId: string) => {
    const [{ onAgentLeft }] = vi.mocked(setupAgentLeftEvent).mock.calls[0];
    await act(async () => {
        await onAgentLeft(deviceId);
    });
};

const setup = async ({ liveCaptionsEnabled = true }: { liveCaptionsEnabled?: boolean } = {}) => {
    vi.mocked(useLiveCaptionsFeatureEnabled).mockReturnValue(liveCaptionsEnabled);
    state.agentIdentities = [];

    const rendered = renderHook(() => useMlsSession(createParams()));

    await act(async () => {
        await rendered.result.current.handleMlsSetup(MEETING_LINK_NAME, 'access-token', MEETING_PASSWORD);
    });

    // Only what happens after joining is under test.
    meetCoreClient.listPendingAgents.mockClear();
    reportMeetError.mockClear();

    // An agent turning up in the room is what prompts a catch-up pass.
    const agentJoins = async () => {
        state.agentIdentities = [`${STT_AGENT_PREFIX}test-device`];
        rendered.rerender();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(RECONCILE_DELAY_MS);
        });
    };

    return { ...rendered, agentJoins };
};

const reconcileWarnings = () =>
    reportMeetError.mock.calls.filter(([label]) => label === 'Captions agent was still unadmitted when reconciling');

describe('useMlsSession', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        meetCoreClient = createMeetCoreClient();
        vi.mocked(useMeetCoreClient).mockReturnValue(meetCoreClient as unknown as MeetCoreClient);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('admits an agent the wasm side reports as pending', async () => {
        await setup();

        await notifyAgentPending(AGENT_DEVICE_ID);

        expect(meetCoreClient.admitAgent).toHaveBeenCalledWith(MEETING_LINK_NAME, AGENT_DEVICE_ID, MEETING_PASSWORD);
    });

    // meet-core staggers the commit by rank and drops out if the epoch already advanced, so there is
    // no client-side election left to gate this.
    it('admits without waiting to be elected', async () => {
        await setup();

        await notifyAgentPending(AGENT_DEVICE_ID);

        expect(meetCoreClient.admitAgent).toHaveBeenCalledTimes(1);
    });

    it('treats an agent still listed as pending after the event as nothing to report', async () => {
        const { agentJoins } = await setup();

        await notifyAgentPending(AGENT_DEVICE_ID);
        // The backend has not caught up with the admission we just made, which is ordinary.
        meetCoreClient.listPendingAgents.mockResolvedValue([AGENT_DEVICE_ID]);

        await agentJoins();

        expect(reconcileWarnings()).toHaveLength(0);
    });

    it('admits and reports an agent that no pending event ever arrived for', async () => {
        const { agentJoins } = await setup();

        // Pending, yet neither the event nor the catch-up pass at join time knew about it.
        meetCoreClient.listPendingAgents.mockResolvedValue([AGENT_DEVICE_ID]);
        await agentJoins();

        expect(meetCoreClient.admitAgent).toHaveBeenCalledWith(MEETING_LINK_NAME, AGENT_DEVICE_ID, MEETING_PASSWORD);
        expect(reconcileWarnings()).toHaveLength(1);
    });

    it('waits out the grace period before reconciling', async () => {
        const { rerender } = await setup();

        meetCoreClient.listPendingAgents.mockResolvedValue([AGENT_DEVICE_ID]);
        state.agentIdentities = [`${STT_AGENT_PREFIX}test-device`];
        rerender();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(RECONCILE_DELAY_MS - 1);
        });

        expect(meetCoreClient.listPendingAgents).not.toHaveBeenCalled();
    });

    it('admits again when an admission never took effect', async () => {
        const { agentJoins } = await setup();

        await notifyAgentPending(AGENT_DEVICE_ID);
        expect(meetCoreClient.admitAgent).toHaveBeenCalledTimes(1);

        // The backend still lists it once the admission should long since have settled, so it never
        // made it into the group.
        meetCoreClient.listPendingAgents.mockResolvedValue([AGENT_DEVICE_ID]);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(ADMISSION_SETTLE_MS);
        });
        await agentJoins();

        expect(meetCoreClient.admitAgent).toHaveBeenCalledTimes(2);
        expect(reconcileWarnings()).toHaveLength(1);
    });

    it('does not poll for pending agents while the feature is off', async () => {
        const { agentJoins } = await setup({ liveCaptionsEnabled: false });

        meetCoreClient.listPendingAgents.mockResolvedValue([AGENT_DEVICE_ID]);
        await agentJoins();

        expect(meetCoreClient.listPendingAgents).not.toHaveBeenCalled();
    });

    // Otherwise whether the agent reaches the group would depend on which participant holds the flag.
    it('still admits an agent another client summoned while the feature is off', async () => {
        await setup({ liveCaptionsEnabled: false });

        await notifyAgentPending(AGENT_DEVICE_ID);

        expect(meetCoreClient.admitAgent).toHaveBeenCalledWith(MEETING_LINK_NAME, AGENT_DEVICE_ID, MEETING_PASSWORD);
    });

    it('admits an agent again after it has left and come back', async () => {
        await setup();

        await notifyAgentPending(AGENT_DEVICE_ID);
        await notifyAgentLeft(AGENT_DEVICE_ID);
        await notifyAgentPending(AGENT_DEVICE_ID);

        expect(meetCoreClient.admitAgent).toHaveBeenCalledTimes(2);
    });
});
