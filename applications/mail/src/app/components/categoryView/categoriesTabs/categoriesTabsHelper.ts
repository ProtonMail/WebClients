import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import type { CategoryLabelID } from '@proton/shared/lib/constants';

import { TabState } from './tabsInterface';

export const getTabState = ({
    category,
    draggedOverCategoryId,
    categoryIDs,
    selectAll,
}: {
    category: CategoryTab;
    selectAll: boolean;
    draggedOverCategoryId?: string;
    categoryIDs?: CategoryLabelID[];
}): TabState => {
    if (categoryIDs?.includes(category.id)) {
        return TabState.ACTIVE;
    }

    if (selectAll) {
        return TabState.INACTIVE;
    }

    if (category.id === draggedOverCategoryId) {
        return TabState.DRAGGING_OVER;
    }

    return TabState.INACTIVE;
};
