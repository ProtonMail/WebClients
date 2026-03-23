import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import type { CategoryLabelID } from '@proton/shared/lib/constants';

import { TabState } from './tabsInterface';

export const getTabState = ({
    index,
    category,
    categoriesList,
    draggedOverCategoryId,
    categoryIDs,
}: {
    index: number;
    category: CategoryTab;
    categoriesList: CategoryTab[];
    draggedOverCategoryId?: string;
    categoryIDs?: CategoryLabelID[];
}): TabState => {
    if (categoryIDs?.includes(category.id)) {
        return TabState.ACTIVE;
    } else if (category.id === draggedOverCategoryId) {
        return TabState.DRAGGING_OVER;
    } else if (draggedOverCategoryId) {
        const hoveredIndex = categoriesList.findIndex((c) => c.id === draggedOverCategoryId);
        if (hoveredIndex === index - 1 || hoveredIndex === index + 1) {
            return TabState.DRAGGING_NEIGHBOR;
        }
    }

    return TabState.INACTIVE;
};
