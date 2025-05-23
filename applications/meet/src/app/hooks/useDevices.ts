import { useMediaDeviceSelect, useMediaDevices } from '@livekit/components-react';

export const useDevices = () => {
    const cameras = useMediaDevices({ kind: 'videoinput' });
    const microphones = useMediaDevices({ kind: 'audioinput' });
    const speakers = useMediaDevices({ kind: 'audiooutput' });

    const { activeDeviceId: activeAudioInputDeviceId } = useMediaDeviceSelect({
        kind: 'audioinput',
    });
    const { activeDeviceId: activeAudioOutputDeviceId } = useMediaDeviceSelect({
        kind: 'audiooutput',
    });
    const { activeDeviceId: activeVideoDeviceId } = useMediaDeviceSelect({
        kind: 'videoinput',
    });

    return {
        cameras,
        microphones,
        speakers,
        defaultMicrophone:
            microphones.find((mic) => mic.deviceId === activeAudioInputDeviceId) ?? (microphones[0] as MediaDeviceInfo),
        defaultCamera: cameras.find((cam) => cam.deviceId === activeVideoDeviceId) ?? (cameras[0] as MediaDeviceInfo),
        defaultSpeaker:
            speakers.find((speaker) => speaker.deviceId === activeAudioOutputDeviceId) ??
            (speakers[0] as MediaDeviceInfo),
    };
};
