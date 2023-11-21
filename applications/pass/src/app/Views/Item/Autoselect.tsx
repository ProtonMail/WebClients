import { type FC } from 'react';
import { Redirect } from 'react-router-dom';

import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getItemRoute, getLocalPath, maybeTrash, preserveSearch } from '@proton/pass/components/Core/routing';
import { useFilteredItems } from '@proton/pass/hooks/useFilteredItems';

export const Autoselect: FC = () => {
    const { filters, matchTrash } = useNavigation();
    const { filtered } = useFilteredItems({ ...filters, trashed: matchTrash });
    const autoselect = filtered[0];

    const to = autoselect
        ? getItemRoute(autoselect.shareId, autoselect.itemId, matchTrash)
        : getLocalPath(maybeTrash('empty', matchTrash));

    return <Redirect exact to={preserveSearch(to)} />;
};
