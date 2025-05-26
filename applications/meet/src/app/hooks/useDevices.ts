import { useEffect, useMemo, useState } from 'react';

import { useMediaDeviceSelect } from '@livekit/components-react';

const getDevices = async (kind: MediaDeviceKind) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === kind);
};

export const useDevices = () => {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

    // For default device selection
    const { activeDeviceId: activeAudioInputDeviceId } = useMediaDeviceSelect({
        kind: 'audioinput',
    });
    const { activeDeviceId: activeAudioOutputDeviceId } = useMediaDeviceSelect({
        kind: 'audiooutput',
    });
    const { activeDeviceId: activeVideoDeviceId } = useMediaDeviceSelect({
        kind: 'videoinput',
    });

    const updateAllDevices = async () => {
        setCameras(await getDevices('videoinput'));
        setMicrophones(await getDevices('audioinput'));
        setSpeakers(await getDevices('audiooutput'));
    };

    useEffect(() => {
        void updateAllDevices();
    }, []);

    useEffect(() => {
        let cameraPerm: PermissionStatus | null = null;
        let micPerm: PermissionStatus | null = null;

        navigator.mediaDevices.addEventListener('devicechange', updateAllDevices);

        async function setupPermissions() {
            if (navigator.permissions) {
                try {
                    cameraPerm = await navigator.permissions.query({ name: 'camera' as PermissionName });
                    micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    cameraPerm.onchange = updateAllDevices;
                    micPerm.onchange = updateAllDevices;
                } catch (e) {
                    console.error(e);
                }
            }
        }

        void setupPermissions();

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', updateAllDevices);
            if (cameraPerm) {
                cameraPerm.onchange = null;
            }
            if (micPerm) {
                micPerm.onchange = null;
            }
        };
    }, []);

    const defaultMicrophone = useMemo(
        () =>
            microphones.find((mic) => mic.deviceId === activeAudioInputDeviceId) ?? (microphones[0] as MediaDeviceInfo),
        [microphones, activeAudioInputDeviceId]
    );
    const defaultCamera = useMemo(
        () => cameras.find((cam) => cam.deviceId === activeVideoDeviceId) ?? (cameras[0] as MediaDeviceInfo),
        [cameras, activeVideoDeviceId]
    );
    const defaultSpeaker = useMemo(
        () =>
            speakers.find((speaker) => speaker.deviceId === activeAudioOutputDeviceId) ??
            (speakers[0] as MediaDeviceInfo),
        [speakers, activeAudioOutputDeviceId]
    );

    return {
        cameras,
        microphones,
        speakers,
        defaultMicrophone,
        defaultCamera,
        defaultSpeaker,
    };
};
