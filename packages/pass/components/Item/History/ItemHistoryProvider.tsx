import type { PropsWithChildren } from 'react';
import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useItemRevisions } from '@proton/pass/hooks/useItemRevisions';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectItem, selectPassPlan } from '@proton/pass/store/selectors';
import type { MaybeNull, SelectedItem } from '@proton/pass/types';

import { ItemHistoryContext, type ItemHistoryContextValue } from './ItemHistoryContext';

export const ItemHistoryProvider: FC<PropsWithChildren<SelectedItem>> = ({ itemId, shareId, children }) => {
    const { preserveSearch } = useNavigation();
    const { state, loadMore } = useItemRevisions({ shareId, itemId, pageSize: 20 });
    const item = useSelector(selectItem(shareId, itemId));
    const plan = useSelector(selectPassPlan);
    const redirect = !(item && isPaidPlan(plan));

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
