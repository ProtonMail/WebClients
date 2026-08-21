import { useRoomContext } from '@livekit/components-react';
import { act, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { MERGE_GAP_MS, READY_TIMEOUT_MS, useTranscriptions } from './useTranscriptions';

const reportMeetError = vi.fn();
const decryptMessage = vi.fn();

const state = vi.hoisted(() => ({ agentIdentities: [] as string[] }));

vi.mock('@proton/meet', () => ({
    useMeetErrorReporting: () => ({ reportMeetError }),
}));

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('../../contexts/MeetCoreClientContext', () => ({
    useMeetCoreClient: vi.fn(),
}));

// Runs the real selector against a minimal state, rather than stubbing its result.
vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: (state: MeetState) => unknown) =>
        selector({ agentParticipants: { agentIdentities: state.agentIdentities } } as unknown as MeetState),
}));

const AGENT_IDENTITY = 'SttAgent#1';
const SPEAKER_IDENTITY = 'speaker-1';
const SPEAKER_TRACK_SID = 'TR_speaker_1';

type StreamHandler = (reader: unknown, info: { identity?: string }) => Promise<void>;

let handler: StreamHandler;

const mockRoom = () => {
    // A fresh room per test, so the module-level "one consumer per room" guard stays clear.
    const room = {
        localParticipant: { identity: 'me', trackPublications: new Map() },
        remoteParticipants: new Map<string, unknown>([
            [AGENT_IDENTITY, { isAgent: true, identity: AGENT_IDENTITY, trackPublications: new Map() }],
            [
                SPEAKER_IDENTITY,
                {
                    isAgent: false,
                    identity: SPEAKER_IDENTITY,
                    trackPublications: new Map([['microphone', { trackSid: SPEAKER_TRACK_SID }]]),
                },
            ],
        ]),
        registerTextStreamHandler: vi.fn((_topic: string, streamHandler: StreamHandler) => {
            handler = streamHandler;
        }),
        unregisterTextStreamHandler: vi.fn(),
    };

    vi.mocked(useRoomContext).mockReturnValue(room as never);

    return room;
};

// An empty trackSid stands for a segment whose speaker could not be resolved.
const createReader = (payload: string, { id = 'segment-1', isFinal = true, trackSid = SPEAKER_TRACK_SID } = {}) => ({
    info: {
        id,
        attributes: {
            'lk.transcription_final': isFinal ? 'true' : 'false',
            'lk.transcribed_track_id': trackSid,
        },
    },
    async *[Symbol.asyncIterator]() {
        yield payload;
    },
});

const emit = async (payload: string, options?: { id?: string; isFinal?: boolean; trackSid?: string }) => {
    await act(async () => {
        await handler(createReader(payload, options), { identity: AGENT_IDENTITY });
    });
};

describe('useTranscriptions', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(useMeetCoreClient).mockReturnValue({ decryptMessage } as never);
        state.agentIdentities = [AGENT_IDENTITY];
        decryptMessage.mockResolvedValue({ message: 'hello there' });
        mockRoom();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('reports an agent that joined but never published anything', () => {
        renderHook(() => useTranscriptions());

        act(() => {
            vi.advanceTimersByTime(READY_TIMEOUT_MS);
        });

        expect(reportMeetError).toHaveBeenCalledWith(
            'Captions agent published no transcriptions',
            expect.objectContaining({ level: 'warning' })
        );
    });

    it('neither blames the agent nor claims to be ready with no consumer registered', () => {
        // A failed registration is the only way this hook ends up watching nothing.
        mockRoom().registerTextStreamHandler.mockImplementation(() => {
            throw new Error('another consumer owns lk.transcription');
        });

        const { result } = renderHook(() => useTranscriptions());

        act(() => {
            vi.advanceTimersByTime(READY_TIMEOUT_MS);
        });

        expect(result.current.status).toBe('loading');
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('stays loading until the agent has joined', () => {
        state.agentIdentities = [];

        const { result, rerender } = renderHook(() => useTranscriptions());

        expect(result.current.status).toBe('loading');

        act(() => {
            vi.advanceTimersByTime(READY_TIMEOUT_MS);
        });

        expect(result.current.status).toBe('loading');
        expect(reportMeetError).not.toHaveBeenCalled();

        state.agentIdentities = [AGENT_IDENTITY];
        rerender();

        expect(result.current.status).toBe('ready');
    });

    it('reports a decryption failure without exposing the payload', async () => {
        decryptMessage.mockRejectedValue(new Error('no matching epoch'));

        const { result } = renderHook(() => useTranscriptions());

        await emit(btoa('ciphertext'));

        expect(result.current.segments).toHaveLength(0);
        expect(reportMeetError).toHaveBeenCalledWith('Failed to decrypt a transcription', expect.any(Error));
        expect(JSON.stringify(reportMeetError.mock.calls)).not.toContain('ciphertext');
    });

    it('distinguishes undecodable traffic from silence once the ready window elapses', async () => {
        decryptMessage.mockRejectedValue(new Error('no matching epoch'));

        const { result } = renderHook(() => useTranscriptions());

        await emit(btoa('ciphertext'));

        act(() => {
            vi.advanceTimersByTime(READY_TIMEOUT_MS);
        });

        expect(result.current.status).toBe('failing');
        expect(reportMeetError).toHaveBeenCalledWith(
            'Captions received but none could be decoded',
            expect.objectContaining({ context: { streamsReceived: 1, streamReadFailures: 0, decryptFailures: 1 } })
        );
    });

    it('stays quiet once a caption has been displayed', async () => {
        const { result } = renderHook(() => useTranscriptions());

        await emit(btoa('ciphertext'));

        act(() => {
            vi.advanceTimersByTime(READY_TIMEOUT_MS);
        });

        expect(result.current.segments).toHaveLength(1);
        expect(result.current.status).toBe('active');
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('merges consecutive segments from the same speaker into one line', async () => {
        decryptMessage.mockResolvedValueOnce({ message: 'hello' }).mockResolvedValueOnce({ message: 'there' });

        const { result } = renderHook(() => useTranscriptions());

        await emit(btoa('first'), { id: 'segment-1' });
        await emit(btoa('second'), { id: 'segment-2' });

        expect(result.current.segments.map((segment) => segment.text)).toEqual(['hello there']);
    });

    it('keeps a line merged while the newer segment is still being updated', async () => {
        decryptMessage
            .mockResolvedValueOnce({ message: 'hello' })
            .mockResolvedValueOnce({ message: 'there' })
            .mockResolvedValueOnce({ message: 'there friend' });

        const { result } = renderHook(() => useTranscriptions());

        await emit(btoa('first'), { id: 'segment-1' });
        await emit(btoa('second'), { id: 'segment-2', isFinal: false });

        act(() => {
            vi.advanceTimersByTime(MERGE_GAP_MS + 500);
        });

        await emit(btoa('second-again'), { id: 'segment-2', isFinal: false });

        expect(result.current.segments.map((segment) => segment.text)).toEqual(['hello there friend']);
    });

    it('starts a new line when the speaker pauses for longer than the merge gap', async () => {
        decryptMessage.mockResolvedValueOnce({ message: 'hello' }).mockResolvedValueOnce({ message: 'there' });

        const { result } = renderHook(() => useTranscriptions());

        await emit(btoa('first'), { id: 'segment-1' });

        act(() => {
            vi.advanceTimersByTime(MERGE_GAP_MS + 500);
        });

        await emit(btoa('second'), { id: 'segment-2' });

        expect(result.current.segments.map((segment) => segment.text)).toEqual(['hello', 'there']);
    });

    it('keeps segments apart while the speaker is unknown, since they can be different people', async () => {
        decryptMessage.mockResolvedValueOnce({ message: 'hello' }).mockResolvedValueOnce({ message: 'there' });

        const { result } = renderHook(() => useTranscriptions());

        await emit(btoa('first'), { id: 'segment-1', trackSid: '' });
        await emit(btoa('second'), { id: 'segment-2', trackSid: '' });

        expect(result.current.segments.map((segment) => segment.text)).toEqual(['hello', 'there']);
    });
});
