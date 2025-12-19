import { useLocalParticipant, useParticipants, useRoomContext, useTracks } from '@livekit/components-react';
import { renderHook } from '@testing-library/react';
import { Track } from 'livekit-client';
import type { Mock } from 'vitest';

import useNotifications from '@proton/components/hooks/useNotifications';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useCurrentScreenShare } from './useCurrentScreenShare';

const mockLocalParticipant = {
    identity: 'local-participant',
    setScreenShareEnabled: vi.fn(),
};

const mockRoom = {
    localParticipant: mockLocalParticipant,
    on: vi.fn(),
    off: vi.fn(),
};

const mockTracks = [
    {
        track: {},
        kind: Track.Kind.Video,
        source: Track.Source.ScreenShare,
        isMuted: false,
        participant: mockLocalParticipant,
    },
];

vi.mock('@livekit/components-react', () => ({
    useLocalParticipant: vi.fn(),
    useParticipants: vi.fn(),
    useTracks: vi.fn(),
    useRoomContext: vi.fn(),
}));

vi.mock('@proton/shared/lib/helpers/browser', () => {
    return {
        isMobile: vi.fn().mockReturnValue(false),
        isMac: vi.fn().mockReturnValue(false),
        isLinux: vi.fn().mockReturnValue(false),
    };
});

vi.mock('@proton/components/hooks/useNotifications', () => ({
    default: vi.fn().mockReturnValue({
        createNotification: vi.fn(),
    }),
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
const useRoomContextMock = useRoomContext as Mock;
const useTracksMock = useTracks as Mock;

describe('useCurrentScreenShare', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        global.navigator.mediaDevices = {
            ...global.navigator.mediaDevices,
            getDisplayMedia: mockGetDisplayMedia,
        };

        // Set up default mocks
        useRoomContextMock.mockReturnValue(mockRoom);
        useTracksMock.mockReturnValue([]);
    });

    afterAll(() => {
        // @ts-ignore
        global.navigator.mediaDevices = originalMediaDevices;
        vi.resetModules();
    });

    it('should have isLocal true if the local participant is the one sharing the screen', () => {
        useTracksMock.mockReturnValue(mockTracks);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });
        useParticipantsMock.mockReturnValue([mockLocalParticipant]);

        const { result } = renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );

        expect(result.current.isLocalScreenShare).toBe(true);
    });

    it('should return false if the local participant is not the one sharing the screen', () => {
        const mockParticipant = {
            ...mockLocalParticipant,
            identity: 'other-participant',
        };

        useTracksMock.mockReturnValue([{ ...mockTracks[0], participant: mockParticipant }]);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });
        useParticipantsMock.mockReturnValue([mockParticipant, mockLocalParticipant]);

        const { result } = renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );
        expect(result.current.isLocalScreenShare).toBe(false);
    });

    it('should allow for stopping the screen share', () => {
        const setScreenShareEnabled = vi.fn();

        const newLocalParticipant = {
            ...mockLocalParticipant,
            trackPublications: new Map([['video', mockTracks[0]]]),
            setScreenShareEnabled,
        };

        useLocalParticipantMock.mockReturnValue({
            localParticipant: newLocalParticipant,
        });
        useParticipantsMock.mockReturnValue([newLocalParticipant]);

        useRoomContextMock.mockReturnValue({
            ...mockRoom,
            localParticipant: {
                getTrackPublication: vi.fn().mockReturnValue(mockTracks[0]),
                setScreenShareEnabled,
            },
        });

        const { result } = renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );
        result.current.stopScreenShare();

        expect(setScreenShareEnabled).toHaveBeenCalledWith(false);
    });

    it('should show a notification if the screen share is not supported on mobile browsers', async () => {
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });
        useParticipantsMock.mockReturnValue([mockLocalParticipant]);

        (isMobile as Mock).mockReturnValue(true);

        const createNotification = vi.fn();

        (useNotifications as Mock).mockReturnValue({
            createNotification,
        });

        const { result } = renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );

        await result.current.startScreenShare();

        expect(createNotification).toHaveBeenCalledWith({
            type: 'info',
            text: 'Screen share is not supported on mobile browsers',
        });
    });
});
