import { useParticipants } from '@livekit/components-react';
import { VideoQuality } from '@proton-meet/livekit-client';
import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetContext } from '../contexts/MeetContext';
import { useParticipantQuality } from './useParticipantQuality';

vi.mock('@livekit/components-react', () => ({
    useParticipants: vi.fn(),
}));

vi.mock('../contexts/MeetContext', () => ({
    useMeetContext: vi.fn(),
}));

describe('useParticipantQuality', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should return LOW quality while screen share is active', () => {
        (useParticipants as Mock).mockReturnValue([]);
        (useMeetContext as Mock).mockReturnValue({ isScreenShare: true });
        const { result } = renderHook(() => useParticipantQuality());

        expect(result.current).toBe(VideoQuality.LOW);
    });

    it('should return LOW quality if there are more than 8 participants', () => {
        (useParticipants as Mock).mockReturnValue(Array(9).fill({}));
        (useMeetContext as Mock).mockReturnValue({ isScreenShare: false });
        const { result } = renderHook(() => useParticipantQuality());

        expect(result.current).toBe(VideoQuality.LOW);
    });

    it('should return HIGH quality if there are 3 or less participants', () => {
        (useParticipants as Mock).mockReturnValue(Array(3).fill({}));
        (useMeetContext as Mock).mockReturnValue({ isScreenShare: false });
        const { result } = renderHook(() => useParticipantQuality());

        expect(result.current).toBe(VideoQuality.HIGH);
    });

    it('should return MEDIUM quality if there are more than 3 and less than 9 participants and screen share is not active', () => {
        (useParticipants as Mock).mockReturnValue(Array(4).fill({}));
        (useMeetContext as Mock).mockReturnValue({ isScreenShare: false });
        const { result } = renderHook(() => useParticipantQuality());

        expect(result.current).toBe(VideoQuality.MEDIUM);
    });

    it('should return LOW quality if there are 3 participants and screen share is active', () => {
        (useParticipants as Mock).mockReturnValue(Array(3).fill({}));
        (useMeetContext as Mock).mockReturnValue({ isScreenShare: true });
        const { result } = renderHook(() => useParticipantQuality());

        expect(result.current).toBe(VideoQuality.LOW);
    });
});
