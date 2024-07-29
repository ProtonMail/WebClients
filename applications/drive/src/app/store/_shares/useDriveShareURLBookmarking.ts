import { useFlag } from '@proton/unleash';

export const useDriveShareURLBookmarkingFeatureFlag = () => {
    const rollout = useFlag('DriveShareURLBookmarking');
    const killSwitch = useFlag('DriveShareURLBookmarksDisabled');
    return rollout && !killSwitch;
};
