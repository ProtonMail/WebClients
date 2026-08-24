import { useEffect } from 'react';
import { matchPath, useHistory } from 'react-router-dom';

import { useSelectedItem } from '../../components/Navigation/NavigationItem';
import { useItemScope } from '../../components/Navigation/NavigationMatches';
import { getNewItemRoute } from '../../components/Navigation/routing';
import type { ItemRevision, Maybe } from '../../types';
import { useSelectItemAction } from '../useSelectItemAction';

/** Auto-select first item when none selected. Monitor views use this
 * instead of `ItemsProvider` & `Autoselect` component flow.
 * FIXME: lift monitor items state to provider for unified flow. */
export const useAutoSelect = (item: Maybe<ItemRevision>) => {
    const history = useHistory();
    const scope = useItemScope();
    const selectItem = useSelectItemAction();
    const selectedItem = useSelectedItem();

    useEffect(() => {
        const { pathname } = history.location;
        const validRoute = !matchPath(pathname, getNewItemRoute(undefined, scope));
        if (validRoute && item && !selectedItem) selectItem(item, { scope, mode: 'replace' });
    }, [scope, selectedItem, item]);
};
