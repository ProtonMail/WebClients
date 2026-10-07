import { useEffect, useRef } from 'react';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { showPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { selectPermissionsModals } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { selectIsGuest, selectUserId } from '@proton/meet/store/slices/userSlice';
import { isElectronMeet } from '@proton/shared/lib/helpers/desktop';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { getScreenRecordingPromptDismissedKey } from '../utils/storage';

// macOS needs a relaunch after granting screen recording, so we ask before joining rather than mid-meeting.
export const useScreenRecordingPermissionPrompt = () => {
    const dispatch = useMeetDispatch();
    const { permissionsModal } = useMeetSelector(selectPermissionsModals);
    const isGuest = useMeetSelector(selectIsGuest);
    const userId = useMeetSelector(selectUserId);
    const hasPrompted = useRef(false);

    useEffect(() => {
        const getAccess = window.ipcMeetMessageBroker?.getScreenCaptureAccess;
        if (
            hasPrompted.current ||
            !isElectronMeet ||
            !getAccess ||
            permissionsModal !== PermissionsModalType.NONE ||
            getItem(getScreenRecordingPromptDismissedKey(isGuest, userId))
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
    }, [dispatch, permissionsModal, isGuest, userId]);
};
