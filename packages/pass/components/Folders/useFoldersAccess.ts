import { useSelector } from 'react-redux';

import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { selectIsPassB2BPlan, selectUserFolderAllowed } from '../../store/selectors/user';
import { PassFeature } from '../../types/api/features';

export type FoldersAccess = {
    /** Feature flag enabled, and either the plan allows folders or the user can be upsold (non-B2B) */
    canShowFolderCreation: boolean;
    /** True if BE allows this plan to create, rename and place items in folders.
     * Note: viewing and deleting existing folders is allowed on any plan,
     * even if this returns false. */
    canUseFolders: boolean;
};

export const useFoldersAccess = (): FoldersAccess => {
    const foldersEnabled = useFeatureFlag(PassFeature.PassFolder);
    const folderAllowed = Boolean(useSelector(selectUserFolderAllowed));
    const isPassB2BPlan = useSelector(selectIsPassB2BPlan);

    return {
        canShowFolderCreation: foldersEnabled && (folderAllowed || !isPassB2BPlan),
        canUseFolders: foldersEnabled && folderAllowed,
    };
};
