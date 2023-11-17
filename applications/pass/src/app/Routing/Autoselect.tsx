import { type FC } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, type RouteChildrenProps } from 'react-router-dom';

import { useFilters } from '@proton/pass/hooks/useFilters';
import { selectItemsSearchResult } from '@proton/pass/store/selectors';

import { getItemRoute } from '../../lib/routing';

export const Autoselect: FC<RouteChildrenProps> = () => {
    const { filters } = useFilters();

    const { filtered } = useSelector(
        selectItemsSearchResult({
            itemType: filters.type === '*' ? null : filters.type,
            search: filters.search,
            shareId: filters.selectedShareId,
            sort: filters.sort,
        })
    );

    const autoselect = filtered[0];

    return <Redirect exact to={autoselect ? getItemRoute(autoselect.shareId, autoselect.itemId) : '/empty'} />;
};
