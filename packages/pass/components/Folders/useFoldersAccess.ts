import { useSelector } from 'react-redux';

import { PLANS } from '@proton/payments/core/constants';

import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { useMatchUser } from '../../hooks/useMatchUser';
import { selectUserFolderAllowed } from '../../store/selectors';
import { PassFeature } from '../../types/api/features';

export type FoldersAccess = {
    /** Feature flag enabled and is not Pass Essentials plan */
    canShowFolderCreation: boolean;
    /** True if BE allows this plan to create, rename and place items in folders.
     * Note: viewing and deleting existing folders is allowed on any plan,
     * even if this returns false. */
    canUseFolders: boolean;
};

export const useFoldersAccess = (): FoldersAccess => {
    const foldersEnabled = useFeatureFlag(PassFeature.PassFolder);
    const folderAllowed = Boolean(useSelector(selectUserFolderAllowed));
    const isPassEssentials = useMatchUser({ planInternalName: [PLANS.PASS_PRO] });

    return {
        canShowFolderCreation: foldersEnabled && !isPassEssentials,
        canUseFolders: foldersEnabled && folderAllowed,
    };
};
