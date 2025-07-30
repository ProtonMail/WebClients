import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getItemRoute, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { isShareVisible } from '@proton/pass/lib/shares/share.predicates';
import { selectShare } from '@proton/pass/store/selectors';

export const Autoselect: FC = () => {
    const scope = useItemScope();
    const { filters } = useNavigationFilters();
    const { preserveSearch } = useNavigationActions();
    const { filtered } = useItems();
    const autoselect = filtered[0];

    /** Check if we should preserve the current filters (selected vault exists)  */
    const selectedVault = useSelector(selectShare(filters.selectedShareId));
    const shareHidden = selectedVault !== undefined && !isShareVisible(selectedVault);
    const clearFilters = filters.selectedShareId !== null && selectedVault === undefined;

    const to = (() => {
        if (shareHidden) return getLocalPath();
        if (autoselect) return preserveSearch(getItemRoute(autoselect.shareId, autoselect.itemId, { scope }));
        if (clearFilters) return getLocalPath();
        return null;
    })();

    return to ? <Redirect exact to={to} push={false} /> : null;
};
