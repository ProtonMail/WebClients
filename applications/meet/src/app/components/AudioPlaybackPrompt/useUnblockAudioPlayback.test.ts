import { act, renderHook } from '@testing-library/react';
import type { Room } from 'livekit-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TelemetryMeetActionsEvents } from '@proton/meet/telemetry/meetTelemetry';

import { useUnblockAudioPlayback } from './useUnblockAudioPlayback';

const livekitMocks = vi.hoisted(() => ({ useRoomContext: vi.fn() }));
vi.mock('@livekit/components-react', () => livekitMocks);

const errorReportingMocks = vi.hoisted(() => ({ reportMeetError: vi.fn() }));
vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: errorReportingMocks.reportMeetError }),
}));

const telemetryMocks = vi.hoisted(() => ({ sendMeetActionsEvent: vi.fn() }));
vi.mock('@proton/meet/telemetry/meetTelemetry', async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    sendMeetActionsEvent: telemetryMocks.sendMeetActionsEvent,
}));

type FakeState = 'suspended' | 'running';

const setup = ({ startAudio = undefined as (() => Promise<void>) | undefined, isAudioMixingEnabled = true } = {}) => {
    const audioContext = { state: 'suspended' as FakeState };
    const startAudioMock = vi.fn(
        startAudio ??
            (async () => {
                audioContext.state = 'running';
            })
    );
    const room = {
        startAudio: startAudioMock,
        options: { webAudioMix: isAudioMixingEnabled ? { audioContext } : false },
    } as unknown as Room;

    livekitMocks.useRoomContext.mockReturnValue(room);

    const { result } = renderHook(() => useUnblockAudioPlayback());

    return { startAudio: startAudioMock, unblockAudioPlayback: result.current };
};

describe('useUnblockAudioPlayback', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('starts audio within the tap, before anything is awaited', () => {
        const { startAudio, unblockAudioPlayback } = setup();

        void unblockAudioPlayback();

        expect(startAudio).toHaveBeenCalledTimes(1);
    });

    it('reports the recovery with the state the context was in', async () => {
        const { unblockAudioPlayback } = setup();

        await unblockAudioPlayback();

        expect(telemetryMocks.sendMeetActionsEvent).toHaveBeenCalledWith(
            TelemetryMeetActionsEvents.audio_playback_recovered,
            { trigger: 'user_tap', fromState: 'suspended' }
        );
        expect(errorReportingMocks.reportMeetError).not.toHaveBeenCalled();
    });

    it('reports an error when the context is still not running after the tap', async () => {
        const { unblockAudioPlayback } = setup({ startAudio: async () => {} });

        await unblockAudioPlayback();

        expect(errorReportingMocks.reportMeetError).toHaveBeenCalledWith(
            'Audio playback still blocked after the unblock tap',
            expect.objectContaining({ tags: { audioContextState: 'suspended', fromState: 'suspended' } })
        );
        expect(telemetryMocks.sendMeetActionsEvent).not.toHaveBeenCalled();
    });

    it('reports an error with the cause when starting audio fails', async () => {
        const failure = new Error('play() failed');
        const { unblockAudioPlayback } = setup({
            startAudio: async () => {
                throw failure;
            },
        });

        await unblockAudioPlayback();

        expect(errorReportingMocks.reportMeetError).toHaveBeenCalledWith(
            'Audio playback still blocked after the unblock tap',
            { context: { error: failure }, tags: { audioContextState: 'suspended', fromState: 'suspended' } }
        );
    });

    it('reports an error when starting audio never settles', async () => {
        const { unblockAudioPlayback } = setup({ startAudio: () => new Promise(() => {}) });

        const unblocking = unblockAudioPlayback();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(5_000);
        });
        await unblocking;

        expect(errorReportingMocks.reportMeetError).toHaveBeenCalledWith(
            'Audio playback still blocked after the unblock tap',
            expect.objectContaining({ tags: { audioContextState: 'suspended', fromState: 'suspended' } })
        );
    });

    it('only asks LiveKit when audio is not mixed through a context', async () => {
        const { startAudio, unblockAudioPlayback } = setup({ isAudioMixingEnabled: false });

        await unblockAudioPlayback();

        expect(startAudio).toHaveBeenCalledTimes(1);
        expect(telemetryMocks.sendMeetActionsEvent).not.toHaveBeenCalled();
        expect(errorReportingMocks.reportMeetError).not.toHaveBeenCalled();
    });

    it('reports an error when starting audio fails without audio mixing', async () => {
        const failure = new Error('play() failed');
        const { unblockAudioPlayback } = setup({
            isAudioMixingEnabled: false,
            startAudio: async () => {
                throw failure;
            },
        });

        await unblockAudioPlayback();

        expect(errorReportingMocks.reportMeetError).toHaveBeenCalledWith(
            'Audio playback still blocked after the unblock tap without audio mixing',
            { context: { error: failure } }
        );
    });
});
