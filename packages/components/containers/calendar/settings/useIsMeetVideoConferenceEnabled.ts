import { useHasMeetProductAccess } from '@proton/account/organization/useHasMeetProductAccess';
import { useFlag } from '@proton/unleash/useFlag';

/**
 * Whether the user can auto-add Meet links to their calendar invitations
 */
export const useIsMeetVideoConferenceEnabled = () => {
    const hasMeetProductAccess = useHasMeetProductAccess();
    const isNewScheduleOptionEnabled = useFlag('NewScheduleOption');

    return isNewScheduleOptionEnabled && hasMeetProductAccess;
};
