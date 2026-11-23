import { useCallback, useMemo, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import debounce from 'lodash/debounce';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import { selectJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { setDevicesInitializing, setUserCameraIntent } from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectActiveCameraId,
    selectInitialCameraState,
    selectRealtimeDevices,
    selectSelectedCameraId,
    selectUserCameraIntent,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { meetingLogger } from '@proton/meet/utils/meetingLogger';
import { isAndroid, isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';

import { useStableCallback } from '../../../hooks/useStableCallback';
import type { SwitchActiveDevice, ToggleVideoType } from '../../../types';
import { getCurrentCameraTrack } from '../../../utils/cameraTrack';
import { isDummyVideoTrack, markVideoTrackDeviceBacked } from '../../../utils/dummyVideoTrack';
import { enableDeviceTrack } from '../../../utils/enableDeviceTrack';
import { ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE } from './constants';

// Firefox crop-and-scales the camera to the requested size by default
const getNativeCameraSizeOptions = (): { resizeMode?: 'none' } =>
    isFirefox() && isAndroid() ? { resizeMode: 'none' } : {};

interface UseVideoToggleParams {
    switchActiveDevice: SwitchActiveDevice;
    reapplyBackgroundEffect: (isCameraEnabled: boolean) => Promise<void>;
}

export const useVideoToggle = ({ switchActiveDevice, reapplyBackgroundEffect }: UseVideoToggleParams) => {
    const { reportMeetError: reportError } = useMeetErrorReporting();

    const dispatch = useMeetDispatch();
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);
    const selectedCameraDeviceId = useMeetSelector(selectSelectedCameraId);
    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const userCameraIntent = useMeetSelector(selectUserCameraIntent);
    const store = useMeetStore();

    const room = useRoomContext();
    const { isCameraEnabled, localParticipant } = useLocalParticipant();

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');

    const toggleInProgress = useRef(false);

    const toggleVideo: ToggleVideoType = useStableCallback(
        async ({
            isEnabled = userCameraIntent ?? initialCameraState,
            videoDeviceId = activeCameraDeviceId,
            facingMode: customFacingMode,
            preserveCache,
            recoveringFromError = false,
            updateUserIntent = true,
            hasLeftMeeting,
        } = {}) => {
            let toggleResult = false;

            const deviceId = videoDeviceId;

            if (toggleInProgress.current || (!deviceId && !isMobile())) {
                return;
            }

            // In case of unplugging a device LiveKit sets the enabled status to false, but we want to keep the previous state
            if (updateUserIntent) {
                dispatch(setUserCameraIntent(isEnabled));
            }

            toggleInProgress.current = true;

            const facingModeDependentOptions =
                customFacingMode || isMobile()
                    ? {
                          facingMode: customFacingMode ?? facingMode,
                          ...getNativeCameraSizeOptions(),
                      }
                    : {
                          deviceId: { exact: deviceId },
                          ...getNativeCameraSizeOptions(),
                      };

            const currentVideoTrack = getCurrentCameraTrack(room);

            // When joining with camera off, a placeholder canvas track is published in place of the real camera
            const isReplacingDummyTrack = isEnabled && !!currentVideoTrack && isDummyVideoTrack(currentVideoTrack);

            try {
                if (currentVideoTrack) {
                    try {
                        // Ensure processor is fully stopped before proceeding
                        await currentVideoTrack.stopProcessor();
                    } catch (error) {
                        meetingLogger.error('Error stopping processor:', error);
                    }
                }

                await switchActiveDevice({
                    deviceType: 'videoinput',
                    deviceId: deviceId as string,
                    isSystemDefaultDevice: false,
                    preserveDefaultDevice: !!preserveCache,
                    throwOnError: true,
                });

                if (isReplacingDummyTrack && currentVideoTrack) {
                    const replacementOptions =
                        customFacingMode || isMobile()
                            ? { facingMode: customFacingMode ?? facingMode }
                            : { deviceId: { exact: selectedCameraDeviceId || deviceId } };
                    await currentVideoTrack.restartTrack(replacementOptions);
                    await currentVideoTrack.unmute();
                    markVideoTrackDeviceBacked(currentVideoTrack);
                } else if (isEnabled && hasLeftMeeting) {
                    const isPublished = await enableDeviceTrack(
                        localParticipant,
                        { source: Track.Source.Camera, options: facingModeDependentOptions },
                        hasLeftMeeting
                    );
                    if (!isPublished) {
                        return false;
                    }
                } else {
                    await localParticipant.setCameraEnabled(isEnabled, facingModeDependentOptions);
                }

                await reapplyBackgroundEffect(isEnabled);

                // We need to restart the video track on mobile to make sure the facing mode is applied
                if (customFacingMode) {
                    await getCurrentCameraTrack(room)?.restartTrack({
                        facingMode: customFacingMode,
                        ...getNativeCameraSizeOptions(),
                    });
                }

                toggleResult = true;
            } catch (error) {
                reportError('Failed to toggle video', error);

                const updatedCameras = await selectRealtimeDevices(store, 'videoinput');

                const isPotentialStaleDeviceState = ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE.includes(
                    (error as Error)?.name
                );

                // Pick any available camera other than the one that just failed.
                const fallback = updatedCameras.find((d) => d.deviceId && d.deviceId !== deviceId);

                // Recovering from potential stale device state
                if (!recoveringFromError && isPotentialStaleDeviceState && updatedCameras.length > 0 && fallback) {
                    meetingLogger.info('[toggleVideo] recovering with fallback', fallback.deviceId);

                    toggleInProgress.current = false;

                    const recoveryResult = (await toggleVideo({
                        isEnabled,
                        videoDeviceId: fallback.deviceId,
                        recoveringFromError: true,
                        preserveCache: false,
                        hasLeftMeeting,
                    })) as boolean;
                    toggleResult = recoveryResult ?? false;
                } else {
                    reportError('Failed to toggle video', {
                        context: {
                            error,
                            recoveringFromError,
                            isPotentialStaleDeviceState,
                            hasFallback: !!fallback,
                        },
                    });
                }
            } finally {
                toggleInProgress.current = false;
            }

            return toggleResult;
        }
    );

    const handleRotateCamera = useCallback(async () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacingMode);
        sendMeetActionsEvent(TelemetryMeetActionsEvents.camera_rotated, {
            cameraFacing: newFacingMode === 'user' ? 'front' : 'back',
        });

        if (room.state === ConnectionState.Connected) {
            await toggleVideo({
                isEnabled: true,
                facingMode: newFacingMode,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode, toggleVideo]);

    // Publishes a new camera track in place of the current one, so it starts again from LiveKit's default
    // encodings. Remote participants see the camera disappear until the new track arrives.
    const republishCamera = useStableCallback(async () => {
        const track = getCurrentCameraTrack(room);
        // The checks toggleVideo would stop at, done before unpublishing so the camera is never left off
        if (
            toggleInProgress.current ||
            !track ||
            track.isMuted ||
            isDummyVideoTrack(track) ||
            (!activeCameraDeviceId && !isMobile())
        ) {
            return false;
        }

        // Leaving clears joinedRoom at once, while the room only reports Disconnected once LiveKit has closed
        const hasLeftMeeting = () => room.state === ConnectionState.Disconnected || !selectJoinedRoom(store.getState());

        // The button would read "Turn on camera" while the publication is gone, so it shows the camera as starting
        dispatch(setDevicesInitializing({ camera: true }));
        try {
            toggleInProgress.current = true;
            try {
                await localParticipant.unpublishTrack(track);
            } catch (error) {
                reportError('Failed to unpublish the camera to republish it', { context: { error } });
                return false;
            } finally {
                toggleInProgress.current = false;
            }

            if (room.state !== ConnectionState.Connected || hasLeftMeeting()) {
                return false;
            }

            return (
                (await toggleVideo({
                    isEnabled: true,
                    preserveCache: true,
                    updateUserIntent: false,
                    hasLeftMeeting,
                })) ?? false
            );
        } finally {
            dispatch(setDevicesInitializing({ camera: false }));
        }
    });

    const debouncedToggleVideo = useMemo(() => debounce(toggleVideo, 500, { leading: true }), [toggleVideo]);

    return {
        toggleVideo: debouncedToggleVideo,
        republishCamera,
        handleRotateCamera,
        isVideoEnabled: isCameraEnabled,
        facingMode,
    };
};
