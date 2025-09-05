import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

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

    const askForPermission = async (deviceType: 'audio' | 'video') => {
        try {
            const permission = await requestDevicePermission(deviceType === 'video' ? 'camera' : 'microphone');

            if (permission !== 'granted') {
                return;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();

            const firstDevice = devices.find(
                (device) => device.kind === (deviceType === 'video' ? 'videoinput' : 'audioinput')
            );

            if (firstDevice) {
                if (deviceType === 'audio') {
                    setAudioDeviceId(firstDevice.deviceId);
                } else {
                    setVideoDeviceId(firstDevice.deviceId);
                }
            }

            setDevicePermissions({
                [deviceType === 'video' ? 'camera' : 'microphone']: 'granted',
            });

            return true;
        } catch (err: any) {
            setDevicePermissions({
                [deviceType === 'video' ? 'camera' : 'microphone']: 'denied',
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

    const deviceNameAction =
        permissionPromptStatus === PermissionPromptStatus.CAMERA
            ? c('Action').t`Use camera`
            : c('Action').t`Use microphone`;

    const continueWithoutDeviceAction =
        permissionPromptStatus === PermissionPromptStatus.CAMERA
            ? c('Action').t`Continue without camera`
            : c('Action').t`Continue without microphone`;

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
                <div className="text-3xl text-semibold my-2">{c('Info')
                    .t`Do you want people to ${deviceContentType} you in the meeting?`}</div>

                <div className="color-weak mb-8">{c('Info')
                    .t`You can still turn off your microphone and camera anytime in the meeting`}</div>

                <Button
                    color="norm"
                    className="request-permission-button w-full rounded-full color-invert px-6 py-4 text-semibold"
                    size="large"
                    onClick={() =>
                        askForPermission(permissionPromptStatus === PermissionPromptStatus.CAMERA ? 'video' : 'audio')
                    }
                >
                    {deviceNameAction}
                </Button>

                <Button
                    className="do-not-request-permission-button text-bold color-primary w-full rounded-full text-semibold"
                    shape="ghost"
                    onClick={() => setPermissionPromptStatus(PermissionPromptStatus.CLOSED)}
                >
                    {continueWithoutDeviceAction}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};
