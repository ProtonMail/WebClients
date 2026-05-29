import { useFlag } from '@proton/unleash/useFlag';

export const useDrivePublicSharingFlags = () => {
    const killSwitchEditMode = useFlag('DrivePublicShareEditModeDisabled');
    return { isPublicEditModeEnabled: !killSwitchEditMode };
};
