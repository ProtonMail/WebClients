import { useFlag } from '@proton/unleash/useFlag';

export const useFlagsDrivePublicSharing = () => {
    const killSwitchEditMode = useFlag('DrivePublicShareEditModeDisabled');
    return { isPublicEditModeEnabled: !killSwitchEditMode };
};
