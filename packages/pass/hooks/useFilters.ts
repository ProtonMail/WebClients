import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import type { ItemSortFilter, ItemTypeFilter } from '@proton/pass/types';

export type PassFilters = {
    search?: string;
    selectedShareId?: string;
    sort?: ItemSortFilter;
    type?: ItemTypeFilter;
};

const parseFilters = (search: string): PassFilters => {
    try {
        const params = new URLSearchParams(search);
        const filters = params.get('filters');

        /* probably needs validation here */
        if (!filters) return {};
        return JSON.parse(atob(filters));
    } catch {
        return {};
    }
};

export const useFilters = () => {
    const history = useHistory();
    const location = useLocation();
    const [filters, setFilters] = useState(() => parseFilters(location.search));

    useEffect(() => history.listen(({ search }) => setFilters(parseFilters(search))), [history, location.search]);

    return useMemo(
        () => ({
            filters,
            setFilters: (update: Partial<PassFilters>) => {
                const encodedFilter = btoa(JSON.stringify({ ...filters, ...update }));
                const params = new URLSearchParams(location.search);
                params.set('filters', encodedFilter);
                history.push({ search: `?${params.toString()}` });
            },
        }),
        [filters]
    );
};
