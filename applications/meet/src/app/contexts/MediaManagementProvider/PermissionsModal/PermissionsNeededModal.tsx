import { c } from 'ttag';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    PermissionBlockedError,
    PermissionsModalType,
    dismissPermissionsModal,
    requestPermission,
    selectActiveCameraId,
    selectCameraPermission,
    selectMicrophonePermission,
    showPermissionsModal,
} from '@proton/meet/store/slices/deviceManagementSlice';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import warningIcon from '@proton/styles/assets/img/meet/warning-icon.svg';

import { ConfirmationModal } from '../../../components/ConfirmationModal/ConfirmationModal';

export const PermissionsNeededModal = () => {
    const dispatch = useMeetDispatch();
    const cameraPermission = useMeetSelector(selectCameraPermission);
    const microphonePermission = useMeetSelector(selectMicrophonePermission);
    const activeCameraId = useMeetSelector(selectActiveCameraId);

    const cameraNeeded = cameraPermission !== 'granted';
    const micNeeded = microphonePermission !== 'granted';

    const handleContinueWithout = () => {
        dispatch(dismissPermissionsModal());
    };

    const title = () => {
        if (cameraNeeded && micNeeded) {
            return c('Title').t`Camera and microphone access needed`;
        }
        if (cameraNeeded) {
            return c('Title').t`Camera access needed`;
        }
        return c('Title').t`Microphone access needed`;
    };

    const message = () => {
        if (cameraNeeded && micNeeded) {
            return c('Info').t`To speak and be seen in the call, allow access to your camera and microphone.`;
        }
        if (cameraNeeded) {
            return c('Info').t`To be seen in the call, allow access to your camera.`;
        }
        return c('Info').t`To speak in the call, allow access to your microphone.`;
    };

    const secondaryText = () => {
        if (cameraNeeded && micNeeded) {
            return c('Action').t`Continue without mic and camera`;
        }
        if (cameraNeeded) {
            return c('Action').t`Continue without camera`;
        }
        return c('Action').t`Continue without microphone`;
    };

    const handleRequestPermissions = async () => {
        dispatch(dismissPermissionsModal());

        let cameraBlocked = false;
        let microphoneBlocked = false;

        if (cameraNeeded) {
            try {
                await dispatch(requestPermission('camera', isSafari() ? activeCameraId : undefined));
            } catch (error) {
                if (error instanceof PermissionBlockedError) {
                    cameraBlocked = true;
                }
            }
        }

        if (micNeeded) {
            try {
                await dispatch(requestPermission('microphone'));
            } catch (error) {
                if (error instanceof PermissionBlockedError) {
                    microphoneBlocked = true;
                }
            }
        }

        if (cameraBlocked && microphoneBlocked) {
            dispatch(showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_MODAL }));
        } else if (cameraBlocked) {
            dispatch(showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_CAMERA_MODAL }));
        } else if (microphoneBlocked) {
            dispatch(showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_BLOCKED_MICROPHONE_MODAL }));
        }
    };

    return (
        <ConfirmationModal
            icon={
                <img
                    className="mx-auto w-custom h-custom"
                    src={warningIcon}
                    alt=""
                    style={
                        isMobile()
                            ? {
                                  '--w-custom': '3rem',
                                  '--h-custom': '3rem',
                              }
                            : {
                                  '--w-custom': '5rem',
                                  '--h-custom': '5rem',
                              }
                    }
                />
            }
            title={title()}
            message={message()}
            primaryText={c('Action').t`Request permissions`}
            onPrimaryAction={handleRequestPermissions}
            secondaryText={secondaryText()}
            onSecondaryAction={handleContinueWithout}
            onClose={handleContinueWithout}
        />
    );
};
