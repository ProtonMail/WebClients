import { useMemo } from 'react';

import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';

// When only ids are required, requiring the least to match even custom types
type SimpleItemRevision = { shareId: string; itemId: string };

export type ItemNavigationActions = {
    onEdit: () => void;
    onHistory: () => void;
};

type UseItemNavigation = (item: SimpleItemRevision) => ItemNavigationActions;

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
