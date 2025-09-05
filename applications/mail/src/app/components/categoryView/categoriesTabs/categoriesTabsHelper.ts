import type { CategoryTab } from '../categoriesConstants';
import { TabState } from './tabsInterface';

export const getTabState = ({
    index,
    category,
    categoriesList,
    labelID,
    dragOveredElementId,
}: {
    index: number;
    category: CategoryTab;
    categoriesList: CategoryTab[];
    labelID: string;
    dragOveredElementId?: string;
}): TabState => {
    if (category.id === labelID) {
        return TabState.ACTIVE;
    } else if (category.id === dragOveredElementId) {
        return TabState.DRAGGING_OVER;
    } else if (dragOveredElementId) {
        const hoveredIndex = categoriesList.findIndex((c) => c.id === dragOveredElementId);
        if (hoveredIndex === index - 1 || hoveredIndex === index + 1) {
            return TabState.DRAGGING_NEIGHBOR;
        }
    }

    return TabState.INACTIVE;
};
