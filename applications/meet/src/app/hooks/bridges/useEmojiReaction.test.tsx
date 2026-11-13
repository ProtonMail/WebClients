import type { ReactNode } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { RemoteParticipant } from 'livekit-client';
import type { Mock } from 'vitest';

import { useNotifications } from '@proton/app-context/useNotifications';

import { MeetCoreClientContext } from '../../contexts/MeetCoreClientContext';
import { PublishableDataTypes } from '../../types';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';
import type { MeetCoreClient } from '../../wasm/MeetCoreClient';
import { createMeetCoreClientMock } from '../../wasm/__mocks__/MeetCoreClient.mock';
import { MeetCoreRestartedError } from '../../wasm/meetCoreStallRecovery';
import { useAvailableEmojiReactions, useEmojiReaction } from './useEmojiReaction';
import { useEmojiReactionReceiver } from './useEmojiReactionReceiver';

vi.mock('@livekit/components-react', () => ({
    useRoomContext: vi.fn(),
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetDispatch: vi.fn().mockReturnValue(vi.fn()),
}));

const errorReporting = vi.hoisted(() => ({ reportMeetError: vi.fn() }));
vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => errorReporting,
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn().mockReturnValue({ createNotification: vi.fn() }),
}));

vi.mock('@proton/meet/telemetry/meetTelemetry', () => ({
    TelemetryMeetActionsEvents: { emoji_reaction_sent: 'emoji_reaction_sent' },
    sendMeetActionsEvent: vi.fn(),
}));

vi.mock('../../utils/dispatchTimedReaction', () => ({
    dispatchTimedReaction: vi.fn().mockReturnValue(1),
}));

const SENDER = 'sender-participant';

const createMockRoom = () => ({
    on: vi.fn(),
    off: vi.fn(),
    localParticipant: { identity: SENDER, publishData: vi.fn().mockResolvedValue(undefined) },
});

const createWrapper = (client: MeetCoreClient) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return <MeetCoreClientContext.Provider value={client}>{children}</MeetCoreClientContext.Provider>;
    };

const getDataReceivedHandler = (room: ReturnType<typeof createMockRoom>) =>
    room.on.mock.calls.find((call) => call[0] === 'dataReceived')?.[1] as (
        payload: Uint8Array<ArrayBuffer>,
        participant?: RemoteParticipant,
        kind?: unknown,
        topic?: string
    ) => void;

const envelope = new TextEncoder().encode(
    JSON.stringify({ id: `${SENDER}-1`, message: 'ciphertext', timestamp: 1, type: PublishableDataTypes.EmojiReaction })
);

describe('floating emoji reactions use the meet-core allowlist', () => {
    let room: ReturnType<typeof createMockRoom>;

    beforeEach(() => {
        vi.clearAllMocks();
        room = createMockRoom();
        (useRoomContext as Mock).mockReturnValue(room);
    });

    it('renders the list that meet-core returns', async () => {
        const client = createMeetCoreClientMock({
            getAvailableEmojiReactions: vi.fn().mockResolvedValue(['👍', '🎉']),
        });

        const { result } = renderHook(() => useAvailableEmojiReactions(), { wrapper: createWrapper(client) });

        await waitFor(() => {
            expect(result.current).toEqual(['👍', '🎉']);
        });
    });

    it('asks meet-core for the list once for every popup that mounts', async () => {
        const client = createMeetCoreClientMock({
            getAvailableEmojiReactions: vi.fn().mockResolvedValue(['👍']),
        });

        const firstPopup = renderHook(() => useAvailableEmojiReactions(), { wrapper: createWrapper(client) });
        await waitFor(() => expect(firstPopup.result.current).toEqual(['👍']));
        firstPopup.unmount();
        const secondPopup = renderHook(() => useAvailableEmojiReactions(), { wrapper: createWrapper(client) });

        await waitFor(() => expect(secondPopup.result.current).toEqual(['👍']));
        expect(client.getAvailableEmojiReactions).toHaveBeenCalledTimes(1);
    });

    it('reports a list meet-core fails to return, and asks again on the next mount', async () => {
        const error = new Error('meet-core unavailable');
        const client = createMeetCoreClientMock({
            getAvailableEmojiReactions: vi.fn().mockRejectedValueOnce(error).mockResolvedValue(['👍']),
        });

        const failedPopup = renderHook(() => useAvailableEmojiReactions(), { wrapper: createWrapper(client) });
        await waitFor(() =>
            expect(errorReporting.reportMeetError).toHaveBeenCalledWith(
                'Failed to load the available emoji reactions',
                error
            )
        );
        expect(failedPopup.result.current).toEqual([]);
        failedPopup.unmount();
        const nextPopup = renderHook(() => useAvailableEmojiReactions(), { wrapper: createWrapper(client) });

        await waitFor(() => expect(nextPopup.result.current).toEqual(['👍']));
        expect(client.getAvailableEmojiReactions).toHaveBeenCalledTimes(2);
    });

    it('does not report a list request that a meet-core restart interrupted, and asks again on the next mount', async () => {
        const client = createMeetCoreClientMock({
            getAvailableEmojiReactions: vi
                .fn()
                .mockRejectedValueOnce(new MeetCoreRestartedError())
                .mockResolvedValue(['👍']),
        });

        const interruptedPopup = renderHook(() => useAvailableEmojiReactions(), { wrapper: createWrapper(client) });
        await waitFor(() => expect(client.getAvailableEmojiReactions).toHaveBeenCalledTimes(1));
        await act(async () => {});
        interruptedPopup.unmount();
        const nextPopup = renderHook(() => useAvailableEmojiReactions(), { wrapper: createWrapper(client) });

        await waitFor(() => expect(nextPopup.result.current).toEqual(['👍']));
        expect(errorReporting.reportMeetError).not.toHaveBeenCalled();
    });

    it('does not encrypt or publish an emoji that meet-core rejects', async () => {
        const client = createMeetCoreClientMock({ isValidEmojiReaction: vi.fn().mockResolvedValue(false) });

        const { result } = renderHook(() => useEmojiReaction(), { wrapper: createWrapper(client) });

        let sent: boolean | undefined;
        await act(async () => {
            sent = await result.current('🤖');
        });

        expect(sent).toBe(false);
        expect(client.isValidEmojiReaction).toHaveBeenCalledWith('🤖');
        expect(client.encryptMessage).not.toHaveBeenCalled();
        expect(room.localParticipant.publishData).not.toHaveBeenCalled();
        expect(dispatchTimedReaction).not.toHaveBeenCalled();
    });

    it('reports a failure and sends nothing when the meet-core validation call fails', async () => {
        const client = createMeetCoreClientMock({
            isValidEmojiReaction: vi.fn().mockRejectedValue(new Error('worker restarted')),
        });

        const { result } = renderHook(() => useEmojiReaction(), { wrapper: createWrapper(client) });

        let sent: boolean | undefined;
        await act(async () => {
            sent = await result.current('👍');
        });

        expect(sent).toBe(false);
        expect(useNotifications().createNotification).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'error', text: 'Failed to send emoji reaction. Please try again.' })
        );
        expect(client.encryptMessage).not.toHaveBeenCalled();
        expect(room.localParticipant.publishData).not.toHaveBeenCalled();
        expect(dispatchTimedReaction).not.toHaveBeenCalled();
    });

    it('encrypts and publishes an emoji that meet-core accepts, unreliable on the emojiReaction topic', async () => {
        const client = createMeetCoreClientMock({
            isValidEmojiReaction: vi.fn().mockResolvedValue(true),
            encryptMessage: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        });

        const { result } = renderHook(() => useEmojiReaction(), { wrapper: createWrapper(client) });

        await act(async () => {
            await result.current('👍');
        });

        expect(client.encryptMessage).toHaveBeenCalledWith('👍');
        expect(room.localParticipant.publishData).toHaveBeenCalledWith(expect.any(Uint8Array), {
            topic: PublishableDataTypes.EmojiReaction,
            reliable: false,
        });
    });

    it.each([
        [false, 0],
        [true, 1],
    ])('shows an incoming reaction only when meet-core accepts it (valid: %s)', async (isValid, dispatchCount) => {
        const client = createMeetCoreClientMock({
            decryptMessage: vi.fn().mockResolvedValue({ message: '👍', sender_participant_id: SENDER }),
            isValidEmojiReaction: vi.fn().mockResolvedValue(isValid),
        });

        renderHook(() => useEmojiReactionReceiver(), { wrapper: createWrapper(client) });

        getDataReceivedHandler(room)(
            envelope,
            { identity: SENDER } as RemoteParticipant,
            undefined,
            PublishableDataTypes.EmojiReaction
        );

        await waitFor(() => {
            expect(client.isValidEmojiReaction).toHaveBeenCalledWith('👍');
            expect(dispatchTimedReaction).toHaveBeenCalledTimes(dispatchCount);
        });
    });
});
