import { c } from 'ttag';

import { UpsellRef } from '../../constants';
import { useMemoSelector } from '../../hooks/useMemoSelector';
import { type FolderLimitReason, selectFolderLimitReason } from '../../store/selectors';
import type { MaybeNull } from '../../types';
import { useUpselling } from '../Upsell/UpsellingProvider';
import { useFolderActions } from './FolderActionsProvider';
import { useFoldersAccess } from './useFoldersAccess';

const getFolderLimitMessage = (reason: FolderLimitReason): string => {
    switch (reason) {
        case 'count':
            return c('Warning').t`You've reached the maximum number of folders for this vault`;
        case 'children':
            return c('Warning').t`You've reached the maximum number of folders at this level`;
        case 'depth':
            return c('Warning').t`You've reached the maximum folder nesting level`;
    }
};

export type FolderCreateControl = {
    /** Feature flag enabled and is not Pass Essentials plan */
    canShow: boolean;
    canUseFolders: boolean;
    limitReached: boolean;
    limitReason: MaybeNull<string>;
    /** Opens the folder create modal for allowed plans, or the upsell modal
     * for free users. Noop when limit is reached. */
    onCreate: () => void;
};

export const useFolderCreate = (
    shareId: MaybeNull<string>,
    parentFolderId: MaybeNull<string> = null
): FolderCreateControl => {
    const { canShowFolderCreation, canUseFolders } = useFoldersAccess();
    const folderActions = useFolderActions();
    const upsell = useUpselling();
    const reason = useMemoSelector(selectFolderLimitReason, [shareId ?? '', parentFolderId]);

    const limitReached = canUseFolders && Boolean(shareId) && reason !== null;

    return {
        canShow: canShowFolderCreation,
        canUseFolders,
        limitReached,
        limitReason: limitReached && reason ? getFolderLimitMessage(reason) : null,
        onCreate: () => {
            if (!canUseFolders) return upsell({ type: 'pass-plus', upsellRef: UpsellRef.FOLDERS });
            if (!shareId || reason !== null) return;
            folderActions.create(shareId, parentFolderId);
        },
    };
};
