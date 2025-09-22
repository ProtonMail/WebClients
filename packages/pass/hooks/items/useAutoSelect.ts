import { useEffect } from 'react';
import { matchPath, useHistory } from 'react-router-dom';

import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { getNewItemRoute } from '@proton/pass/components/Navigation/routing';
import { useSelectItemAction } from '@proton/pass/hooks/useSelectItemAction';
import type { ItemRevision } from '@proton/pass/types';

/** Auto-select first item when none selected. Monitor views use this
 * instead of `ItemsProvider` & `Autoselect` component flow.
 * FIXME: lift monitor items state to provider for unified flow. */
export const useAutoSelect = (items: ItemRevision[]) => {
    const history = useHistory();
    const scope = useItemScope();
    const selectItem = useSelectItemAction();
    const selectedItem = useSelectedItem();

    useEffect(() => {
        const { pathname } = history.location;
        const validRoute = !matchPath(pathname, getNewItemRoute(undefined, scope));

        if (validRoute && items.length > 0 && !selectedItem) {
            const item = items[0];
            selectItem(item, { scope, mode: 'replace' });
        }
    }, [scope, selectedItem, items]);
};
