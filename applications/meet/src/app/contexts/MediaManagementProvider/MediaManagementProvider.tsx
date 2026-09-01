import { useCallback, useEffect, useMemo } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { LocalTrack } from 'livekit-client';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import {
    PermissionBlockedError,
    requestPermission,
    setActiveDevice,
    setInitialAudioState,
    setInitialCameraState,
    setMediaInitializing,
    setPreferredDeviceAndPersist,
    showPermissionsModal,
} from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectActiveAudioOutputId,
    selectActiveCameraId,
    selectActiveMicrophoneId,
    selectCameraPermission,
    selectCameras,
    selectInitialAudioState,
    selectInitialCameraState,
    selectMicrophonePermission,
    selectMicrophones,
    selectRealtimeDevices,
    selectSelectedAudioOutputId,
    selectSelectedCameraId,
    selectSelectedMicrophoneId,
    selectSpeakerState,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import {
    PermissionPromptStatus,
    setNoDeviceDetected,
    setPermissionPromptStatus,
} from '@proton/meet/store/slices/uiStateSlice';
import { setAudioSessionType } from '@proton/meet/utils/iosAudioSession';
import { TimeoutError, withTimeout } from '@proton/meet/utils/withTimeout';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import { AnnouncementPriority } from '../../components/MeetingAnnouncer/types';
import { useAnnounce } from '../../components/MeetingAnnouncer/useAnnounce';
import { useMediaToggleShortcuts } from '../../hooks/useMediaToggleShortcuts';
import { useStableCallback } from '../../hooks/useStableCallback';
import { supportsBackgroundEffects } from '../../processors/background-processor/createBackgroundProcessor';
import type { InitializeDevices, SwitchActiveDevice } from '../../types';
import { supportsSetSinkId } from '../../utils/browser';
import { createDummyVideoTrack } from '../../utils/dummyVideoTrack';
import type { MeetAudioContext } from '../../utils/meet-audio-context';
import { BackgroundEffectsContext } from '../BackgroundEffects/BackgroundEffectsContext';
import { useAppliedBackgroundEffect } from '../BackgroundEffects/useAppliedBackgroundEffect';
import { useBackgroundEffects } from '../BackgroundEffects/useBackgroundEffects';
import { useBackgroundProcessorPreload } from '../BackgroundEffects/useBackgroundProcessorPreload';
import { MediaManagementContext } from './MediaManagementContext';
import { PermissionsModal } from './PermissionsModal/PermissionsModal';
import { useAudioToggle } from './mediaToggle/useAudioToggle';
import { useVideoToggle } from './mediaToggle/useVideoToggle';
import { useCameraPreview } from './useCameraPreview';
import { useAudioContextOutput } from './useDeviceManagement/useAudioContextOutput';
import { useDeviceManagement } from './useDeviceManagement/useDeviceManagement';
import { useMicrophoneVolumeAnalysis } from './useMicrophoneVolumeAnalysis';

const SWITCH_DEVICE_TIMEOUT_MS = 5000;

export const MediaManagementProvider = ({
    children,
    meetAudioContext,
}: {
    children: React.ReactNode;
    meetAudioContext: MeetAudioContext;
}) => {
    const room = useRoomContext();
    const { createNotification } = useNotifications();
    const announce = useAnnounce();
    const { reportMeetError } = useMeetErrorReporting();
    const dispatch = useMeetDispatch();
    const store = useMeetStore();

    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const initialAudioState = useMeetSelector(selectInitialAudioState);

    const activeMicrophoneDeviceId = useMeetSelector(selectActiveMicrophoneId);
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);

    const selectedCameraId = useMeetSelector(selectSelectedCameraId);
    const selectedMicrophoneId = useMeetSelector(selectSelectedMicrophoneId);
    const selectedAudioOutputDeviceId = useMeetSelector(selectSelectedAudioOutputId);

    const cameras = useMeetSelector(selectCameras);
    const microphones = useMeetSelector(selectMicrophones);
    const speakerState = useMeetSelector(selectSpeakerState);

    const { backgroundProcessorVersion } = useBackgroundProcessorPreload();

    const { getMicrophoneVolumeAnalysis, initializeMicrophoneVolumeAnalysis, cleanupMicrophoneVolumeAnalysis } =
        useMicrophoneVolumeAnalysis();

    useAudioContextOutput({ meetAudioContext, room, reportMeetError });

    const switchActiveDevice: SwitchActiveDevice = useCallback(
        async ({
            deviceType,
            deviceId,
            isSystemDefaultDevice,
            preserveDefaultDevice = false,
            throwOnError = false,
        }) => {
            if (deviceType === 'audiooutput' && !supportsSetSinkId()) {
                return;
            }

            let selectedDeviceId = deviceId;
            const targetDeviceId = deviceType === 'audiooutput' && isSystemDefaultDevice ? '' : deviceId;

            const activeDeviceIdByType: Record<'audioinput' | 'audiooutput' | 'videoinput', string> = {
                audioinput: activeMicrophoneDeviceId,
                audiooutput: activeAudioOutputDeviceId,
                videoinput: activeCameraDeviceId,
            };

            try {
                try {
                    if (activeDeviceIdByType[deviceType] !== targetDeviceId) {
                        await withTimeout(
                            room.switchActiveDevice(deviceType, targetDeviceId),
                            'Switch active device',
                            SWITCH_DEVICE_TIMEOUT_MS
                        );

                        // eslint-disable-next-line no-console
                        console.log(`[switchActiveDevice] switched`, {
                            deviceType,
                            requested: deviceId,
                            sent: targetDeviceId,
                            isSystemDefaultDevice,
                            livekitActive: room.getActiveDevice(deviceType),
                            livekitAudioOutput: room.options.audioOutput?.deviceId,
                        });
                    } else {
                        // eslint-disable-next-line no-console
                        console.log(`[switchActiveDevice] skipped, already active`, {
                            deviceType,
                            requested: deviceId,
                            sent: targetDeviceId,
                            isSystemDefaultDevice,
                            livekitActive: room.getActiveDevice(deviceType),
                            livekitAudioOutput: room.options.audioOutput?.deviceId,
                        });
                    }
                } catch (error) {
                    if (deviceType !== 'videoinput' || error instanceof TimeoutError) {
                        throw error;
                    }

                    const enumerated = await selectRealtimeDevices(store, deviceType);
                    const fallback = enumerated.find((d) => d.deviceId && d.deviceId !== deviceId);

                    if (!fallback) {
                        throw error;
                    }

                    selectedDeviceId = fallback.deviceId;

                    // eslint-disable-next-line no-console
                    console.warn(`[switchActiveDevice] videoinput fallback`, {
                        deviceType,
                        deviceId: selectedDeviceId,
                        errorName: (error as Error)?.name,
                        errorMessage: (error as Error)?.message,
                        error,
                    });

                    await withTimeout(
                        room.switchActiveDevice(deviceType, selectedDeviceId),
                        `room.switchActiveDevice(${deviceType}) fallback`,
                        SWITCH_DEVICE_TIMEOUT_MS
                    );
                }
            } catch (error) {
                const errorName = error instanceof Error ? error.name : 'Unknown';

                reportMeetError('Failed to switch active device', {
                    context: { error },
                    tags: {
                        deviceType,
                        errorName,
                        isSystemDefaultDevice,
                        preserveDefaultDevice,
                        supportsSetSinkId: supportsSetSinkId(),
                    },
                    fingerprint: ['failed-to-switch-active-device', deviceType, errorName],
                });

                if (throwOnError) {
                    throw error;
                }

                return;
            }

            if (preserveDefaultDevice) {
                return;
            }

            const toSave = isSystemDefaultDevice ? null : selectedDeviceId;
            dispatch(setPreferredDeviceAndPersist({ kind: deviceType, deviceId: toSave }));
        },
        [
            activeMicrophoneDeviceId,
            activeAudioOutputDeviceId,
            activeCameraDeviceId,
            dispatch,
            room,
            store,
            reportMeetError,
        ]
    );

    const {
        selectBackgroundEffect,
        toggleBackgroundBlur,
        reapplyBackgroundEffect,
        trackBackgroundEffectInitialization,
        cancelBackgroundEffectInitialization,
    } = useBackgroundEffects({ backgroundProcessorVersion });

    const { toggleVideo, handleRotateCamera, isVideoEnabled, facingMode } = useVideoToggle({
        switchActiveDevice,
        reapplyBackgroundEffect,
    });

    const { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled } = useAudioToggle(switchActiveDevice);

    const { permissionsLoading } = useDeviceManagement({ toggleAudio, toggleVideo, switchActiveDevice });

    const isBackgroundBlurSupported = supportsBackgroundEffects();
    const appliedBackgroundEffect = useAppliedBackgroundEffect();

    const backgroundEffects = useMemo(
        () => ({ selectBackgroundEffect, toggleBackgroundBlur }),
        [selectBackgroundEffect, toggleBackgroundBlur]
    );

    const { handlePreviewCameraToggle, cleanupCameraPreview, cleanupPreviewTrack } = useCameraPreview({
        selectedCameraId: activeCameraDeviceId,
        facingMode: 'user',
        isBackgroundBlurSupported,
        backgroundEffect: appliedBackgroundEffect,
        backgroundProcessorVersion,
        room,
        trackBackgroundEffectInitialization,
        cancelBackgroundEffectInitialization,
    });

    const cameraPermission = useMeetSelector(selectCameraPermission);
    const microphonePermission = useMeetSelector(selectMicrophonePermission);

    const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

    const handleMicrophoneToggle = useCallback(() => {
        if (room.state === ConnectionState.Connected) {
            if (microphonePermission !== 'granted') {
                dispatch(setPermissionPromptStatus(PermissionPromptStatus.MICROPHONE));
                return;
            }
            if (microphones.length === 0) {
                dispatch(setNoDeviceDetected(PermissionPromptStatus.MICROPHONE));
                return;
            }

            return toggleAudio({
                isEnabled: !isMicrophoneEnabled,
                audioDeviceId: selectedMicrophoneId,
                preserveCache: true,
            });
        }

        if (microphonePermission !== 'granted' || microphones.length === 0) {
            return dispatch(requestPermission('microphone')).catch((error) => {
                if (error instanceof PermissionBlockedError) {
                    dispatch(
                        showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_MICROPHONE_MODAL })
                    );
                }
            });
        }

        dispatch(setInitialAudioState(!initialAudioState));
    }, [
        room,
        microphonePermission,
        microphones.length,
        isMicrophoneEnabled,
        selectedMicrophoneId,
        initialAudioState,
        toggleAudio,
        dispatch,
    ]);

    // Single source of truth for toggling the camera, shared by the camera control button
    // (in a meeting), the device-settings button (prejoin) and the keyboard shortcut.
    // - In a meeting: replicates the ParticipantControls camera button.
    // - On prejoin: replicates the DeviceSettings camera button.
    const handleCameraToggle = useCallback(() => {
        if (room.state === ConnectionState.Connected) {
            if (cameraPermission !== 'granted') {
                dispatch(setPermissionPromptStatus(PermissionPromptStatus.CAMERA));
                return;
            }
            if (cameras.length === 0) {
                dispatch(setNoDeviceDetected(PermissionPromptStatus.CAMERA));
                return;
            }
            if (!selectedCameraId) {
                return;
            }

            return toggleVideo({
                isEnabled: !isCameraEnabled,
                videoDeviceId: selectedCameraId,
                preserveCache: true,
            });
        }

        if (cameraPermission !== 'granted' || cameras.length === 0) {
            return dispatch(requestPermission('camera', activeCameraDeviceId)).catch((error) => {
                if (error instanceof PermissionBlockedError) {
                    dispatch(showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_CAMERA_MODAL }));
                }
            });
        }

        dispatch(setInitialCameraState(!initialCameraState));
    }, [
        room,
        cameraPermission,
        cameras.length,
        isCameraEnabled,
        selectedCameraId,
        activeCameraDeviceId,
        initialCameraState,
        toggleVideo,
        dispatch,
    ]);

    useMediaToggleShortcuts({
        onToggleMicrophone: () => {
            void handleMicrophoneToggle();
        },
        onToggleCamera: () => {
            void handleCameraToggle();
        },
        dependencies: [handleMicrophoneToggle, handleCameraToggle],
    });

    useEffect(() => {
        if (cameraPermission === 'denied') {
            if (room.state === ConnectionState.Connected) {
                void room.localParticipant.setCameraEnabled(false);
            } else {
                dispatch(setInitialCameraState(false));
            }
        }
    }, [cameraPermission, room, dispatch]);

    useEffect(() => {
        if (microphonePermission === 'denied') {
            if (room.state === ConnectionState.Connected) {
                void room.localParticipant.setMicrophoneEnabled(false);
            } else {
                dispatch(setInitialAudioState(false));
            }
        }
    }, [microphonePermission, room, dispatch]);

    const initializeCamera = async (camState: boolean) => {
        try {
            // When joining with the camera off, publish a muted placeholder track instead of acquiring the real
            // camera just to mute it. This avoids flashing the camera light and a brief self-view during join, and
            // keeps the device idle until the user actually turns it on. Firefox is excluded because it doesn't
            // handle the dummy track reliably, so there we fall through to enabling the real camera and muting it.
            if (!camState && !isFirefox()) {
                const existingPublication = [...room.localParticipant.videoTrackPublications.values()].find(
                    (pub) => pub.source === Track.Source.Camera
                );
                if (existingPublication?.track) {
                    await existingPublication.track.mute();
                    return;
                }

                const dummyTrack = createDummyVideoTrack(room);
                if (!dummyTrack) {
                    throw new Error('Failed to create placeholder video track');
                }

                await room.localParticipant.publishTrack(dummyTrack, { source: Track.Source.Camera });
                await dummyTrack.mute();

                // The placeholder has no real device. Record the intended camera as active so the device list shows a
                // selection and enabling the camera targets the right device.
                const intendedCameraId = selectedCameraId || cameras[0]?.deviceId;
                if (intendedCameraId) {
                    dispatch(setActiveDevice({ kind: 'videoinput', deviceId: intendedCameraId }));
                }
                return;
            }

            const result = await toggleVideo({
                videoDeviceId: selectedCameraId,
                isEnabled: true,
                preserveCache: true,
                updateUserIntent: false,
            });

            if (!result) {
                throw new Error('Failed to initialize camera');
            }

            if (!camState) {
                const videoPublication = [...room.localParticipant.videoTrackPublications.values()].find(
                    (pub) => pub.source === Track.Source.Camera
                );
                if (videoPublication?.track) {
                    await videoPublication.track.mute();
                }
            }
        } catch (error) {
            reportMeetError('Failed to initialize camera', error);
            throw error;
        }
    };

    const initializeMicrophone = async (audioState: boolean) => {
        try {
            setAudioSessionType('auto');

            const audioConstraints = {
                autoGainControl: true,
                echoCancellation: true,
                noiseSuppression: true,
            };

            await room.localParticipant.setMicrophoneEnabled(true, audioConstraints);

            setAudioSessionType('play-and-record');

            // If starting muted, mute the track (keeps it published but silent)
            if (!audioState) {
                const audioPublication = [...room.localParticipant.audioTrackPublications.values()].find(
                    (pub) => pub.kind === Track.Kind.Audio && pub.source !== Track.Source.ScreenShare
                );

                if (audioPublication?.track) {
                    await audioPublication.track.mute();
                }
            } else {
                const result = await toggleAudio({
                    audioDeviceId: selectedMicrophoneId,
                    isEnabled: true,
                    preserveCache: true,
                });

                if (!result) {
                    throw new Error('Failed to initialize microphone');
                }
            }
        } catch (error) {
            reportMeetError('Failed to initialize microphone', error);
            throw error;
        }
    };

    const initializeAudioOutput = async (audioOutputState: boolean) => {
        try {
            if (audioOutputState) {
                await switchActiveDevice({
                    deviceType: 'audiooutput',
                    deviceId: selectedAudioOutputDeviceId,
                    isSystemDefaultDevice: speakerState.useSystemDefault,
                });
            }
        } catch (error) {
            reportMeetError('Failed to initialize audio output', error);
            throw error;
        }
    };

    const initializeDevices: InitializeDevices = async ({ timeoutMs, desiredCameraState, desiredMicrophoneState }) => {
        const cameraState = desiredCameraState ?? initialCameraState;
        const microphoneState = desiredMicrophoneState ?? initialAudioState;

        // Suppress the local self-view while devices initialize
        dispatch(setMediaInitializing(true));

        const initializeDevicesInternal = async () => {
            await cleanupCameraPreview();

            await wait(200);

            await cleanupMicrophoneVolumeAnalysis();

            const results = await Promise.allSettled([
                // Do not initialize camera if permission is not granted
                cameraPermission === 'granted' ? initializeCamera(cameraState) : Promise.resolve(),
                // Do not initialize microphone if permission is not granted
                microphonePermission === 'granted' ? initializeMicrophone(microphoneState) : Promise.resolve(),
                initializeAudioOutput(true),
            ]);

            const cameraError = results[0].status === 'rejected' ? results[0].reason : null;
            const microphoneError = results[1].status === 'rejected' ? results[1].reason : null;

            if (cameraError || microphoneError) {
                if (cameraError) {
                    reportMeetError('Failed to initialize camera', cameraError);
                }
                if (microphoneError) {
                    reportMeetError('Failed to initialize microphone', microphoneError);
                }

                let errorMessage: string;
                if (cameraError && microphoneError) {
                    errorMessage = c('Warning')
                        .t`Could not access camera or microphone. You can try enabling them again from the meeting controls.`;
                } else if (cameraError) {
                    errorMessage = c('Warning')
                        .t`Could not access camera. You can try enabling it again from the meeting controls.`;
                } else {
                    errorMessage = c('Warning')
                        .t`Could not access microphone. You can try enabling it again from the meeting controls.`;
                }

                createNotification({
                    type: 'warning',
                    text: errorMessage,
                });
                announce(errorMessage, {
                    dedupeKey: `media-device-access-${Boolean(cameraError)}-${Boolean(microphoneError)}`,
                    priority: AnnouncementPriority.High,
                });
            }
        };

        try {
            if (timeoutMs !== undefined) {
                try {
                    const initializeDevicesPromise = initializeDevicesInternal();
                    const timeoutPromise = new Promise<void>((resolve) => {
                        setTimeout(() => {
                            resolve();
                        }, timeoutMs);
                    });

                    await Promise.race([initializeDevicesPromise, timeoutPromise]);
                } catch (error) {
                    reportMeetError('Failed to initialize devices, continuing anyway', error);
                }
            } else {
                await initializeDevicesInternal();
            }
        } finally {
            dispatch(setMediaInitializing(false));
        }
    };

    const cleanupPreviews = useStableCallback(async () => {
        await cleanupCameraPreview();
        await cleanupMicrophoneVolumeAnalysis();
    });

    useEffect(() => {
        const wasConnectedRef = { current: false };
        const cleanupInProgressRef = { current: false };

        const handleCleanup = async (shouldCleanupPreviews: boolean = true) => {
            if (cleanupInProgressRef.current) {
                return;
            }

            cleanupInProgressRef.current = true;

            const localParticipant = room.localParticipant;

            // Snapshot track references before any async operations
            // LiveKit may clear trackPublications during disconnect/unpublish
            const tracks = [...localParticipant.trackPublications.values()]
                .map((pub) => pub.track)
                .filter((track): track is LocalTrack => !!track);

            try {
                await Promise.allSettled([
                    localParticipant.setScreenShareEnabled(false),
                    localParticipant.setCameraEnabled(false),
                    localParticipant.setMicrophoneEnabled(false),
                    shouldCleanupPreviews ? cleanupPreviews() : Promise.resolve(),
                ]);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }

            tracks.forEach((track) => {
                try {
                    track.stop();
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error(error);
                }
            });

            cleanupInProgressRef.current = false;
        };

        const handleConnected = () => {
            wasConnectedRef.current = true;
        };

        const handleDisconnected = () => {
            if (!wasConnectedRef.current) {
                return;
            }

            wasConnectedRef.current = false;
            void handleCleanup(false);
        };

        room.on(RoomEvent.Connected, handleConnected);
        room.on(RoomEvent.Disconnected, handleDisconnected);

        return () => {
            room.off(RoomEvent.Connected, handleConnected);
            room.off(RoomEvent.Disconnected, handleDisconnected);

            void handleCleanup(true);
        };
    }, [cleanupPreviews, room]);

    return (
        <MediaManagementContext.Provider
            value={{
                handlePreviewCameraToggle,
                cleanupPreviewTrack,
                cleanupCameraPreview,
                isVideoEnabled,
                isAudioEnabled,
                facingMode,
                toggleVideo,
                toggleAudio,
                handleMicrophoneToggle,
                handleCameraToggle,
                noiseFilter,
                toggleNoiseFilter,
                handleRotateCamera,
                switchActiveDevice,
                initializeDevices,
                getMicrophoneVolumeAnalysis,
                initializeMicrophoneVolumeAnalysis,
                cleanupMicrophoneVolumeAnalysis,
            }}
        >
            <BackgroundEffectsContext.Provider value={backgroundEffects}>
                {!permissionsLoading && <PermissionsModal />}
                {children}
            </BackgroundEffectsContext.Provider>
        </MediaManagementContext.Provider>
    );
};
