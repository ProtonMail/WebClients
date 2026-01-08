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
    remoteParticipants: new Map(),
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

    it('should subscribe to existing screen shares when joining the room', () => {
        const mockPublication1 = {
            source: Track.Source.ScreenShare,
            kind: Track.Kind.Video,
            setSubscribed: vi.fn(),
            setEnabled: vi.fn(),
        };

        const mockPublication2 = {
            source: Track.Source.Camera,
            kind: Track.Kind.Video,
            setSubscribed: vi.fn(),
            setEnabled: vi.fn(),
        };

        const mockRemoteParticipant = {
            identity: 'remote-participant',
            trackPublications: new Map([
                ['screen-share', mockPublication1],
                ['camera', mockPublication2],
            ]),
        };

        const roomWithParticipants = {
            ...mockRoom,
            remoteParticipants: new Map([['remote-1', mockRemoteParticipant]]),
        };

        useRoomContextMock.mockReturnValue(roomWithParticipants);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );

        // Should subscribe to screen share publication
        expect(mockPublication1.setSubscribed).toHaveBeenCalledWith(true);
        expect(mockPublication1.setEnabled).toHaveBeenCalledWith(true);

        // Should NOT subscribe to camera publication
        expect(mockPublication2.setSubscribed).not.toHaveBeenCalled();
        expect(mockPublication2.setEnabled).not.toHaveBeenCalled();
    });

    it('should subscribe to all screen shares when multiple exist', () => {
        const mockPublication1 = {
            source: Track.Source.ScreenShare,
            kind: Track.Kind.Video,
            setSubscribed: vi.fn(),
            setEnabled: vi.fn(),
        };

        const mockPublication2 = {
            source: Track.Source.ScreenShare,
            kind: Track.Kind.Video,
            setSubscribed: vi.fn(),
            setEnabled: vi.fn(),
        };

        const mockRemoteParticipant1 = {
            identity: 'remote-participant-1',
            trackPublications: new Map([['screen-share', mockPublication1]]),
        };

        const mockRemoteParticipant2 = {
            identity: 'remote-participant-2',
            trackPublications: new Map([['screen-share', mockPublication2]]),
        };

        const roomWithParticipants = {
            ...mockRoom,
            remoteParticipants: new Map([
                ['remote-1', mockRemoteParticipant1],
                ['remote-2', mockRemoteParticipant2],
            ]),
        };

        useRoomContextMock.mockReturnValue(roomWithParticipants);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );

        // Should subscribe to all screen shares to ensure useTracks content is consistent
        expect(mockPublication1.setSubscribed).toHaveBeenCalledWith(true);
        expect(mockPublication1.setEnabled).toHaveBeenCalledWith(true);

        expect(mockPublication2.setSubscribed).toHaveBeenCalledWith(true);
        expect(mockPublication2.setEnabled).toHaveBeenCalledWith(true);
    });

    it('should subscribe to newly published screen shares', () => {
        useRoomContextMock.mockReturnValue(mockRoom);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );

        // Get the trackPublished event handler
        const trackPublishedHandler = mockRoom.on.mock.calls.find((call) => call[0] === 'trackPublished')?.[1];

        expect(trackPublishedHandler).toBeDefined();

        // Simulate a new screen share being published
        const newScreenSharePublication = {
            source: Track.Source.ScreenShare,
            kind: Track.Kind.Video,
            setSubscribed: vi.fn(),
            setEnabled: vi.fn(),
        };

        trackPublishedHandler(newScreenSharePublication);

        expect(newScreenSharePublication.setSubscribed).toHaveBeenCalledWith(true);
        expect(newScreenSharePublication.setEnabled).toHaveBeenCalledWith(true);
    });

    it('should NOT subscribe to newly published non-screen-share tracks', () => {
        useRoomContextMock.mockReturnValue(mockRoom);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );

        // Get the trackPublished event handler
        const trackPublishedHandler = mockRoom.on.mock.calls.find((call) => call[0] === 'trackPublished')?.[1];

        // Simulate a camera track being published
        const cameraPublication = {
            source: Track.Source.Camera,
            kind: Track.Kind.Video,
            setSubscribed: vi.fn(),
            setEnabled: vi.fn(),
        };

        trackPublishedHandler(cameraPublication);

        expect(cameraPublication.setSubscribed).not.toHaveBeenCalled();
        expect(cameraPublication.setEnabled).not.toHaveBeenCalled();
    });

    it('should clean up trackPublished event listener on unmount', () => {
        useRoomContextMock.mockReturnValue(mockRoom);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        const { unmount } = renderHook(() =>
            useCurrentScreenShare({ stopPiP: vi.fn(), startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );

        expect(mockRoom.on).toHaveBeenCalledWith('trackPublished', expect.any(Function));

        unmount();

        expect(mockRoom.off).toHaveBeenCalledWith('trackPublished', expect.any(Function));
    });

    it('should listen for track ended event and call stopPiP', () => {
        const mockTrack = {
            on: vi.fn(),
            off: vi.fn(),
        };

        const mockScreenShareTrack = {
            publication: {
                track: mockTrack,
                trackSid: 'test-track-sid',
            },
            participant: mockLocalParticipant,
        };

        useTracksMock.mockReturnValue([mockScreenShareTrack]);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        const stopPiP = vi.fn();

        renderHook(() => useCurrentScreenShare({ stopPiP, startPiP: vi.fn(), preparePictureInPicture: vi.fn() }));

        expect(mockTrack.on).toHaveBeenCalledWith('ended', stopPiP);
    });

    it('should clean up track ended event listener when track changes', () => {
        const mockTrack1 = {
            on: vi.fn(),
            off: vi.fn(),
        };

        const mockScreenShareTrack1 = {
            publication: {
                track: mockTrack1,
                trackSid: 'track-sid-1',
            },
            participant: mockLocalParticipant,
        };

        useTracksMock.mockReturnValue([mockScreenShareTrack1]);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        const stopPiP = vi.fn();

        const { rerender } = renderHook(() =>
            useCurrentScreenShare({ stopPiP, startPiP: vi.fn(), preparePictureInPicture: vi.fn() })
        );

        expect(mockTrack1.on).toHaveBeenCalledWith('ended', stopPiP);

        // Change to a different track
        const mockTrack2 = {
            on: vi.fn(),
            off: vi.fn(),
        };

        const mockScreenShareTrack2 = {
            publication: {
                track: mockTrack2,
                trackSid: 'track-sid-2',
            },
            participant: mockLocalParticipant,
        };

        useTracksMock.mockReturnValue([mockScreenShareTrack2]);
        rerender();

        // Should clean up old listener
        expect(mockTrack1.off).toHaveBeenCalledWith('ended', stopPiP);
        // Should add new listener
        expect(mockTrack2.on).toHaveBeenCalledWith('ended', stopPiP);
    });
});
