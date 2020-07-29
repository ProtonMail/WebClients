import { useCache, useMultiSortedList } from 'react-components';
import { SortConfig } from 'react-components/hooks/useSortedList';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { DEFAULT_SORT_PARAMS, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER } from '../../constants';
import { LinkMeta, SortKeys } from '../../interfaces/link';

type SortParams = typeof DEFAULT_SORT_PARAMS;
const SORT_CACHE_KEY = 'sortParams';
const NAME_SORT = {
    key: 'Name' as SortKeys,
    direction: SORT_DIRECTION.ASC,
    compare: (a: LinkMeta['Name'], b: LinkMeta['Name']) => a.localeCompare(b)
};

function useDriveSorting(getList: (sortParams: SortParams) => LinkMeta[]) {
    const cache = useCache();
    if (!cache.has(SORT_CACHE_KEY)) {
        cache.set(SORT_CACHE_KEY, DEFAULT_SORT_PARAMS);
    }

    const getConfig = (sortField: SortKeys, direction: SORT_DIRECTION) => {
        const configs: {
            [key in SortKeys]: SortConfig<LinkMeta>[];
        } = {
            Type: [{ key: 'Type', direction }, { key: 'MIMEType', direction }, NAME_SORT],
            ModifyTime: [{ key: 'ModifyTime', direction }, NAME_SORT],
            Size: [{ key: 'Type', direction }, { key: 'Size', direction }, NAME_SORT]
        };
        return configs[sortField];
    };

    const sortParams: SortParams = cache.get(SORT_CACHE_KEY);
    const { sortedList, setConfigs } = useMultiSortedList(
        getList(sortParams),
        getConfig(DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER)
    );

    const setSorting = (sortField: SortKeys, sortOrder: SORT_DIRECTION) => {
        cache.set(SORT_CACHE_KEY, { sortField, sortOrder });
        setConfigs(getConfig(sortField, sortOrder));
    };

    return {
        sortParams,
        sortedList,
        setSorting
    };
}

export default useDriveSorting;
