import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectItemsSearchResult } from '@proton/pass/store/selectors';

import { ItemsFilteringContext } from '../components/Context/Items/ItemsFilteringContext';

export const useItems = (options?: { trashed: boolean }) => {
    const filtering = useContext(ItemsFilteringContext);
    const { search, sort, type, shareId } = filtering;

    const matchedAndFilteredItems = useSelector(
        selectItemsSearchResult(
            options?.trashed
                ? { search, trashed: true }
                : {
                      search,
                      shareId,
                      sort,
                      trashed: false,
                      type: type === '*' ? null : type,
                  }
        )
    );

    return { filtering, ...matchedAndFilteredItems };
};
