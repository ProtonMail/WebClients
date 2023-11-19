import { type FC } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';

import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import {
    getItemRoute,
    getLocalPath,
    getTrashRoute,
    maybeTrash,
    preserveSearch,
} from '@proton/pass/components/Core/routing';
import { useFilteredItems } from '@proton/pass/hooks/useFilteredItems';

export const Autoselect: FC = () => {
    const inTrash = useRouteMatch(getTrashRoute()) !== null;
    const { filters } = useNavigation();
    const { filtered } = useFilteredItems({ ...filters, trashed: inTrash });
    const autoselect = filtered[0];

    const to = autoselect
        ? getItemRoute(autoselect.shareId, autoselect.itemId, inTrash)
        : getLocalPath(maybeTrash('empty', inTrash));

    return <Redirect exact to={preserveSearch(to)} />;
};
