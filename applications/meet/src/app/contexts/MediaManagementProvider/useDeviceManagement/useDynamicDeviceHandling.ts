import { useEffect, useMemo, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { ConnectionState, type LocalTrack, MediaDeviceFailure, RoomEvent, Track } from 'livekit-client';
import debounce from 'lodash/debounce';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectActiveAudioOutputId,
    selectActiveCameraId,
    selectActiveMicrophoneId,
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
import { useDeviceNotifications } from './useDeviceNotifications';

const DEVICE_CHANGE_DEBOUNCE_MS = 200;

type DeviceSwitchCause = 'no-active-device' | 'system-default-changed' | 'active-disconnected';

export type DeviceDecision =
    | { type: 'none' }
    | { type: 'switch'; deviceId: string; cause: DeviceSwitchCause }
    | { type: 'preferred-available'; deviceId: string };

export const resolveDeviceDecision = ({
    kind,
    deviceList,
    activeDeviceId,
    preferredDeviceId,
    systemDefaultDevice,
    previousSystemDefaultDeviceId,
}: {
    kind: DeviceKind;
    deviceList: SerializableDeviceInfo[];
    activeDeviceId: string | null;
    preferredDeviceId: string | null;
    systemDefaultDevice: SerializableDeviceInfo | null;
    previousSystemDefaultDeviceId: string | null;
}): DeviceDecision => {
    const isAvailable = (deviceId: string | null) =>
        !!deviceId && deviceList.some((device) => device.deviceId === deviceId);

    const isActiveAvailable = isAvailable(activeDeviceId);
    const wasActiveDisconnected = !!activeDeviceId && !isActiveAvailable && !isDefaultDevice(activeDeviceId);
    const fallbackCause: DeviceSwitchCause = wasActiveDisconnected ? 'active-disconnected' : 'no-active-device';

    const switchTo = (deviceId: string, cause: DeviceSwitchCause): DeviceDecision =>
        deviceId === activeDeviceId ? { type: 'none' } : { type: 'switch', deviceId, cause };

    // The device the user picked is plugged in. If something else is already playing we only tell
    // them it is back, because taking over mid call is more annoying than useful.
    if (isAvailable(preferredDeviceId)) {
        if (preferredDeviceId === activeDeviceId) {
            return { type: 'none' };
        }

        return isActiveAvailable
            ? { type: 'preferred-available', deviceId: preferredDeviceId as string }
            : switchTo(preferredDeviceId as string, fallbackCause);
    }

    // No preference saved means the user wants whatever the OS is using, so we follow it when it moves.
    const followsSystemDefault = !preferredDeviceId;

    if (
        followsSystemDefault &&
        previousSystemDefaultDeviceId &&
        systemDefaultDevice?.deviceId &&
        previousSystemDefaultDeviceId !== systemDefaultDevice.deviceId
    ) {
        return switchTo(systemDefaultDevice.deviceId, 'system-default-changed');
    }

    // From here on it is the recovery path: either nothing was picked yet, or what we were using is gone.
    if (isActiveAvailable || deviceList.length === 0 || isDefaultDevice(activeDeviceId)) {
        return { type: 'none' };
    }

    if (systemDefaultDevice?.deviceId) {
        const target = isAvailable(systemDefaultDevice.deviceId)
            ? systemDefaultDevice.deviceId
            : deviceList[0].deviceId;

        return switchTo(target, fallbackCause);
    }

    // With no resolvable system default, picking the first audio device is a coin flip: on some Linux
    // setups it is an HDMI port with nothing plugged in. Video has no system default at all, so there
    // the first camera is the only option we have.
    return kind === 'videoinput' ? switchTo(deviceList[0].deviceId, fallbackCause) : { type: 'none' };
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
    const { reportMeetError } = useMeetErrorReporting();
    const { notifyPreferredAvailable, notifyActiveDeviceDisconnected } = useDeviceNotifications();

    const filteredMicrophones = useMeetSelector(selectFilteredMicrophones);
    const filteredCameras = useMeetSelector(selectFilteredCameras);
    const filteredSpeakers = useMeetSelector(selectFilteredSpeakers);

    const activeMicrophoneDeviceId = useMeetSelector(selectActiveMicrophoneId);
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);

    const preferredCameraId = useMeetSelector(selectPreferredCameraId);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const speakerState = useMeetSelector(selectSpeakerState);

    // The preferred device stays available until the user acts on it, so we only announce it once
    const announcedPreferredRef = useRef<Record<DeviceKind, string | null>>({
        audioinput: null,
        audiooutput: null,
        videoinput: null,
    });

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
            applySwitch,
        }: {
            kind: DeviceKind;
            decision: DeviceDecision;
            deviceList: SerializableDeviceInfo[];
            applySwitch: (deviceId: string) => void;
        }) => {
            if (decision.type !== 'preferred-available') {
                announcedPreferredRef.current[kind] = null;
            }

            if (decision.type === 'none') {
                return;
            }

            const target = deviceList.find((device) => device.deviceId === decision.deviceId);

            if (decision.type === 'preferred-available') {
                // Before joining, switching is not disruptive, so there is nothing to ask about
                if (room.state !== ConnectionState.Connected) {
                    applySwitch(decision.deviceId);
                    return;
                }

                if (announcedPreferredRef.current[kind] === decision.deviceId) {
                    return;
                }

                announcedPreferredRef.current[kind] = decision.deviceId;

                notifyPreferredAvailable({
                    kind,
                    // Shared by every kind the same piece of hardware exposes, so the notification is grouped
                    groupId: target?.groupId ?? '',
                    deviceLabel: target?.label ?? '',
                    // The notification outlives the device, so the list is checked again on click
                    onSwitch: () => {
                        if (isDeviceStillAvailable(kind, decision.deviceId)) {
                            applySwitch(decision.deviceId);
                        }
                    },
                });
                return;
            }

            if (decision.cause === 'active-disconnected') {
                notifyActiveDeviceDisconnected({ kind, deviceLabel: target?.label ?? '' });
            }

            applySwitch(decision.deviceId);
        }
    );

    const handleMicrophoneListChange = useStableCallback(() => {
        const decision = resolveDeviceDecision({
            kind: 'audioinput',
            deviceList: filteredMicrophones,
            activeDeviceId: activeMicrophoneDeviceId,
            preferredDeviceId: microphoneState.preferredDeviceId,
            systemDefaultDevice: microphoneState.systemDefault,
            previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.microphone,
        });

        applyDecision({
            kind: 'audioinput',
            decision,
            deviceList: filteredMicrophones,
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
            preferredDeviceId: preferredCameraId,
            systemDefaultDevice: null,
            previousSystemDefaultDeviceId: null,
        });

        applyDecision({
            kind: 'videoinput',
            decision,
            deviceList: filteredCameras,
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
            preferredDeviceId: speakerState.preferredDeviceId,
            systemDefaultDevice: speakerState.systemDefault,
            previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.speaker,
        });

        applyDecision({
            kind: 'audiooutput',
            decision,
            deviceList: filteredSpeakers,
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

    useEffect(() => {
        if (!filteredMicrophones.length) {
            return;
        }

        debouncedMicrophoneListChange();

        return () => debouncedMicrophoneListChange.cancel();
    }, [filteredMicrophones, microphoneState.systemDefault?.deviceId, debouncedMicrophoneListChange]);

    useEffect(() => {
        if (!filteredCameras.length) {
            return;
        }

        debouncedCameraListChange();

        return () => debouncedCameraListChange.cancel();
    }, [filteredCameras, debouncedCameraListChange]);

    useEffect(() => {
        if (!filteredSpeakers.length) {
            return;
        }

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
