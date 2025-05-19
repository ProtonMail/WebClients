import { useEffect, useState } from 'react';

export const useDevices = () => {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [defaultMicrophone, setDefaultMicrophone] = useState<MediaDeviceInfo | null>(null);
    const [defaultCamera, setDefaultCamera] = useState<MediaDeviceInfo | null>(null);

    const getDevices = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();

        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        const defaultMicId = audioTrack?.getSettings().deviceId;
        const defaultCamId = videoTrack?.getSettings().deviceId;

        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');

        setCameras(videoInputs);
        setMicrophones(audioInputs);

        setDefaultMicrophone(audioInputs.find((d) => d.deviceId === defaultMicId) || null);
        setDefaultCamera(videoInputs.find((d) => d.deviceId === defaultCamId) || null);

        stream.getTracks().forEach((track) => track.stop());
    };

    useEffect(() => {
        void getDevices();
    }, []);

    return { cameras, microphones, defaultMicrophone, defaultCamera };
};
