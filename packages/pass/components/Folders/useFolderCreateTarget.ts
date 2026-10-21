import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isWritableVault } from '../../lib/vaults/vault.predicates';
import { selectShare } from '../../store/selectors/shares';
import { selectDefaultVault } from '../../store/selectors/vaults';
import type { MaybeNull } from '../../types/utils';
import { useNavigationFilters } from '../Navigation/NavigationFilters';

export type FolderCreateTarget = { shareId: string; parentFolderId: MaybeNull<string> };

/** Resolves a folder-creation target from the current navigation filters.
 * Uses the selected vault + folder when that vault is writable,
 * otherwise falls back to the default vault at its root. Returns `null`
 * when no writable vault exists (in which case folder creation should be disabled). */
export const useFolderCreateTarget = (): MaybeNull<FolderCreateTarget> => {
    const { filters } = useNavigationFilters();
    const { selectedShareId, selectedFolderId } = filters;

    const selectedShare = useSelector(selectShare(selectedShareId));
    const defaultVault = useSelector(selectDefaultVault);

    return useMemo(() => {
        if (selectedShareId && selectedShare && isWritableVault(selectedShare)) {
            return { shareId: selectedShareId, parentFolderId: selectedFolderId };
        }
        if (defaultVault) return { shareId: defaultVault.shareId, parentFolderId: null };
        return null;
    }, [selectedShareId, selectedFolderId, selectedShare, defaultVault]);
};
