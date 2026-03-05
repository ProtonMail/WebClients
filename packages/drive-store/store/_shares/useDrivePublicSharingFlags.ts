import { useFlag } from '@proton/unleash/useFlag';

export const useDrivePublicSharingFlags = () => {
    const rolloutEditMode = useFlag('DrivePublicShareEditMode');
    const killSwitchEditMode = useFlag('DrivePublicShareEditModeDisabled');
    return { isPublicEditModeEnabled: rolloutEditMode && !killSwitchEditMode };
};
