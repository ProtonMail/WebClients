import { useCallback, useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { ConnectionState, type LocalTrack, Room, RoomEvent, Track } from 'livekit-client';

import type { DeviceState, SwitchActiveDevice } from '../types';
import { supportsSetSinkId } from '../utils/browser';
import { filterDevices, isDefaultDevice } from '../utils/device-utils';

interface UseDynamicDeviceHandlingParams {
    toggleVideo: ({
        isEnabled,
        videoDeviceId,
        forceUpdate,
        preserveCache,
    }: {
        isEnabled?: boolean;
        videoDeviceId?: string;
        forceUpdate?: boolean;
        preserveCache?: boolean;
    }) => Promise<void>;
    toggleAudio: ({
        isEnabled,
        audioDeviceId,
        preserveCache,
    }: {
        isEnabled?: boolean;
        audioDeviceId?: string | null;
        preserveCache?: boolean;
    }) => Promise<void>;
    switchActiveDevice: SwitchActiveDevice;
    activeMicrophoneDeviceId: string;
    activeAudioOutputDeviceId: string;
    activeCameraDeviceId: string;
    cameraState: DeviceState;
    microphoneState: DeviceState;
    speakerState: DeviceState;
    getDefaultDevice: (devices: MediaDeviceInfo[]) => MediaDeviceInfo;
}

export const useDynamicDeviceHandling = ({
    toggleAudio,
    toggleVideo,
    switchActiveDevice,
    activeMicrophoneDeviceId,
    activeAudioOutputDeviceId,
    activeCameraDeviceId,
    cameraState,
    microphoneState,
    speakerState,
    getDefaultDevice,
}: UseDynamicDeviceHandlingParams) => {
    const room = useRoomContext();

    // Track previous system default device IDs to detect OS default device changes
    const previousSystemDefaultsRef = useRef<{
        microphone: string | null;
        camera: string | null;
        speaker: string | null;
    }>({
        microphone: microphoneState.systemDefault?.deviceId ?? null,
        camera: cameraState.systemDefault?.deviceId ?? null,
        speaker: speakerState.systemDefault?.deviceId ?? null,
    });

    const dynamicDeviceUpdate = useCallback(
        ({
            deviceList,
            deviceId,
            preferredDeviceId,
            systemDefaultDevice,
            previousSystemDefaultDeviceId,
            useSystemDefault,
            updateFunction,
        }: {
            deviceList: MediaDeviceInfo[];
            deviceId: string | null;
            preferredDeviceId: string | null;
            systemDefaultDevice: MediaDeviceInfo;
            previousSystemDefaultDeviceId: string | null;
            useSystemDefault: boolean;
            updateFunction: (newDeviceId: string) => void;
        }) => {
            // Handle case where OS default device changed and user is using default option
            if (
                useSystemDefault &&
                previousSystemDefaultDeviceId &&
                systemDefaultDevice?.deviceId &&
                previousSystemDefaultDeviceId !== systemDefaultDevice.deviceId
            ) {
                updateFunction(systemDefaultDevice.deviceId);
                return;
            }

            // Handle case where user plugs back device
            if (preferredDeviceId && deviceList.find((device) => device.deviceId === preferredDeviceId)) {
                updateFunction(preferredDeviceId);
                return;
            }

            const currentDevice = deviceList.find((device) => device.deviceId === deviceId);

            // Handle case where user unplugs device
            if (!currentDevice && deviceList.length > 0 && !isDefaultDevice(deviceId)) {
                if (!systemDefaultDevice?.deviceId) {
                    return;
                }

                if (!deviceList.find((device) => device.deviceId === systemDefaultDevice.deviceId)) {
                    updateFunction(deviceList[0].deviceId);
                    return;
                }
                updateFunction(systemDefaultDevice.deviceId);
                return;
            }
        },
        []
    );

    const handleDeviceChange = useCallback(async () => {
        const getLocalDevicesWithErrorHandling = async (deviceType: 'audioinput' | 'videoinput' | 'audiooutput') => {
            try {
                return await Room.getLocalDevices(deviceType);
            } catch (error) {
                return [];
            }
        };

        // Getting the devices using the static method on Room
        const [microphones, cameras, speakers] = await Promise.all([
            getLocalDevicesWithErrorHandling('audioinput'),
            getLocalDevicesWithErrorHandling('videoinput'),
            getLocalDevicesWithErrorHandling('audiooutput'),
        ]);

        const microphonesAfterDeviceChange = filterDevices(microphones);
        const camerasAfterDeviceChange = filterDevices(cameras);
        const speakersAfterDeviceChange = filterDevices(speakers);

        // Get fresh system default devices from the newly fetched device lists
        const currentMicrophoneSystemDefault = getDefaultDevice(microphones);
        const currentCameraSystemDefault = getDefaultDevice(cameras);
        const currentSpeakerSystemDefault = getDefaultDevice(speakers);

        const deviceConfigs = [
            {
                deviceList: microphonesAfterDeviceChange,
                deviceId: activeMicrophoneDeviceId,
                preferredDeviceId: microphoneState.preferredDevice?.deviceId ?? null,
                systemDefaultDevice: currentMicrophoneSystemDefault,
                previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.microphone,
                useSystemDefault: microphoneState.useSystemDefault,
                updateFunction: (newDeviceId: string) => {
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
            },
            {
                deviceList: camerasAfterDeviceChange,
                deviceId: activeCameraDeviceId,
                preferredDeviceId: cameraState.preferredDevice?.deviceId ?? null,
                systemDefaultDevice: currentCameraSystemDefault,
                previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.camera,
                useSystemDefault: cameraState.useSystemDefault,
                updateFunction: async (newDeviceId: string) => {
                    if (room.state === ConnectionState.Connected) {
                        const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;

                        // In case of unplugging a device, we need this extra cleanup if there was a background blur processor
                        if (cameraTrack?.getProcessor()) {
                            await room.localParticipant.unpublishTrack(cameraTrack as LocalTrack);
                        }

                        void toggleVideo({ videoDeviceId: newDeviceId, forceUpdate: true, preserveCache: true });
                    } else {
                        void switchActiveDevice({
                            deviceType: 'videoinput',
                            deviceId: newDeviceId,
                            isSystemDefaultDevice: cameraState.useSystemDefault,
                            preserveDefaultDevice: true,
                        });
                    }
                },
            },
            {
                deviceList: speakersAfterDeviceChange,
                deviceId: activeAudioOutputDeviceId,
                preferredDeviceId: speakerState.preferredDevice?.deviceId ?? null,
                systemDefaultDevice: currentSpeakerSystemDefault,
                previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.speaker,
                useSystemDefault: speakerState.useSystemDefault,
                updateFunction: (newDeviceId: string) => {
                    if (supportsSetSinkId()) {
                        void switchActiveDevice({
                            deviceType: 'audiooutput',
                            deviceId: newDeviceId,
                            isSystemDefaultDevice: speakerState.useSystemDefault,
                            preserveDefaultDevice: true,
                        });
                    }
                },
            },
        ];

        deviceConfigs.forEach((config) => dynamicDeviceUpdate(config));

        // Update the ref with current system default device IDs for next change detection
        previousSystemDefaultsRef.current = {
            microphone: currentMicrophoneSystemDefault?.deviceId ?? null,
            camera: currentCameraSystemDefault?.deviceId ?? null,
            speaker: currentSpeakerSystemDefault?.deviceId ?? null,
        };
    }, [
        room,
        toggleAudio,
        toggleVideo,
        activeMicrophoneDeviceId,
        activeCameraDeviceId,
        activeAudioOutputDeviceId,
        switchActiveDevice,
        cameraState,
        microphoneState,
        speakerState,
        dynamicDeviceUpdate,
    ]);

    useEffect(() => {
        room.on(RoomEvent.MediaDevicesChanged, handleDeviceChange);

        return () => {
            room.off(RoomEvent.MediaDevicesChanged, handleDeviceChange);
        };
    }, [room, handleDeviceChange]);
};
