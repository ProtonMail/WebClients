import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import type { ItemFilters } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';

const INITIAL_FILTERS: ItemFilters = { search: '', sort: 'recent', type: '*', selectedShareId: null };

const parseFilters = (search: string): ItemFilters =>
    partialMerge(
        INITIAL_FILTERS,
        (() => {
            try {
                const params = new URLSearchParams(search);
                const filters = params.get('filters');
                if (!filters) return {};
                return JSON.parse(atob(filters));
            } catch {
                return {};
            }
        })()
    );

export const useFilters = () => {
    const history = useHistory();
    const location = useLocation();
    const [filters, setFilters] = useState(() => parseFilters(location.search));

    useEffect(() => history.listen(({ search }) => setFilters(parseFilters(search))), []);

    return useMemo(
        () => ({
            filters,
            setFilters: (update: Partial<ItemFilters>) => {
                const encodedFilter = btoa(JSON.stringify({ ...filters, ...update }));
                const params = new URLSearchParams(location.search);
                params.set('filters', encodedFilter);
                history.replace({ search: `?${params.toString()}` });
            },
        }),
        [filters]
    );
};
