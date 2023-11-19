import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectItemsSearchResult, selectTrashedItemsSearchResults } from '@proton/pass/store/selectors';

import { ItemsFilteringContext } from '../components/Context/Items/ItemsFilteringContext';

export const useItems = () => {
    const filtering = useContext(ItemsFilteringContext);
    const { search, sort, type, shareId } = filtering;

    const matchedAndFilteredItems = useSelector(
        selectItemsSearchResult({
            itemType: type === '*' ? null : type,
            search,
            shareId,
            sort,
        })
    );

    return { filtering, ...matchedAndFilteredItems };
};

export const useTrashItems = () => {
    const filtering = useContext(ItemsFilteringContext);
    const { search } = filtering;

    const matched = useSelector(selectTrashedItemsSearchResults(search));

    return { filtering, ...matched };
};
