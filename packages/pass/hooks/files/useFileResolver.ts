import { useCallback, useEffect } from 'react';
import { useStore } from 'react-redux';

import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { hasAttachments } from '@proton/pass/lib/items/item.predicates';
import { filesResolve } from '@proton/pass/store/actions';
import { selectItem, selectOptimisticItemState } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { UniqueItem } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useFileResolver = () => {
    const store = useStore<State>();
    const dispatch = useAsyncRequestDispatch();

    return useCallback(async ({ shareId, itemId }: UniqueItem) => {
        const state = store.getState();
        const item = selectItem(shareId, itemId)(state);
        const { optimistic } = selectOptimisticItemState(shareId, itemId)(state);

        if (item && hasAttachments(item) && !optimistic) {
            const { revision } = item;
            return dispatch(filesResolve, { shareId, itemId, revision });
        }
    }, []);
};

export const useFiles = () => {
    const selectedItem = useSelectedItem();
    const fileResolver = useFileResolver();

    useEffect(() => {
        if (selectedItem) fileResolver(selectedItem).catch(noop);
    }, [selectedItem]);
};
