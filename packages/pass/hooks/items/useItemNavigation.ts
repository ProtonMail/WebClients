import { useMemo } from 'react';

import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import type { UniqueItem } from '@proton/pass/types';

export type ItemNavigationActions = {
    onEdit: () => void;
    onHistory: () => void;
};

type UseItemNavigation = (item: UniqueItem) => ItemNavigationActions;

export const useItemNavigation: UseItemNavigation = ({ shareId, itemId }) => {
    const scope = useItemScope();
    const { selectItem } = useNavigationActions();

    return useMemo(
        () => ({
            onHistory: () => selectItem(shareId, itemId, { view: 'history', scope }),
            onEdit: () => selectItem(shareId, itemId, { view: 'edit', scope }),
        }),
        [shareId, itemId, scope]
    );
};
