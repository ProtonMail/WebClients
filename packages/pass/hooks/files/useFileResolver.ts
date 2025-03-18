import { useCallback, useEffect } from 'react';
import { useStore } from 'react-redux';

import { useSelectedItem } from '@proton/pass/components/Navigation/NavigationItem';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { hasAttachments } from '@proton/pass/lib/items/item.predicates';
import { filesResolve } from '@proton/pass/store/actions';
import { selectItem } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { UniqueItem } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

export const useFileResolver = () => {
    const store = useStore<State>();
    const dispatch = useAsyncRequestDispatch();
    const enabled = useFeatureFlag(PassFeature.PassFileAttachments);

    return useCallback(
        async ({ shareId, itemId }: UniqueItem) => {
            if (!enabled) return;
            const item = selectItem(shareId, itemId)(store.getState());

            if (item && hasAttachments(item)) {
                const { revision } = item;
                return dispatch(filesResolve, { shareId, itemId, revision });
            }
        },
        [enabled]
    );
};

export const useFiles = () => {
    const selectedItem = useSelectedItem();
    const fileResolver = useFileResolver();

    useEffect(() => {
        if (selectedItem) fileResolver(selectedItem).catch(noop);
    }, [selectedItem]);
};
