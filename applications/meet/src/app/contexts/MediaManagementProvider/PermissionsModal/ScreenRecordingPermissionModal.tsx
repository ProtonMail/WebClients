import { c } from 'ttag';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { dismissPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { setItem } from '@proton/shared/lib/helpers/storage';

import { ConfirmationModal } from '../../../components/ConfirmationModal/ConfirmationModal';

export const SCREEN_RECORDING_PROMPT_DISMISSED_KEY = 'screen_recording_prompt_dismissed';

export const ScreenRecordingPermissionModal = () => {
    const dispatch = useMeetDispatch();

    const handleAllow = () => {
        dispatch(dismissPermissionsModal());
        void window.ipcMeetMessageBroker?.requestScreenCaptureAccess?.();
    };

    const handleNotNow = () => {
        setItem(SCREEN_RECORDING_PROMPT_DISMISSED_KEY, 'true');
        dispatch(dismissPermissionsModal());
    };

    return (
        <ConfirmationModal
            title={c('Title').t`Allow screen recording`}
            message={c('Info')
                .t`${MEET_APP_NAME} needs screen recording access so you can share your screen during the call. After you allow it, macOS will ask you to reopen the app.`}
            primaryText={c('Action').t`Allow access`}
            onPrimaryAction={handleAllow}
            secondaryText={c('Action').t`Not now`}
            onSecondaryAction={handleNotNow}
            onClose={handleNotNow}
        />
    );
};
