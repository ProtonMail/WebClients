import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { isShareVisible } from '../../lib/shares/share.predicates';
import { selectFolder, selectShare } from '../../store/selectors';
import { useItems } from '../Item/Context/ItemsProvider';
import { useNavigationActions } from './NavigationActions';
import { useNavigationFilters } from './NavigationFilters';
import { useItemScope } from './NavigationMatches';
import { getItemRoute, getLocalPath } from './routing';

export const Autoselect: FC = () => {
    const scope = useItemScope();
    const { filters } = useNavigationFilters();
    const { preserveSearch } = useNavigationActions();
    const { filtered } = useItems();
    const autoselect = filtered[0];
    const { selectedShareId, selectedFolderId } = filters;

    /** Check if we should preserve the current filters (selected vault exists)  */
    const selectedVault = useSelector(selectShare(selectedShareId));
    const selectedFolder = useSelector(selectFolder(selectedShareId, selectedFolderId));
    const shareHidden = selectedVault !== undefined && !isShareVisible(selectedVault);
    const clearFilters = selectedShareId !== null && selectedVault === undefined;

    const to = (() => {
        if (shareHidden) return getLocalPath();

        /** The selected folder was deleted, either locally or through a remote
         * user event. Navigate back to its vault instead. */
        if (selectedVault && selectedFolderId && selectedFolder === undefined) {
            return preserveSearch(getLocalPath(`share/${selectedVault.shareId}`), { selectedFolderId: null });
        }

        if (autoselect) return preserveSearch(getItemRoute(autoselect.shareId, autoselect.itemId, { scope }));
        if (clearFilters) return getLocalPath();
        return null;
    })();

    return to ? <Redirect exact to={to} push={false} /> : null;
};
