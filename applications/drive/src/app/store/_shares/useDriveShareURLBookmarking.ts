import { useFlag } from '@proton/components/containers';

export const useDriveShareURLBookmarkingFeatureFlag = () => {
    const rollout = useFlag('DriveShareURLBookmarking');
    const killSwitch = useFlag('DriveShareURLBookmarksDisabled');
    return rollout && !killSwitch;
};
