import { type FC17 } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getItemRoute, getLocalPath } from '@proton/pass/components/Navigation/routing';
import { selectShare } from '@proton/pass/store/selectors';

export const Autoselect: FC17 = () => {
    const { matchTrash, preserveSearch, filters } = useNavigation();
    const { filtered } = useItems();
    const autoselect = filtered[0];

    /** Check if we should preserve the current filters (selected vault exists)  */
    const selectedVault = useSelector(selectShare(filters.selectedShareId));
    const clearFilters = filters.selectedShareId !== null && selectedVault === undefined;

    const to = (() => {
        if (autoselect) return preserveSearch(getItemRoute(autoselect.shareId, autoselect.itemId, matchTrash));
        if (clearFilters) return getLocalPath();
        return null;
    })();

    return to ? <Redirect exact to={to} push={false} /> : null;
};
