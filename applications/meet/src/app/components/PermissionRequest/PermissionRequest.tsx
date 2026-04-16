import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { requestPermission, selectActiveCameraId } from '@proton/meet/store/slices/deviceManagementSlice';
import {
    PermissionPromptStatus,
    selectPermissionPromptStatus,
    setPermissionPromptStatus,
} from '@proton/meet/store/slices/uiStateSlice';
import { isSafari } from '@proton/shared/lib/helpers/browser';

import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';

import './PermissionRequest.scss';

export const PermissionRequest = () => {
    const dispatch = useMeetDispatch();
    const permissionPromptStatus = useMeetSelector(selectPermissionPromptStatus);
    const activeCameraId = useMeetSelector(selectActiveCameraId);

    const { toggleVideo, toggleAudio } = useMediaManagementContext();

    const askForPermission = async (deviceType: 'audio' | 'video') => {
        try {
            const permissionType = deviceType === 'video' ? 'camera' : 'microphone';
            const cameraDeviceId = isSafari() ? activeCameraId : undefined;
            const permission = await dispatch(
                requestPermission(permissionType, permissionType === 'camera' ? cameraDeviceId : undefined)
            );

            if (permission !== 'granted') {
                return;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();

            const firstDevice = devices.find(
                (device) => device.kind === (deviceType === 'video' ? 'videoinput' : 'audioinput')
            );

            if (firstDevice) {
                if (deviceType === 'audio') {
                    await toggleAudio({ audioDeviceId: firstDevice.deviceId });
                } else {
                    await toggleVideo({ videoDeviceId: firstDevice.deviceId });
                }
                // In Firefox, enumerateDevices() only returns labels when there is an
                // active stream. The synthetic devicechange fired by the permission
                // onchange handler fires before the stream is ready, so the device
                // list ends up empty. Re-dispatching after the toggle ensures that
                // LiveKit's observer re-enumerates while the stream is active.
                navigator.mediaDevices?.dispatchEvent?.(new Event('devicechange'));
            }

            return true;
        } catch (err: any) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                return false;
            }
            throw err;
        } finally {
            dispatch(setPermissionPromptStatus(PermissionPromptStatus.CLOSED));
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
                dispatch(setPermissionPromptStatus(PermissionPromptStatus.CLOSED));
            }}
            rootClassName="permission-request-backdrop"
            className="permission-request-modal border border-norm"
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
                    onClick={() => dispatch(setPermissionPromptStatus(PermissionPromptStatus.CLOSED))}
                >
                    {continueWithoutDeviceAction}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};
