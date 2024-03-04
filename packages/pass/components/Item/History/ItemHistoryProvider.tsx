import type { PropsWithChildren} from 'react';
import { type FC, createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useItemRevisions } from '@proton/pass/hooks/useItemRevisions';
import { selectItemByShareIdAndId } from '@proton/pass/store/selectors';
import type { ItemRevision, MaybeNull, SelectedItem } from '@proton/pass/types';

type ItemHistoryContextValue = {
    item: ItemRevision;
    loading: boolean;
    more: boolean;
    revisions: ItemRevision[];
    loadMore: () => void;
};

const ItemHistoryContext = createContext<MaybeNull<ItemHistoryContextValue>>(null);

export const ItemHistoryProvider: FC<PropsWithChildren<SelectedItem>> = ({ itemId, shareId, children }) => {
    const { preserveSearch } = useNavigation();
    const { state, loadMore } = useItemRevisions({ shareId, itemId, pageSize: 20 });
    const item = useSelector(selectItemByShareIdAndId(shareId, itemId));

    const value = useMemo<MaybeNull<ItemHistoryContextValue>>(
        () =>
            item
                ? {
                      item,
                      loading: state.loading,
                      more: state.next !== null && state.revisions.length < item.revision,
                      revisions: state.revisions,
                      loadMore,
                  }
                : null,
        [state, item]
    );

    return item ? (
        <ItemHistoryContext.Provider value={value}>{children}</ItemHistoryContext.Provider>
    ) : (
        <Redirect to={preserveSearch(getLocalPath())} push={false} />
    );
};

export const useItemHistory = () => {
    const itemHistory = useContext(ItemHistoryContext);
    if (!itemHistory) throw new Error('Item history context not initialized');
    return itemHistory;
};
