import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { renderHook } from '@testing-library/react';
import { Track } from 'livekit-client';
import type { Mock } from 'vitest';

import { useCurrentScreenShare } from './useCurrentScreenShare';

const mockLocalParticipant = {
    trackPublications: new Map([
        [
            'video',
            {
                track: {},
                kind: Track.Kind.Video,
                source: Track.Source.ScreenShare,
                isMuted: false,
            },
        ],
    ]),
    identity: 'local-participant',
};

vi.mock('@livekit/components-react', () => ({
    useLocalParticipant: vi.fn(),
    useParticipants: vi.fn(),
}));

const originalMediaDevices = global.navigator.mediaDevices;
const mockMediaStreamTrack = {
    removeEventListener: vi.fn(),
};
const mockMediaStream = {
    getVideoTracks: () => [mockMediaStreamTrack],
};

const mockGetDisplayMedia = vi.fn().mockResolvedValue(mockMediaStream);

const useLocalParticipantMock = useLocalParticipant as Mock;
const useParticipantsMock = useParticipants as Mock;

describe('useCurrentScreenShare', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        global.navigator.mediaDevices = {
            ...global.navigator.mediaDevices,
            getDisplayMedia: mockGetDisplayMedia,
        };
    });

    afterAll(() => {
        // @ts-ignore
        global.navigator.mediaDevices = originalMediaDevices;
        vi.resetModules();
    });

    it('should have isLocal true if the local participant is the one sharing the screen', () => {
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });
        useParticipantsMock.mockReturnValue([mockLocalParticipant]);

        const { result } = renderHook(() => useCurrentScreenShare());

        expect(result.current.isLocal).toBe(true);
    });

    it('should return false if the local participant is not the one sharing the screen', () => {
        const mockParticipant = {
            ...mockLocalParticipant,
            identity: 'other-participant',
        };

        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });
        useParticipantsMock.mockReturnValue([mockParticipant, mockLocalParticipant]);

        const { result } = renderHook(() => useCurrentScreenShare());
        expect(result.current.isLocal).toBe(false);
    });

    it('should allow for stopping the screen share', () => {
        const unpublishTrack = vi.fn();

        const newLocalParticipant = {
            ...mockLocalParticipant,
            unpublishTrack,
        };

        useLocalParticipantMock.mockReturnValue({
            localParticipant: newLocalParticipant,
        });
        useParticipantsMock.mockReturnValue([newLocalParticipant]);

        const { result } = renderHook(() => useCurrentScreenShare());
        result.current.stopScreenShare();

        expect(unpublishTrack).toHaveBeenCalledWith(newLocalParticipant.trackPublications.get('video')?.track);
    });
});
