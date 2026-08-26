import { useCallback, useMemo, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import debounce from 'lodash/debounce';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import { setUserCameraIntent } from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectActiveCameraId,
    selectInitialCameraState,
    selectRealtimeDevices,
    selectSelectedCameraId,
    selectUserCameraIntent,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useStableCallback } from '../../../hooks/useStableCallback';
import type { SwitchActiveDevice, ToggleVideoType } from '../../../types';
import { getCurrentCameraTrack } from '../../../utils/cameraTrack';
import { isDummyVideoTrack, markVideoTrackDeviceBacked } from '../../../utils/dummyVideoTrack';
import { ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE } from './constants';

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
                      }
                    : {
                          deviceId: { exact: deviceId },
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
                        // eslint-disable-next-line no-console
                        console.error('Error stopping processor:', error);
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
                } else {
                    await localParticipant.setCameraEnabled(isEnabled, facingModeDependentOptions);
                }

                await reapplyBackgroundEffect(isEnabled);

                // We need to restart the video track on mobile to make sure the facing mode is applied
                if (customFacingMode) {
                    await getCurrentCameraTrack(room)?.restartTrack({ facingMode: customFacingMode });
                }

                toggleResult = true;
            } catch (error) {
                reportError('Failed to toggle video', error);
                // eslint-disable-next-line no-console
                console.error(error);

                const updatedCameras = await selectRealtimeDevices(store, 'videoinput');

                const isPotentialStaleDeviceState = ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE.includes(
                    (error as Error)?.name
                );

                // Pick any available camera other than the one that just failed.
                const fallback = updatedCameras.find((d) => d.deviceId && d.deviceId !== deviceId);

                // Recovering from potential stale device state
                if (!recoveringFromError && isPotentialStaleDeviceState && updatedCameras.length > 0 && fallback) {
                    // eslint-disable-next-line no-console
                    console.log('[toggleVideo] recovering with fallback', fallback.deviceId);

                    toggleInProgress.current = false;

                    const recoveryResult = (await toggleVideo({
                        isEnabled,
                        videoDeviceId: fallback.deviceId,
                        recoveringFromError: true,
                        preserveCache: false,
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

        if (room.state === ConnectionState.Connected) {
            await toggleVideo({
                isEnabled: true,
                facingMode: newFacingMode,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode, toggleVideo]);

    const debouncedToggleVideo = useMemo(() => debounce(toggleVideo, 500, { leading: true }), [toggleVideo]);

    return {
        toggleVideo: debouncedToggleVideo,
        handleRotateCamera,
        isVideoEnabled: isCameraEnabled,
        facingMode,
    };
};
