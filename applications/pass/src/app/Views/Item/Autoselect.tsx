import { type FC } from 'react';
import { Redirect } from 'react-router-dom';

import {
    getItemRoute,
    getLocalPath,
    preserveSearch,
    useNavigation,
} from '@proton/pass/components/Core/NavigationProvider';
import { useFilteredItems } from '@proton/pass/hooks/useFilteredItems';

export const Autoselect: FC = () => {
    const { filters } = useNavigation();
    const { filtered } = useFilteredItems(filters);
    const autoselect = filtered[0];
    const to = autoselect ? getItemRoute(autoselect.shareId, autoselect.itemId) : getLocalPath('empty');

    return <Redirect exact to={preserveSearch(to)} />;
};
