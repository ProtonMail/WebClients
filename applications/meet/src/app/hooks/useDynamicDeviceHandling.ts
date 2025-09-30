import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { ConnectionState, Room, RoomEvent } from '@proton-meet/livekit-client';

import { DEFAULT_DEVICE_ID } from '../constants';
import type { SwitchActiveDevice } from '../types';
import { supportsSetSinkId } from '../utils/browser';
import { filterDevices } from '../utils/filterDevices';

interface UseDynamicDeviceHandlingParams {
    toggleVideo: ({
        isEnabled,
        videoDeviceId,
        forceUpdate,
    }: {
        isEnabled?: boolean;
        videoDeviceId?: string;
        forceUpdate?: boolean;
    }) => Promise<void>;
    toggleAudio: ({
        isEnabled,
        audioDeviceId,
    }: {
        isEnabled?: boolean;
        audioDeviceId?: string | null;
    }) => Promise<void>;
    switchActiveDevice: SwitchActiveDevice;
    activeMicrophoneDeviceId: string;
    activeAudioOutputDeviceId: string;
    activeCameraDeviceId: string;
}

export const useDynamicDeviceHandling = ({
    toggleAudio,
    toggleVideo,
    switchActiveDevice,
    activeMicrophoneDeviceId,
    activeAudioOutputDeviceId,
    activeCameraDeviceId,
}: UseDynamicDeviceHandlingParams) => {
    const room = useRoomContext();

    const dynamicDeviceUpdate = useCallback(
        ({
            deviceList,
            deviceId,
            updateFunction,
        }: {
            deviceList: MediaDeviceInfo[];
            deviceId: string | null;
            updateFunction: (newDeviceId: string) => void;
        }) => {
            const currentDevice = deviceList.find((device) => device.deviceId === deviceId);

            if (!currentDevice && deviceList.length > 0 && deviceId !== DEFAULT_DEVICE_ID) {
                updateFunction(deviceList[0].deviceId);
                return;
            }
        },
        []
    );

    const handleDeviceChange = useCallback(async () => {
        // Getting the devices using the static method on Room
        const [microphones, cameras, speakers] = await Promise.all([
            Room.getLocalDevices('audioinput'),
            Room.getLocalDevices('videoinput'),
            Room.getLocalDevices('audiooutput'),
        ]);

        const microphonesAfterDeviceChange = filterDevices(microphones);
        const camerasAfterDeviceChange = filterDevices(cameras);
        const speakersAfterDeviceChange = filterDevices(speakers);

        dynamicDeviceUpdate({
            deviceList: microphonesAfterDeviceChange,
            deviceId: activeMicrophoneDeviceId,
            updateFunction: (newDeviceId: string) => {
                if (room.state === ConnectionState.Connected) {
                    void toggleAudio({ audioDeviceId: newDeviceId });
                } else {
                    void switchActiveDevice('audioinput', newDeviceId);
                }
            },
        });
        dynamicDeviceUpdate({
            deviceList: camerasAfterDeviceChange,
            deviceId: activeCameraDeviceId,
            updateFunction: (newDeviceId: string) => {
                if (room.state === ConnectionState.Connected) {
                    void toggleVideo({ videoDeviceId: newDeviceId, forceUpdate: true });
                } else {
                    void switchActiveDevice('videoinput', newDeviceId);
                }
            },
        });
        dynamicDeviceUpdate({
            deviceList: speakersAfterDeviceChange,
            deviceId: activeAudioOutputDeviceId,
            updateFunction: (newDeviceId: string) => {
                if (supportsSetSinkId()) {
                    void switchActiveDevice('audiooutput', newDeviceId);
                }
            },
        });
    }, [
        room,
        toggleAudio,
        toggleVideo,
        activeMicrophoneDeviceId,
        activeCameraDeviceId,
        activeAudioOutputDeviceId,
        switchActiveDevice,
    ]);

    useEffect(() => {
        room.on(RoomEvent.MediaDevicesChanged, handleDeviceChange);

        return () => {
            room.off(RoomEvent.MediaDevicesChanged, handleDeviceChange);
        };
    }, [room, handleDeviceChange]);
};
