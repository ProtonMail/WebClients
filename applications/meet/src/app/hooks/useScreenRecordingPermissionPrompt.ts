import { useEffect, useRef } from 'react';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { showPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { selectPermissionsModals } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { isElectronMeet } from '@proton/shared/lib/helpers/desktop';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { SCREEN_RECORDING_PROMPT_DISMISSED_KEY } from '../contexts/MediaManagementProvider/PermissionsModal/ScreenRecordingPermissionModal';

// macOS needs a relaunch after granting screen recording, so we ask before joining rather than mid-meeting.
export const useScreenRecordingPermissionPrompt = () => {
    const dispatch = useMeetDispatch();
    const { permissionsModal } = useMeetSelector(selectPermissionsModals);
    const hasPrompted = useRef(false);

    useEffect(() => {
        const getAccess = window.ipcMeetMessageBroker?.getScreenCaptureAccess;
        if (
            hasPrompted.current ||
            !isElectronMeet ||
            !getAccess ||
            permissionsModal !== PermissionsModalType.NONE ||
            getItem(SCREEN_RECORDING_PROMPT_DISMISSED_KEY)
        ) {
            return;
        }
        hasPrompted.current = true;

        getAccess()
            .then((access) => {
                if (access === 'not-requested') {
                    dispatch(showPermissionsModal({ modal: PermissionsModalType.SCREEN_RECORDING_PERMISSION_MODAL }));
                }
            })
            .catch(() => {});
    }, [dispatch, permissionsModal]);
};
