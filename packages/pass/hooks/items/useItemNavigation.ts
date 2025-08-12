import { useCallback } from 'react';

import { useNavigationActions } from '@proton/pass/components/Navigation/NavigationActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';

// As only ids are required for navigation, requiring the least to match even custom types
type SimpleItemRevision = { shareId: string; itemId: string };

export const useItemNavigation = ({ shareId, itemId }: SimpleItemRevision) => {
    const scope = useItemScope();
    const { selectItem } = useNavigationActions();

    const onHistory = useCallback(() => selectItem(shareId, itemId, { view: 'history', scope }), [shareId, itemId]);
    const onEdit = useCallback(() => selectItem(shareId, itemId, { view: 'edit', scope }), [shareId, itemId]);

    return { onHistory, onEdit };
};
