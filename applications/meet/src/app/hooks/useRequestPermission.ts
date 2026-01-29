import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { isAudioSessionAvailable, setAudioSessionType } from '../utils/ios-audio-session';

export const useRequestPermission = () => {
    const notifications = useNotifications();

    const reportError = useMeetErrorReporting();

    const requestDevicePermission = async (deviceType: 'camera' | 'microphone', deviceId?: string) => {
        let deviceState = 'prompt';
        try {
            deviceState = (await navigator.permissions.query({ name: deviceType }))?.state;
        } catch (err) {
            reportError(`Failed to query permission for ${deviceType}`, {
                level: 'error',
                context: {
                    deviceType,
                    error: err,
                },
            });
        }

        if (deviceState !== 'granted') {
            try {
                let stream: MediaStream;

                if (deviceType === 'microphone') {
                    setAudioSessionType('auto');
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: isAudioSessionAvailable() || !deviceId ? true : { deviceId },
                    });
                    setAudioSessionType('play-and-record');
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: deviceId ? { deviceId } : true,
                    });
                }

                stream.getTracks().forEach((track) => track.stop());

                return 'granted';
            } catch (err) {
                if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
                    return 'denied';
                }

                const notificationText =
                    deviceType === 'camera'
                        ? c('Error')
                              .t`Failed to request permission for the camera. Please check your system permissions and try again. You might have to enable permissions manually, please refresh the page afterwards`
                        : c('Error')
                              .t`Failed to request permission for the microphone. Please check your system permissions and try again. You might have to enable permissions manually, please refresh the page afterwards`;

                notifications.createNotification({
                    type: 'error',
                    text: notificationText,
                    expiration: 10000,
                });

                return 'prompt';
            }
        }

        return 'granted';
    };

    return requestDevicePermission;
};
