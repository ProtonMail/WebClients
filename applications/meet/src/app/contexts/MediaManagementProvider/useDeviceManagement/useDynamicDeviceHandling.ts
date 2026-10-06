import { useEffect, useMemo, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { ConnectionState, type LocalTrack, MediaDeviceFailure, RoomEvent, Track } from 'livekit-client';
import debounce from 'lodash/debounce';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { clearDisconnectedActiveDevice } from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectActiveAudioOutputId,
    selectActiveCameraId,
    selectActiveMicrophoneId,
    selectDisconnectedActiveDevices,
    selectFilteredCameras,
    selectFilteredMicrophones,
    selectFilteredSpeakers,
    selectMicrophoneState,
    selectPreferredCameraId,
    selectSpeakerState,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import type { DeviceKind } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { type SerializableDeviceInfo, isDefaultDevice } from '@proton/meet/utils/deviceUtils';

import { useStableCallback } from '../../../hooks/useStableCallback';
import type { SwitchActiveDevice, ToggleAudioType, ToggleVideoType } from '../../../types';
import { supportsSetSinkId } from '../../../utils/browser';
import { useDeviceNotifications } from './useDeviceNotifications/useDeviceNotifications';

const DEVICE_CHANGE_DEBOUNCE_MS = 200;

export type DeviceDecision = { type: 'none' } | { type: 'switch'; deviceId: string };

const resolveDeviceDecision = ({
    kind,
    deviceList,
    activeDeviceId,
    disconnectedActiveDeviceId,
    preferredDeviceId,
    systemDefaultDevice,
    previousSystemDefaultDeviceId,
    canSwitchUnprompted,
}: {
    kind: DeviceKind;
    deviceList: SerializableDeviceInfo[];
    activeDeviceId: string | null;
    disconnectedActiveDeviceId: string | null;
    preferredDeviceId: string | null;
    systemDefaultDevice: SerializableDeviceInfo | null;
    previousSystemDefaultDeviceId: string | null;
    canSwitchUnprompted: boolean;
}): DeviceDecision => {
    const isAvailable = (deviceId: string | null) =>
        !!deviceId && deviceList.some((device) => device.deviceId === deviceId);

    const wasActiveDisconnected = !!disconnectedActiveDeviceId && !isAvailable(disconnectedActiveDeviceId);
    const isActiveAvailable = isAvailable(activeDeviceId) && !wasActiveDisconnected;

    const switchTo = (deviceId: string): DeviceDecision =>
        deviceId === activeDeviceId ? { type: 'none' } : { type: 'switch', deviceId };

    // The device the user picked is plugged in. Taking over mid call is more annoying than useful,
    // so it is only taken when nothing is in use or when joining.
    if (isAvailable(preferredDeviceId)) {
        if (preferredDeviceId === activeDeviceId) {
            return { type: 'none' };
        }

        return !isActiveAvailable || canSwitchUnprompted ? switchTo(preferredDeviceId as string) : { type: 'none' };
    }

    // No preference saved means the user wants whatever the OS is using, so we follow it when it moves.
    const followsSystemDefault = !preferredDeviceId;

    if (
        followsSystemDefault &&
        previousSystemDefaultDeviceId &&
        systemDefaultDevice?.deviceId &&
        previousSystemDefaultDeviceId !== systemDefaultDevice.deviceId
    ) {
        return switchTo(systemDefaultDevice.deviceId);
    }

    // From here on it is the recovery path: either nothing was picked yet, or what we were using is gone.
    if (isActiveAvailable || deviceList.length === 0 || isDefaultDevice(activeDeviceId)) {
        return { type: 'none' };
    }

    if (systemDefaultDevice?.deviceId) {
        const target = isAvailable(systemDefaultDevice.deviceId)
            ? systemDefaultDevice.deviceId
            : deviceList[0].deviceId;

        return switchTo(target);
    }

    // With no resolvable system default, picking the first audio device is a coin flip: on some Linux
    // setups it is an HDMI port with nothing plugged in. Video has no system default at all, so there
    // the first camera is the only option we have.
    return kind === 'videoinput' ? switchTo(deviceList[0].deviceId) : { type: 'none' };
};

interface UseDynamicDeviceHandlingParams {
    toggleVideo: ToggleVideoType;
    toggleAudio: ToggleAudioType;
    switchActiveDevice: SwitchActiveDevice;
}

export const useDynamicDeviceHandling = ({
    toggleAudio,
    toggleVideo,
    switchActiveDevice,
}: UseDynamicDeviceHandlingParams) => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const { reportMeetError } = useMeetErrorReporting();
    const { notifyActiveDeviceDisconnected } = useDeviceNotifications();

    const filteredMicrophones = useMeetSelector(selectFilteredMicrophones);
    const filteredCameras = useMeetSelector(selectFilteredCameras);
    const filteredSpeakers = useMeetSelector(selectFilteredSpeakers);

    const activeMicrophoneDeviceId = useMeetSelector(selectActiveMicrophoneId);
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);

    const preferredCameraId = useMeetSelector(selectPreferredCameraId);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const speakerState = useMeetSelector(selectSpeakerState);

    const disconnectedActiveDevices = useMeetSelector(selectDisconnectedActiveDevices);

    // Track previous system default device IDs to detect OS default device changes
    const previousSystemDefaultsRef = useRef<{
        microphone: string | null;
        speaker: string | null;
    }>({
        microphone: null,
        speaker: null,
    });

    // Initialize the previous system default device IDs because initial values are not available in the first render
    if (previousSystemDefaultsRef.current.microphone === null && microphoneState.systemDefault?.deviceId) {
        previousSystemDefaultsRef.current.microphone = microphoneState.systemDefault.deviceId;
    }
    if (previousSystemDefaultsRef.current.speaker === null && speakerState.systemDefault?.deviceId) {
        previousSystemDefaultsRef.current.speaker = speakerState.systemDefault.deviceId;
    }

    const isDeviceStillAvailable = useStableCallback((kind: DeviceKind, deviceId: string) => {
        const deviceListByKind: Record<DeviceKind, SerializableDeviceInfo[]> = {
            audioinput: filteredMicrophones,
            audiooutput: filteredSpeakers,
            videoinput: filteredCameras,
        };

        return deviceListByKind[kind].some((device) => device.deviceId === deviceId);
    });

    const applyDecision = useStableCallback(
        ({
            kind,
            decision,
            deviceList,
            activeDeviceId,
            systemDefault,
            applySwitch,
        }: {
            kind: DeviceKind;
            decision: DeviceDecision;
            deviceList: SerializableDeviceInfo[];
            activeDeviceId: string | null;
            systemDefault: SerializableDeviceInfo | null;
            applySwitch: (deviceId: string) => void;
        }) => {
            const disconnectedDevice = disconnectedActiveDevices[kind];

            if (disconnectedDevice) {
                dispatch(clearDisconnectedActiveDevice({ kind }));

                // A device that flapped within the debounce window never stopped being usable
                if (!isDeviceStillAvailable(kind, disconnectedDevice.deviceId)) {
                    const inUseDeviceId = decision.type === 'switch' ? decision.deviceId : activeDeviceId;
                    // The fallback is usually the system default, whose id is not in the list
                    const inUseDevice = isDefaultDevice(inUseDeviceId)
                        ? systemDefault
                        : deviceList.find((device) => device.deviceId === inUseDeviceId);

                    notifyActiveDeviceDisconnected({
                        device: disconnectedDevice,
                        replacementLabel: inUseDevice?.label ?? '',
                    });
                }
            }

            if (decision.type === 'none') {
                return;
            }

            applySwitch(decision.deviceId);
        }
    );

    const handleMicrophoneListChange = useStableCallback(() => {
        const decision = resolveDeviceDecision({
            kind: 'audioinput',
            deviceList: filteredMicrophones,
            activeDeviceId: activeMicrophoneDeviceId,
            disconnectedActiveDeviceId: disconnectedActiveDevices.audioinput?.deviceId ?? null,
            preferredDeviceId: microphoneState.preferredDeviceId,
            systemDefaultDevice: microphoneState.systemDefault,
            previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.microphone,
            canSwitchUnprompted: room.state !== ConnectionState.Connected,
        });

        applyDecision({
            kind: 'audioinput',
            decision,
            deviceList: filteredMicrophones,
            activeDeviceId: activeMicrophoneDeviceId,
            systemDefault: microphoneState.systemDefault,
            applySwitch: (newDeviceId: string) => {
                if (room.state === ConnectionState.Connected) {
                    void toggleAudio({ audioDeviceId: newDeviceId, preserveCache: true });
                } else {
                    void switchActiveDevice({
                        deviceType: 'audioinput',
                        deviceId: newDeviceId,
                        isSystemDefaultDevice: microphoneState.useSystemDefault,
                        preserveDefaultDevice: true,
                    });
                }
            },
        });

        previousSystemDefaultsRef.current.microphone = microphoneState.systemDefault?.deviceId ?? null;
    });

    const handleCameraListChange = useStableCallback(() => {
        const decision = resolveDeviceDecision({
            kind: 'videoinput',
            deviceList: filteredCameras,
            activeDeviceId: activeCameraDeviceId,
            disconnectedActiveDeviceId: disconnectedActiveDevices.videoinput?.deviceId ?? null,
            preferredDeviceId: preferredCameraId,
            systemDefaultDevice: null,
            previousSystemDefaultDeviceId: null,
            canSwitchUnprompted: room.state !== ConnectionState.Connected,
        });

        applyDecision({
            kind: 'videoinput',
            decision,
            deviceList: filteredCameras,
            activeDeviceId: activeCameraDeviceId,
            systemDefault: null,
            applySwitch: async (newDeviceId: string) => {
                if (room.state !== ConnectionState.Connected) {
                    void switchActiveDevice({
                        deviceType: 'videoinput',
                        deviceId: newDeviceId,
                        isSystemDefaultDevice: false,
                        preserveDefaultDevice: true,
                    });
                    return;
                }

                const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;

                // In case of unplugging a device, we need this extra cleanup if there was a background blur processor
                if (cameraTrack?.getProcessor()) {
                    await room.localParticipant.unpublishTrack(cameraTrack as LocalTrack);
                }

                void toggleVideo({ videoDeviceId: newDeviceId, preserveCache: true, updateUserIntent: false });
            },
        });
    });

    const handleSpeakerListChange = useStableCallback(() => {
        const decision = resolveDeviceDecision({
            kind: 'audiooutput',
            deviceList: filteredSpeakers,
            activeDeviceId: activeAudioOutputDeviceId,
            disconnectedActiveDeviceId: disconnectedActiveDevices.audiooutput?.deviceId ?? null,
            preferredDeviceId: speakerState.preferredDeviceId,
            systemDefaultDevice: speakerState.systemDefault,
            previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.speaker,
            canSwitchUnprompted: room.state !== ConnectionState.Connected,
        });

        applyDecision({
            kind: 'audiooutput',
            decision,
            deviceList: filteredSpeakers,
            activeDeviceId: activeAudioOutputDeviceId,
            systemDefault: speakerState.systemDefault,
            applySwitch: (newDeviceId: string) => {
                if (supportsSetSinkId()) {
                    void switchActiveDevice({
                        deviceType: 'audiooutput',
                        deviceId: newDeviceId,
                        isSystemDefaultDevice: speakerState.useSystemDefault,
                        preserveDefaultDevice: true,
                    });
                }
            },
        });

        previousSystemDefaultsRef.current.speaker = speakerState.systemDefault?.deviceId ?? null;
    });

    const debouncedMicrophoneListChange = useMemo(
        () => debounce(handleMicrophoneListChange, DEVICE_CHANGE_DEBOUNCE_MS, { leading: false, trailing: true }),
        [handleMicrophoneListChange]
    );

    const debouncedCameraListChange = useMemo(
        () => debounce(handleCameraListChange, DEVICE_CHANGE_DEBOUNCE_MS, { leading: false, trailing: true }),
        [handleCameraListChange]
    );

    const debouncedSpeakerListChange = useMemo(
        () => debounce(handleSpeakerListChange, DEVICE_CHANGE_DEBOUNCE_MS, { leading: false, trailing: true }),
        [handleSpeakerListChange]
    );

    // An empty list still runs the pass: losing the last device of a kind is the one case where
    // there is nothing to switch to and the user has to be told
    useEffect(() => {
        debouncedMicrophoneListChange();

        return () => debouncedMicrophoneListChange.cancel();
    }, [filteredMicrophones, microphoneState.systemDefault?.deviceId, debouncedMicrophoneListChange]);

    useEffect(() => {
        debouncedCameraListChange();

        return () => debouncedCameraListChange.cancel();
    }, [filteredCameras, debouncedCameraListChange]);

    useEffect(() => {
        debouncedSpeakerListChange();

        return () => debouncedSpeakerListChange.cancel();
    }, [filteredSpeakers, speakerState.systemDefault?.deviceId, debouncedSpeakerListChange]);

    // Report to sentry when livekit has device errors
    // https://docs.livekit.io/reference/client-sdk-js/enums/RoomEvent.html#mediadeviceserror
    useEffect(() => {
        const handleMediaDevicesError = (error: Error, kind: MediaDeviceKind | undefined) => {
            const failure = MediaDeviceFailure.getFailure(error) ?? 'Unknown';

            reportMeetError(`Livekit MediaDevicesError ${failure}`, {
                context: { error },
                tags: {
                    failure,
                    mediaDeviceKind: kind ?? 'unknown',
                },
            });
        };

        room.on(RoomEvent.MediaDevicesError, handleMediaDevicesError);

        return () => {
            room.off(RoomEvent.MediaDevicesError, handleMediaDevicesError);
        };
    }, [reportMeetError, room]);
};
