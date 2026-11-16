import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { supportsScreenSharing } from '@livekit/components-core';
import { useLocalParticipant, useParticipants, useRoomContext } from '@livekit/components-react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Track } from 'livekit-client';
import type { Mock } from 'vitest';

import { useNotifications } from '@proton/app-context/useNotifications';
import { deviceManagementReducer } from '@proton/meet/store/slices/deviceManagementSlice';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { screenShareStatusReducer } from '@proton/meet/store/slices/screenShareStatusSlice';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';
import { isChrome, isFirefox, isMac, isMobile } from '@proton/shared/lib/helpers/browser';

import { useCurrentScreenShare } from './useCurrentScreenShare';

const mockLocalParticipant = {
    identity: 'local-participant',
    setScreenShareEnabled: vi.fn(),
    getTrackPublication: vi.fn(),
};

const mockRoom = {
    localParticipant: mockLocalParticipant,
    remoteParticipants: new Map(),
    on: vi.fn(),
    off: vi.fn(),
};

const mockTracks = [
    {
        track: {
            on: vi.fn(),
            off: vi.fn(),
        },
        kind: Track.Kind.Video,
        source: Track.Source.ScreenShare,
        isMuted: false,
        participant: mockLocalParticipant,
    },
];

vi.mock('@livekit/components-core', () => ({
    supportsScreenSharing: vi.fn(),
}));

vi.mock('@livekit/components-react', () => ({
    useLocalParticipant: vi.fn(),
    useParticipants: vi.fn(),
    useRoomContext: vi.fn(),
}));

vi.mock('@proton/shared/lib/helpers/browser', () => {
    return {
        isMobile: vi.fn().mockReturnValue(false),
        isSafari: vi.fn().mockReturnValue(false),
        isChrome: vi.fn().mockReturnValue(true),
        isFirefox: vi.fn().mockReturnValue(false),
        isMac: vi.fn().mockReturnValue(false),
        isLinux: vi.fn().mockReturnValue(false),
        getBrowser: vi.fn().mockReturnValue({ name: 'Chrome', version: '141.0.0.0' }),
    };
});

const desktopState = vi.hoisted(() => ({ isElectronApp: false }));

vi.mock('@proton/shared/lib/helpers/desktop', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    get isElectronApp() {
        return desktopState.isElectronApp;
    },
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn().mockReturnValue({
        createNotification: vi.fn(),
    }),
}));

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: vi.fn().mockReturnValue({
        reportMeetError: vi.fn(),
    }),
}));

const createTestStore = () =>
    configureStore({
        reducer: { ...deviceManagementReducer, ...screenShareStatusReducer },
    });

type TestStore = ReturnType<typeof createTestStore>;

const createWrapper = (store: TestStore) => {
    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        );
    };
};

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
const mockSupportsScreenSharing = supportsScreenSharing as Mock;

const emitRoomEvent = (event: string, ...args: unknown[]) => {
    const handlers = mockRoom.on.mock.calls.filter((call) => call[0] === event).map((call) => call[1]);

    expect(handlers.length).toBeGreaterThan(0);

    handlers.forEach((handler) => handler(...args));
};

const createRoomSharingTrack = (track: unknown) => ({
    ...mockRoom,
    localParticipant: {
        ...mockLocalParticipant,
        getTrackPublication: vi.fn().mockReturnValue({ track }),
    },
});

describe('useCurrentScreenShare', () => {
    let store: TestStore;

    const renderUseCurrentScreenShare = (props: Partial<Parameters<typeof useCurrentScreenShare>[0]> = {}) =>
        renderHook(
            () =>
                useCurrentScreenShare({
                    stopPiP: vi.fn(),
                    startPiP: vi.fn(),
                    preparePictureInPicture: vi.fn(),
                    ...props,
                }),
            { wrapper: createWrapper(store) }
        );

    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        global.navigator.mediaDevices = {
            ...global.navigator.mediaDevices,
            getDisplayMedia: mockGetDisplayMedia,
        };

        store = createTestStore();

        // Set up default mocks
        useRoomContextMock.mockReturnValue(mockRoom);
        mockSupportsScreenSharing.mockReturnValue(true);
    });

    afterAll(() => {
        // @ts-ignore
        global.navigator.mediaDevices = originalMediaDevices;
        vi.resetModules();
    });

    it('should allow for stopping the screen share', () => {
        const setScreenShareEnabled = vi.fn();

        const newLocalParticipant = {
            ...mockLocalParticipant,
            trackPublications: new Map([['video', mockTracks[0]]]),
            setScreenShareEnabled,
        };

        useParticipantsMock.mockReturnValue([newLocalParticipant]);

        useRoomContextMock.mockReturnValue({
            ...mockRoom,
            localParticipant: {
                getTrackPublication: vi.fn().mockReturnValue(mockTracks[0]),
                setScreenShareEnabled,
            },
        });

        const { result } = renderUseCurrentScreenShare();
        result.current.stopScreenShare();

        expect(setScreenShareEnabled).toHaveBeenCalledWith(false);
    });

    it('should show a notification if the screen share is not supported on mobile browsers', async () => {
        useParticipantsMock.mockReturnValue([mockLocalParticipant]);

        (isMobile as Mock).mockReturnValue(true);

        const createNotification = vi.fn();

        (useNotifications as Mock).mockReturnValue({
            createNotification,
        });

        const { result } = renderUseCurrentScreenShare();

        await result.current.startScreenShare();

        expect(createNotification).toHaveBeenCalledWith({
            type: 'info',
            text: 'Screen share is not supported on mobile browsers',
        });
    });

    it('should show a notification if the screen share is not supported', async () => {
        useParticipantsMock.mockReturnValue([mockLocalParticipant]);

        (isMobile as Mock).mockReturnValue(false);
        mockSupportsScreenSharing.mockReturnValue(false);

        const createNotification = vi.fn();

        (useNotifications as Mock).mockReturnValue({
            createNotification,
        });

        const { result } = renderUseCurrentScreenShare();

        await result.current.startScreenShare();

        expect(createNotification).toHaveBeenCalledWith({
            type: 'info',
            text: 'Screen share is not supported on your device',
        });
    });

    describe('when the desktop app declines the request (picker closed or cancelled)', () => {
        const abortError = Object.assign(new Error('Invalid capture constraints'), { name: 'AbortError' });

        afterEach(() => {
            desktopState.isElectronApp = false;
        });

        const startWithError = async () => {
            useParticipantsMock.mockReturnValue([mockLocalParticipant]);
            (isMobile as Mock).mockReturnValue(false);
            mockLocalParticipant.setScreenShareEnabled.mockRejectedValueOnce(abortError);

            const createNotification = vi.fn();
            (useNotifications as Mock).mockReturnValue({ createNotification });

            const { result } = renderUseCurrentScreenShare();
            await act(() => result.current.startScreenShare());

            return { result, createNotification };
        };

        it('stays silent in the desktop app', async () => {
            desktopState.isElectronApp = true;

            const { result, createNotification } = await startWithError();

            expect(result.current.screenShareError).toBeNull();
            expect(createNotification).not.toHaveBeenCalled();
        });

        it('reports a failed screen share in the browser', async () => {
            const { result, createNotification } = await startWithError();

            expect(result.current.screenShareError).toBe('failed');
            expect(createNotification).not.toHaveBeenCalled();
        });
    });

    describe('when the screen share fails', () => {
        const startWithError = async (error: Error) => {
            useParticipantsMock.mockReturnValue([mockLocalParticipant]);
            (isMobile as Mock).mockReturnValue(false);
            mockLocalParticipant.setScreenShareEnabled.mockRejectedValueOnce(error);

            const createNotification = vi.fn();
            (useNotifications as Mock).mockReturnValue({ createNotification });

            const rendered = renderUseCurrentScreenShare();
            await act(() => rendered.result.current.startScreenShare());

            return { result: rendered.result, createNotification };
        };

        const namedError = (name: string, message: string) => Object.assign(new Error(message), { name });

        const safariDeniedError = namedError(
            'NotAllowedError',
            'The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.'
        );

        afterEach(() => {
            (isChrome as Mock).mockReturnValue(true);
            (isFirefox as Mock).mockReturnValue(false);
            (isMac as Mock).mockReturnValue(false);
            vi.restoreAllMocks();
        });

        it('reports that screen recording is off when Firefox on macOS finds no source', async () => {
            (isFirefox as Mock).mockReturnValue(true);
            (isMac as Mock).mockReturnValue(true);

            const { result, createNotification } = await startWithError(
                namedError('NotFoundError', 'The object can not be found here.')
            );

            expect(result.current.screenShareError).toBe('screenRecordingOff');
            expect(createNotification).not.toHaveBeenCalled();
        });

        it('reports that there is nothing to share when another browser finds no source', async () => {
            const { result, createNotification } = await startWithError(
                namedError('NotFoundError', 'Requested device not found')
            );

            expect(result.current.screenShareError).toBe('nothingToShare');
            expect(createNotification).not.toHaveBeenCalled();
        });

        it('reports that there is nothing to share when Firefox on another system finds no source', async () => {
            (isFirefox as Mock).mockReturnValue(true);

            const { result } = await startWithError(namedError('NotFoundError', 'The object can not be found here.'));

            expect(result.current.screenShareError).toBe('nothingToShare');
        });

        it('reports a failed screen share when the source cannot be read', async () => {
            const { result, createNotification } = await startWithError(
                namedError('NotReadableError', 'Could not start video source')
            );

            expect(result.current.screenShareError).toBe('failed');
            expect(createNotification).not.toHaveBeenCalled();
        });

        it('reports nothing when the person declines the Safari prompt', async () => {
            (isChrome as Mock).mockReturnValue(false);
            let now = 0;
            vi.spyOn(performance, 'now').mockImplementation(() => (now += 1000));

            const { result, createNotification } = await startWithError(safariDeniedError);

            expect(result.current.screenShareError).toBeNull();
            expect(createNotification).not.toHaveBeenCalled();
            expect(store.getState().deviceManagement.uiModals.permissionsModal).not.toBe(
                PermissionsModalType.PERMISSIONS_BLOCKED_SCREEN_SHARE_MODAL
            );
        });

        it('shows the blocked modal when Safari rejects the request at once', async () => {
            (isChrome as Mock).mockReturnValue(false);
            vi.spyOn(performance, 'now').mockReturnValue(0);

            const { result } = await startWithError(safariDeniedError);

            expect(result.current.screenShareError).toBeNull();
            expect(store.getState().deviceManagement.uiModals.permissionsModal).toBe(
                PermissionsModalType.PERMISSIONS_BLOCKED_SCREEN_SHARE_MODAL
            );
        });

        it('reports nothing when the person cancels the picker', async () => {
            const { result, createNotification } = await startWithError(
                namedError('NotAllowedError', 'Permission denied by user')
            );

            expect(result.current.screenShareError).toBeNull();
            expect(createNotification).not.toHaveBeenCalled();
        });

        it('clears the error when dismissed', async () => {
            const { result } = await startWithError(namedError('NotReadableError', 'Could not start video source'));

            act(() => result.current.dismissScreenShareError());

            expect(result.current.screenShareError).toBeNull();
        });

        it('clears the error when the next attempt succeeds', async () => {
            const { result } = await startWithError(namedError('NotReadableError', 'Could not start video source'));

            await act(() => result.current.startScreenShare());

            expect(result.current.screenShareError).toBeNull();
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
            getTrackPublication: vi.fn(),
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

        renderUseCurrentScreenShare();

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
            getTrackPublication: vi.fn(),
            trackPublications: new Map([['screen-share', mockPublication1]]),
        };

        const mockRemoteParticipant2 = {
            identity: 'remote-participant-2',
            getTrackPublication: vi.fn(),
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

        renderUseCurrentScreenShare();

        expect(mockPublication1.setSubscribed).toHaveBeenCalledWith(true);
        expect(mockPublication1.setEnabled).toHaveBeenCalledWith(true);

        expect(mockPublication2.setSubscribed).toHaveBeenCalledWith(true);
        expect(mockPublication2.setEnabled).toHaveBeenCalledWith(true);
    });

    it('should subscribe to newly published screen shares', () => {
        useRoomContextMock.mockReturnValue(mockRoom);

        renderUseCurrentScreenShare();

        // Simulate a new screen share being published
        const newScreenSharePublication = {
            source: Track.Source.ScreenShare,
            kind: Track.Kind.Video,
            setSubscribed: vi.fn(),
            setEnabled: vi.fn(),
        };

        emitRoomEvent('trackPublished', newScreenSharePublication);

        expect(newScreenSharePublication.setSubscribed).toHaveBeenCalledWith(true);
        expect(newScreenSharePublication.setEnabled).toHaveBeenCalledWith(true);
    });

    it('should NOT subscribe to newly published non-screen-share tracks', () => {
        useRoomContextMock.mockReturnValue(mockRoom);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        renderUseCurrentScreenShare();

        // Simulate a camera track being published
        const cameraPublication = {
            source: Track.Source.Camera,
            kind: Track.Kind.Video,
            setSubscribed: vi.fn(),
            setEnabled: vi.fn(),
        };

        emitRoomEvent('trackPublished', cameraPublication);

        expect(cameraPublication.setSubscribed).not.toHaveBeenCalled();
        expect(cameraPublication.setEnabled).not.toHaveBeenCalled();
    });

    it('should clean up trackPublished event listener on unmount', () => {
        useRoomContextMock.mockReturnValue(mockRoom);
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        const { unmount } = renderUseCurrentScreenShare();

        expect(mockRoom.on).toHaveBeenCalledWith('trackPublished', expect.any(Function));

        unmount();

        expect(mockRoom.off).toHaveBeenCalledWith('trackPublished', expect.any(Function));
    });

    it('should listen for track ended event and call stopPiP', () => {
        const mockTrack = {
            on: vi.fn(),
            off: vi.fn(),
        };

        useRoomContextMock.mockReturnValue(createRoomSharingTrack(mockTrack));
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        const stopPiP = vi.fn();

        renderUseCurrentScreenShare({ stopPiP });

        expect(mockTrack.on).toHaveBeenCalledWith('ended', stopPiP);
    });

    it('should clean up track ended event listener when track changes', () => {
        const mockTrack1 = {
            on: vi.fn(),
            off: vi.fn(),
        };

        useRoomContextMock.mockReturnValue(createRoomSharingTrack(mockTrack1));
        useLocalParticipantMock.mockReturnValue({
            localParticipant: mockLocalParticipant,
        });

        const stopPiP = vi.fn();

        const { rerender } = renderUseCurrentScreenShare({ stopPiP });

        expect(mockTrack1.on).toHaveBeenCalledWith('ended', stopPiP);

        // Change to a different track
        const mockTrack2 = {
            on: vi.fn(),
            off: vi.fn(),
        };

        useRoomContextMock.mockReturnValue(createRoomSharingTrack(mockTrack2));
        rerender();

        // Should clean up old listener
        expect(mockTrack1.off).toHaveBeenCalledWith('ended', stopPiP);
        // Should add new listener
        expect(mockTrack2.on).toHaveBeenCalledWith('ended', stopPiP);
    });
});
