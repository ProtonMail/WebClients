import { useMemo } from 'react';

import { useNavigationActions } from '../../components/Navigation/NavigationActions';
import { useItemScope } from '../../components/Navigation/NavigationMatches';
import type { UniqueItem } from '../../types';

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
