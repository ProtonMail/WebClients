import { useCallback, useEffect } from 'react';
import { useStore } from 'react-redux';

import noop from '@proton/utils/noop';

import { useSelectedItem } from '../../components/Navigation/NavigationItem';
import { hasAttachments } from '../../lib/items/item.predicates';
import { filesResolve } from '../../store/actions';
import { selectItem, selectOptimisticItemState } from '../../store/selectors';
import type { State } from '../../store/types';
import type { UniqueItem } from '../../types';
import { useAsyncRequestDispatch } from '../useDispatchAsyncRequest';

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
