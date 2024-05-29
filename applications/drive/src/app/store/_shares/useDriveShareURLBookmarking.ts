import { useFlag } from '@proton/components/containers';

export const useDriveShareURLBookmarkingFeatureFlag = () => {
    const rollout = useFlag('DriveShareURLBookmarks');
    const killSwitch = useFlag('DriveShareURLBookmarksDisabled');
    return rollout && !killSwitch;
};
