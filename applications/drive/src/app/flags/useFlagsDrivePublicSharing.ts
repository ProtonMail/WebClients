import { useFlag } from '@proton/unleash';

export const useFlagsDrivePublicSharing = () => {
    const killSwitchEditMode = useFlag('DrivePublicShareEditModeDisabled');
    return { isPublicEditModeEnabled: !killSwitchEditMode };
};
