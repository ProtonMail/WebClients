import { c } from 'ttag';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    PermissionBlockedError,
    dismissPermissionsModal,
    requestPermission,
    showPermissionsModal,
} from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectActiveCameraId,
    selectCameraPermission,
    selectMicrophonePermission,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { isSafari } from '@proton/shared/lib/helpers/browser';

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
            return c('Title').t`Allow camera and microphone`;
        }
        if (cameraNeeded) {
            return c('Title').t`Allow camera `;
        }
        return c('Title').t`Allow microphone`;
    };

    const message = () => {
        if (cameraNeeded && micNeeded) {
            return c('Info')
                .t`${MEET_APP_NAME} needs access so others can see and hear you during the call. You can turn your camera or microphone off at any time.`;
        }
        if (cameraNeeded) {
            return c('Info')
                .t`${MEET_APP_NAME} needs camera access so others can see you during the call. You can turn it off at any time.`;
        }
        return c('Info')
            .t`${MEET_APP_NAME} needs microphone access so others can hear you during the call. You can turn it off at any time.`;
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
            title={title()}
            message={message()}
            primaryText={c('Action').t`Allow access`}
            onPrimaryAction={handleRequestPermissions}
            secondaryText={secondaryText()}
            onSecondaryAction={handleContinueWithout}
            onClose={handleContinueWithout}
        />
    );
};
