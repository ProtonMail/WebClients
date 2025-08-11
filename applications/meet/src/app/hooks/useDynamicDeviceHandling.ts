import { useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { DEFAULT_DEVICE_ID } from '../constants';
import { useMeetContext } from '../contexts/MeetContext';
import { useAudioToggle } from './useAudioToggle';
import { useDevices } from './useDevices';
import { useVideoToggle } from './useVideoToggle';

export const useDynamicDeviceHandling = () => {
    const { audioDeviceId, videoDeviceId, audioOutputDeviceId, isAudioEnabled, isVideoEnabled, isFaceTrackingEnabled } =
        useMeetContext();
    const { microphones, cameras, speakers } = useDevices();
    const toggleAudio = useAudioToggle();
    const toggleVideo = useVideoToggle();
    const room = useRoomContext();

    const currentDevices = useRef({
        audioLabel: '',
        videoLabel: '',
        speakerLabel: '',
    });

    useEffect(() => {
        const handleDeviceChange = async () => {
            const updateDevice = ({
                deviceList,
                deviceId,
                currentLabel,
                updateFunction,
            }: {
                deviceList: MediaDeviceInfo[];
                deviceId: string | null;
                currentLabel?: string;
                updateFunction: (newLabel: string) => void;
            }) => {
                const currentDevice = deviceList.find((device) => device.deviceId === deviceId);

                if (
                    deviceId === DEFAULT_DEVICE_ID ||
                    deviceId === null ||
                    !deviceList.find((device) => device.deviceId === deviceId) ||
                    currentDevice?.label !== currentLabel
                ) {
                    updateFunction(currentDevice?.label || '');
                }
            };

            updateDevice({
                deviceList: microphones,
                deviceId: audioDeviceId,
                currentLabel: currentDevices.current.audioLabel,
                updateFunction: (newLabel: string) => {
                    currentDevices.current.audioLabel = newLabel;

                    void toggleAudio({ isEnabled: isAudioEnabled, audioDeviceId: DEFAULT_DEVICE_ID });
                },
            });

            updateDevice({
                deviceList: cameras,
                deviceId: videoDeviceId,
                currentLabel: currentDevices.current.videoLabel,
                updateFunction: (newLabel: string) => {
                    currentDevices.current.videoLabel = newLabel;

                    void toggleVideo({
                        isEnabled: isVideoEnabled,
                        videoDeviceId: DEFAULT_DEVICE_ID,
                        isFaceTrackingEnabled,
                    });
                },
            });

            updateDevice({
                deviceList: speakers,
                deviceId: audioOutputDeviceId,
                currentLabel: currentDevices.current.speakerLabel,
                updateFunction: (newLabel: string) => {
                    currentDevices.current.speakerLabel = newLabel;

                    void room.switchActiveDevice('audiooutput', DEFAULT_DEVICE_ID);
                },
            });
        };

        const defaultMic = microphones.find((m) => m.deviceId === DEFAULT_DEVICE_ID);
        const defaultCamera = cameras.find((c) => c.deviceId === DEFAULT_DEVICE_ID);
        const defaultSpeaker = speakers.find((s) => s.deviceId === DEFAULT_DEVICE_ID);

        currentDevices.current = {
            audioLabel: defaultMic?.label || '',
            videoLabel: defaultCamera?.label || '',
            speakerLabel: defaultSpeaker?.label || '',
        };

        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        return () => navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    }, [
        audioDeviceId,
        videoDeviceId,
        audioOutputDeviceId,
        isAudioEnabled,
        isVideoEnabled,
        isFaceTrackingEnabled,
        microphones,
        cameras,
        speakers,
    ]);
};
