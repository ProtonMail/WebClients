import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useCanUpdateBilling } from '@proton/account/userPermissions/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getFitsInDriveSpace } from '@proton/shared/lib/user/storage';

const getDriveFullText = (showAdministratorWording: boolean) => {
    if (showAdministratorWording) {
        return c('Error')
            .t`Not enough ${DRIVE_SHORT_APP_NAME} storage to save this attachment. Free up space in ${DRIVE_SHORT_APP_NAME} or contact your administrator to get more storage.`;
    }
    return c('Error')
        .t`Not enough ${DRIVE_SHORT_APP_NAME} storage to save this attachment. Free up space in ${DRIVE_SHORT_APP_NAME} and try again.`;
};

/**
 * Checks that an attachment fits in the user's free Drive storage before saving it there, and shows the
 * "not enough Drive storage" error when it doesn't. `showDriveFullError` shows the same error on its own,
 * for when Drive itself refuses the save.
 */
export const useDriveRoomCheck = () => {
    const [user] = useUser();
    const [canUpdateBilling, loadingCanUpdateBilling] = useCanUpdateBilling();
    const { createNotification } = useNotifications();

    // While permissions load, the plain wording avoids telling an account owner to ask an administrator
    const showAdministratorWording = !canUpdateBilling && !loadingCanUpdateBilling;

    const showDriveFullError = () => {
        createNotification({ text: getDriveFullText(showAdministratorWording), type: 'error' });
    };

    const checkDriveRoom = (size: number) => {
        if (getFitsInDriveSpace(user, size)) {
            return true;
        }
        showDriveFullError();
        return false;
    };

    return { checkDriveRoom, showDriveFullError };
};
