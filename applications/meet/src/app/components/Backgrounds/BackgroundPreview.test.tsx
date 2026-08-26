import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';

import { backgroundReducer } from '@proton/meet/store/slices/backgroundSlice';
import { deviceManagementReducer } from '@proton/meet/store/slices/deviceManagementSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import type { MediaManagementContextType } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { MediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { BackgroundPreview } from './BackgroundPreview';

vi.mock('livekit-client', () => ({
    Track: { Source: { Camera: 'camera' } },
}));

const livekitReact = vi.hoisted(() => ({
    useLocalParticipant: vi.fn(() => ({ localParticipant: { identity: 'local' } })),
    useParticipantTracks: vi.fn((): unknown[] => [{ publication: { trackSid: 'sid' } }]),
    VideoTrack: () => <div data-testid="published-camera" />,
}));
vi.mock('@livekit/components-react', () => livekitReact);

vi.mock('@proton/shared/lib/helpers/browser', () => ({ isMobile: () => false, isSafari: () => false }));

const createMockStore = (cameraPermission: PermissionState) =>
    configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...deviceManagementReducer,
            ...backgroundReducer,
        },
        preloadedState: {
            deviceManagement: {
                permissions: { camera: cameraPermission, microphone: cameraPermission },
            },
            background: {
                initializingBackgroundEffect: null,
                failedBackgroundEffect: null,
            },
        },
    });

const renderPreview = (
    contextValue: Partial<MediaManagementContextType>,
    { cameraPermission = 'granted' as PermissionState } = {}
) =>
    render(
        <Provider context={ProtonStoreContext} store={createMockStore(cameraPermission)}>
            <MediaManagementContext.Provider
                // @ts-expect-error - contextValue is a partial MediaManagementContextType
                value={{
                    facingMode: 'user',
                    cleanupPreviewTrack: vi.fn(),
                    cleanupCameraPreview: vi.fn(),
                    ...contextValue,
                }}
            >
                <BackgroundPreview selectedCameraId="camera-1" />
            </MediaManagementContext.Provider>
        </Provider>
    );

describe('BackgroundPreview', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should reuse the published camera track while the camera is on in the meeting', () => {
        const handlePreviewCameraToggle = vi.fn().mockResolvedValue(true);

        renderPreview({ isVideoEnabled: true, handlePreviewCameraToggle });

        expect(screen.getByTestId('published-camera')).toBeInTheDocument();
        // Reusing the meeting track keeps the preview off a second camera stream.
        expect(handlePreviewCameraToggle).not.toHaveBeenCalled();
    });

    it('should start its own camera track while the camera is off in the meeting', async () => {
        const handlePreviewCameraToggle = vi.fn().mockResolvedValue(true);

        renderPreview({ isVideoEnabled: false, handlePreviewCameraToggle });

        expect(screen.queryByTestId('published-camera')).not.toBeInTheDocument();

        await waitFor(() => expect(handlePreviewCameraToggle).toHaveBeenCalledTimes(1));
        expect(handlePreviewCameraToggle).toHaveBeenCalledWith(expect.any(HTMLVideoElement));
    });

    it('should stop its own camera track when the preview goes away', async () => {
        const cleanupPreviewTrack = vi.fn().mockResolvedValue(undefined);
        const handlePreviewCameraToggle = vi.fn().mockResolvedValue(true);

        const { unmount } = renderPreview({ isVideoEnabled: false, handlePreviewCameraToggle, cleanupPreviewTrack });

        await waitFor(() => expect(handlePreviewCameraToggle).toHaveBeenCalled());

        unmount();

        expect(cleanupPreviewTrack).toHaveBeenCalled();
    });

    it('should release the preview processors when the preview goes away', async () => {
        const cleanupCameraPreview = vi.fn().mockResolvedValue(undefined);
        const handlePreviewCameraToggle = vi.fn().mockResolvedValue(true);

        const { unmount } = renderPreview({ isVideoEnabled: false, handlePreviewCameraToggle, cleanupCameraPreview });

        await waitFor(() => expect(handlePreviewCameraToggle).toHaveBeenCalled());

        unmount();

        // Stopping the track alone would leave a second segmentation pipeline loaded for the
        // rest of the meeting.
        expect(cleanupCameraPreview).toHaveBeenCalled();
    });

    it('should report when its own camera track cannot be started', async () => {
        const handlePreviewCameraToggle = vi.fn().mockResolvedValue(false);

        renderPreview({ isVideoEnabled: false, handlePreviewCameraToggle });

        expect(await screen.findByText('Preview unavailable')).toBeInTheDocument();
    });

    it.each<PermissionState>(['prompt', 'denied'])(
        'should ask for camera access instead of previewing when the permission is %s',
        (cameraPermission) => {
            const handlePreviewCameraToggle = vi.fn().mockResolvedValue(true);

            renderPreview({ isVideoEnabled: false, handlePreviewCameraToggle }, { cameraPermission });

            expect(screen.getByText('Allow camera access to preview your background')).toBeInTheDocument();
            // Starting a track here would trigger a permission prompt from the picker itself.
            expect(handlePreviewCameraToggle).not.toHaveBeenCalled();
        }
    );

    it('should not reuse the published track without the camera permission', () => {
        renderPreview({ isVideoEnabled: true }, { cameraPermission: 'denied' });

        expect(screen.queryByTestId('published-camera')).not.toBeInTheDocument();
        expect(screen.getByText('Allow camera access to preview your background')).toBeInTheDocument();
    });
});
