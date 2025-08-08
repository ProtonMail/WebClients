import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';

import { useDevicePermissionsContext } from '../../contexts/DevicePermissionsContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useRequestPermission } from '../../hooks/useRequestPermission';
import { PermissionPromptStatus } from '../../types';

import './PermissionRequest.scss';

export const PermissionRequest = () => {
    const { setAudioDeviceId, setVideoDeviceId } = useMeetContext();

    const { permissionPromptStatus, setPermissionPromptStatus } = useUIStateContext();

    const { setDevicePermissions } = useDevicePermissionsContext();

    const requestDevicePermission = useRequestPermission();

    const askForPermission = async (type: 'audio' | 'video') => {
        try {
            const permission = await requestDevicePermission(type === 'video' ? 'camera' : 'microphone');

            if (permission !== 'granted') {
                return;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();

            const firstDevice = devices.find(
                (device) => device.kind === (type === 'video' ? 'videoinput' : 'audioinput')
            );

            if (firstDevice) {
                if (type === 'audio') {
                    setAudioDeviceId(firstDevice.deviceId);
                } else {
                    setVideoDeviceId(firstDevice.deviceId);
                }
            }

            setDevicePermissions({
                [type === 'video' ? 'camera' : 'microphone']: 'granted',
            });

            return true;
        } catch (err: any) {
            setDevicePermissions({
                [type === 'video' ? 'camera' : 'microphone']: 'denied',
            });

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                return false;
            }
            throw err;
        } finally {
            setPermissionPromptStatus(PermissionPromptStatus.CLOSED);
        }
    };

    if (permissionPromptStatus === PermissionPromptStatus.CLOSED) {
        return null;
    }

    const deviceName = permissionPromptStatus === PermissionPromptStatus.CAMERA ? 'camera' : 'microphone';
    const deviceContentType = permissionPromptStatus === PermissionPromptStatus.CAMERA ? 'see' : 'hear';

    return (
        <ModalTwo
            open={true}
            onClose={() => {
                setPermissionPromptStatus(PermissionPromptStatus.CLOSED);
            }}
            rootClassName="permission-request-backdrop"
            className="permission-request-modal"
        >
            <ModalTwoHeader />
            <ModalTwoContent className="flex flex-column justify-center gap-4 text-center ">
                <div className="text-3xl text-semibold my-2">{c('meet_2025 Info')
                    .t`Do you want people to ${deviceContentType} you in the meeting?`}</div>

                <div className="color-weak mb-8">{c('meet_2025 Info')
                    .t`You can still turn off your microphone and camera anytime in the meeting`}</div>

                <Button
                    color="norm"
                    className="request-permission-button w-full rounded-full color-invert px-6 py-4 text-semibold"
                    size="large"
                    onClick={() =>
                        askForPermission(permissionPromptStatus === PermissionPromptStatus.CAMERA ? 'video' : 'audio')
                    }
                >
                    {c('meet_2025 Action').t`Use ${deviceName}`}
                </Button>

                <Button
                    className="do-not-request-permission-button text-bold color-primary w-full rounded-full text-semibold"
                    shape="ghost"
                    onClick={() => setPermissionPromptStatus(PermissionPromptStatus.CLOSED)}
                >
                    {c('meet_2025 Action').t`Continue without ${deviceName}`}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};
