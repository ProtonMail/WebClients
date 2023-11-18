import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, type RouteChildrenProps } from 'react-router-dom';

import {
    getItemRoute,
    getLocalPath,
    preserveSearch,
    useNavigation,
} from '@proton/pass/components/Core/NavigationProvider';
import { selectItemsSearchResult } from '@proton/pass/store/selectors';

export const Autoselect: FC<RouteChildrenProps> = () => {
    const { filters } = useNavigation();

    const { filtered } = useSelector(
        selectItemsSearchResult({
            itemType: filters.type === '*' ? null : filters.type,
            search: filters.search,
            shareId: filters.selectedShareId,
            sort: filters.sort,
        })
    );

    const autoselect = filtered[0];
    const to = autoselect ? getItemRoute(autoselect.shareId, autoselect.itemId) : getLocalPath('/empty');

    return <Redirect exact to={preserveSearch(to)} />;
};
