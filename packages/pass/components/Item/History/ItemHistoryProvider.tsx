import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useItemRevisions } from '@proton/pass/hooks/useItemRevisions';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectItem, selectPassPlan } from '@proton/pass/store/selectors';
import type { ItemRevision, MaybeNull, SelectedItem } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

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
    const item = useSelector(selectItem(shareId, itemId));

    const historyEnabled = useFeatureFlag(PassFeature.PassItemHistoryV1);
    const plan = useSelector(selectPassPlan);
    const redirect = !(item && historyEnabled && isPaidPlan(plan));

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

    return redirect ? (
        <Redirect to={preserveSearch(getLocalPath())} push={false} />
    ) : (
        <ItemHistoryContext.Provider value={value}>{children}</ItemHistoryContext.Provider>
    );
};

export const useItemHistory = () => {
    const itemHistory = useContext(ItemHistoryContext);
    if (!itemHistory) throw new Error('Item history context not initialized');
    return itemHistory;
};
