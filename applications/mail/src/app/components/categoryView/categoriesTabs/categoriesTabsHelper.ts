import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';

import { TabState } from './tabsInterface';

export const getTabState = ({
    index,
    category,
    categoriesList,
    categoryLabelID,
    draggedOverCategoryId,
}: {
    index: number;
    category: CategoryTab;
    categoriesList: CategoryTab[];
    categoryLabelID: string;
    draggedOverCategoryId?: string;
}): TabState => {
    if (category.id === categoryLabelID) {
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
