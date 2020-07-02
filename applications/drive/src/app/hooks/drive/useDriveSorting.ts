import { useCache, useMultiSortedList } from 'react-components';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { DEFAULT_SORT_PARAMS } from '../../constants';
import { LinkMeta, SortKeys } from '../../interfaces/link';

const SORT_CACHE_KEY = 'sortParams';
type SortParams = typeof DEFAULT_SORT_PARAMS;

function useDriveSorting(getList: (sortParams: SortParams) => LinkMeta[]) {
    const cache = useCache();
    if (!cache.has(SORT_CACHE_KEY)) {
        cache.set(SORT_CACHE_KEY, DEFAULT_SORT_PARAMS);
    }

    const sortParams: SortParams = cache.get(SORT_CACHE_KEY);
    const { sortedList, setConfigs } = useMultiSortedList(getList(sortParams), [
        {
            key: sortParams.sortField,
            direction: sortParams.sortOrder
        },
        {
            key: 'Name',
            direction: SORT_DIRECTION.ASC
        }
    ]);

    const setSorting = async (sortField: SortKeys, sortOrder: SORT_DIRECTION) => {
        cache.set(SORT_CACHE_KEY, { sortField, sortOrder });
        setConfigs([
            { key: sortField, direction: sortOrder },
            {
                key: 'Name',
                direction: SORT_DIRECTION.ASC
            }
        ]);
    };

    return { sortParams, sortedList, setSorting };
}

export default useDriveSorting;
