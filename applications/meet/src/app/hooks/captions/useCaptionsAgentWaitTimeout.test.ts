import { act, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';
import { STT_AGENT_PREFIX } from '@proton/meet/utils/agents';

import { CAPTIONS_AGENT_WAIT_MS } from '../../constants';
import { DEFAULT_RETRY_DELAYS_MS } from '../../utils/retry';
import { useCaptionsAgentWaitTimeout } from './useCaptionsAgentWaitTimeout';
import { useCaptionsPreference } from './useCaptionsPreference';

const createNotification = vi.fn();
const setWantsCaptions = vi.fn();
const consoleError = vi.fn();

const state = vi.hoisted(() => ({ joinedRoom: true, agentIdentities: [] as string[] }));

vi.mock('@proton/components/hooks/useNotifications', () => ({
    default: () => ({ createNotification }),
}));

// Runs the real selectors against a minimal state, rather than stubbing their results.
vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: (state: MeetState) => unknown) =>
        selector({
            connection: { joinedRoom: state.joinedRoom },
            agentParticipants: { agentIdentities: state.agentIdentities },
        } as unknown as MeetState),
}));

vi.mock('./useCaptionsPreference', () => ({
    useCaptionsPreference: vi.fn(),
}));

const mockCaptionsState = ({ wantsCaptions, agentPresent }: { wantsCaptions: boolean; agentPresent: boolean }) => {
    vi.mocked(useCaptionsPreference).mockReturnValue({ wantsCaptions, setWantsCaptions });
    state.agentIdentities = agentPresent ? [`${STT_AGENT_PREFIX}test-device`] : [];
};

const advance = (ms: number) =>
    act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });

// Long enough for every attempt at writing the preference.
const ALL_RETRIES_MS = DEFAULT_RETRY_DELAYS_MS.reduce((total, delay) => total + delay, 0);

describe('useCaptionsAgentWaitTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(consoleError);
        setWantsCaptions.mockReset();
        setWantsCaptions.mockResolvedValue(undefined);
        state.joinedRoom = true;
        state.agentIdentities = [];
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('turns captions off and notifies when the agent never joins', () => {
        mockCaptionsState({ wantsCaptions: true, agentPresent: false });

        renderHook(() => useCaptionsAgentWaitTimeout());

        act(() => {
            vi.advanceTimersByTime(CAPTIONS_AGENT_WAIT_MS);
        });

        expect(setWantsCaptions).toHaveBeenCalledWith(false);
        expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('does not give up while the wait window has not elapsed', () => {
        mockCaptionsState({ wantsCaptions: true, agentPresent: false });

        renderHook(() => useCaptionsAgentWaitTimeout());

        act(() => {
            vi.advanceTimersByTime(CAPTIONS_AGENT_WAIT_MS - 1);
        });

        expect(setWantsCaptions).not.toHaveBeenCalled();
    });

    it('does not restart the wait when unrelated re-renders happen', () => {
        mockCaptionsState({ wantsCaptions: true, agentPresent: false });

        const { rerender } = renderHook(() => useCaptionsAgentWaitTimeout());

        act(() => {
            vi.advanceTimersByTime(CAPTIONS_AGENT_WAIT_MS / 2);
        });
        rerender();
        act(() => {
            vi.advanceTimersByTime(CAPTIONS_AGENT_WAIT_MS / 2);
        });

        expect(setWantsCaptions).toHaveBeenCalledWith(false);
    });

    it('cancels the wait once the agent joins', () => {
        mockCaptionsState({ wantsCaptions: true, agentPresent: false });

        const { rerender } = renderHook(() => useCaptionsAgentWaitTimeout());

        mockCaptionsState({ wantsCaptions: true, agentPresent: true });
        rerender();

        act(() => {
            vi.advanceTimersByTime(CAPTIONS_AGENT_WAIT_MS);
        });

        expect(setWantsCaptions).not.toHaveBeenCalled();
        expect(createNotification).not.toHaveBeenCalled();
    });

    it('does not run while the local participant does not want captions', () => {
        mockCaptionsState({ wantsCaptions: false, agentPresent: false });

        renderHook(() => useCaptionsAgentWaitTimeout());

        act(() => {
            vi.advanceTimersByTime(CAPTIONS_AGENT_WAIT_MS);
        });

        expect(setWantsCaptions).not.toHaveBeenCalled();
    });

    it('stays quiet when the agent disappears because the meeting ended', () => {
        state.joinedRoom = false;
        mockCaptionsState({ wantsCaptions: true, agentPresent: false });

        renderHook(() => useCaptionsAgentWaitTimeout());

        act(() => {
            vi.advanceTimersByTime(CAPTIONS_AGENT_WAIT_MS);
        });

        expect(setWantsCaptions).not.toHaveBeenCalled();
        expect(createNotification).not.toHaveBeenCalled();
    });

    it('retries turning captions off when the attribute write fails', async () => {
        setWantsCaptions.mockRejectedValueOnce(new Error('metadata update timed out'));
        mockCaptionsState({ wantsCaptions: true, agentPresent: false });

        renderHook(() => useCaptionsAgentWaitTimeout());

        await advance(CAPTIONS_AGENT_WAIT_MS);

        expect(setWantsCaptions).toHaveBeenCalledTimes(1);

        // The effect cannot re-arm on its own, so the give-up has to keep trying.
        await advance(ALL_RETRIES_MS);

        expect(setWantsCaptions).toHaveBeenCalledTimes(2);
    });

    it('logs once every attempt at turning captions off has failed', async () => {
        setWantsCaptions.mockRejectedValue(new Error('metadata update timed out'));
        mockCaptionsState({ wantsCaptions: true, agentPresent: false });

        renderHook(() => useCaptionsAgentWaitTimeout());

        await advance(CAPTIONS_AGENT_WAIT_MS + ALL_RETRIES_MS);

        expect(setWantsCaptions).toHaveBeenCalledTimes(DEFAULT_RETRY_DELAYS_MS.length);
        expect(consoleError).toHaveBeenCalledWith('Failed to turn live captions off', expect.any(Error));
    });

    it('stops retrying once the agent turns up', async () => {
        setWantsCaptions.mockRejectedValue(new Error('metadata update timed out'));
        mockCaptionsState({ wantsCaptions: true, agentPresent: false });

        const { rerender } = renderHook(() => useCaptionsAgentWaitTimeout());

        await advance(CAPTIONS_AGENT_WAIT_MS);
        expect(setWantsCaptions).toHaveBeenCalledTimes(1);

        // The retries have nothing left to turn off.
        mockCaptionsState({ wantsCaptions: true, agentPresent: true });
        rerender();

        await advance(ALL_RETRIES_MS);

        expect(setWantsCaptions).toHaveBeenCalledTimes(1);
    });

    it('says captions stopped rather than never started when the agent had been there', async () => {
        mockCaptionsState({ wantsCaptions: true, agentPresent: true });

        const { rerender } = renderHook(() => useCaptionsAgentWaitTimeout());

        mockCaptionsState({ wantsCaptions: true, agentPresent: false });
        rerender();

        await advance(CAPTIONS_AGENT_WAIT_MS);

        expect(createNotification).toHaveBeenCalledWith(
            expect.objectContaining({ text: expect.stringContaining('stopped') })
        );
    });
});
