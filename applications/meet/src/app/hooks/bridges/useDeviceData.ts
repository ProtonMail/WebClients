import { useEffect, useRef } from 'react';

import { useMediaDeviceSelect } from '@livekit/components-react';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setActiveDevice, setDeviceList } from '@proton/meet/store/slices/deviceManagementSlice';
import { toSerializableDevice } from '@proton/meet/utils/deviceUtils';

import { useDevices } from '../../contexts/MediaManagementProvider/useDevices';

// Using fingerprint to detect changes from default device which Id is always 'default'
const getDeviceListFingerprint = (devices: MediaDeviceInfo[]) =>
    devices.map((d) => `${d.deviceId}:${d.groupId}`).join(',');

/**
 * Bridges LiveKit device hooks to the Redux store.
 *
 * Subscribes to device lists from useDevices (LiveKit, with requestPermissions=false)
 * and active device IDs from useMediaDeviceSelect, dispatching updates to the
 * deviceManagement slice.
 *
 * Permission observation is handled by useDevicePermissionChangeListener
 * (called from MediaManagementProvider), not here.
 */
export const useDeviceData = () => {
    const dispatch = useMeetDispatch();

    const { microphones, cameras, speakers } = useDevices();

    const { activeDeviceId: activeMicrophoneDeviceId } = useMediaDeviceSelect({
        kind: 'audioinput',
        requestPermissions: false,
    });

    const { activeDeviceId: activeAudioOutputDeviceId } = useMediaDeviceSelect({
        kind: 'audiooutput',
        requestPermissions: false,
    });

    const { activeDeviceId: activeCameraDeviceId } = useMediaDeviceSelect({
        kind: 'videoinput',
        requestPermissions: false,
    });

    const prevCameraFingerprintRef = useRef('');
    const prevMicrophoneFingerprintRef = useRef('');
    const prevSpeakerFingerprintRef = useRef('');

    useEffect(() => {
        const fingerprint = getDeviceListFingerprint(cameras);
        if (fingerprint !== prevCameraFingerprintRef.current) {
            prevCameraFingerprintRef.current = fingerprint;
            dispatch(setDeviceList({ kind: 'videoinput', devices: cameras.map(toSerializableDevice) }));
        }
    }, [cameras, dispatch]);

    useEffect(() => {
        const fingerprint = getDeviceListFingerprint(microphones);
        if (fingerprint !== prevMicrophoneFingerprintRef.current) {
            prevMicrophoneFingerprintRef.current = fingerprint;
            dispatch(setDeviceList({ kind: 'audioinput', devices: microphones.map(toSerializableDevice) }));
        }
    }, [microphones, dispatch]);

    useEffect(() => {
        const fingerprint = getDeviceListFingerprint(speakers);
        if (fingerprint !== prevSpeakerFingerprintRef.current) {
            prevSpeakerFingerprintRef.current = fingerprint;
            dispatch(setDeviceList({ kind: 'audiooutput', devices: speakers.map(toSerializableDevice) }));
        }
    }, [speakers, dispatch]);

    useEffect(() => {
        dispatch(setActiveDevice({ kind: 'audioinput', deviceId: activeMicrophoneDeviceId }));
    }, [activeMicrophoneDeviceId, dispatch]);

    useEffect(() => {
        dispatch(setActiveDevice({ kind: 'audiooutput', deviceId: activeAudioOutputDeviceId }));
    }, [activeAudioOutputDeviceId, dispatch]);

    useEffect(() => {
        dispatch(setActiveDevice({ kind: 'videoinput', deviceId: activeCameraDeviceId }));
    }, [activeCameraDeviceId, dispatch]);
};
