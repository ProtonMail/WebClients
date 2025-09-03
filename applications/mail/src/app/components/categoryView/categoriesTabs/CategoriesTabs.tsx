import { ErrorBoundary } from '@proton/components';

import { categoriesArray } from '../categoriesConstants';
import { useRecategorizeElement } from '../useRecategorizeElement';
import { CategoriesTabsError, CategoryTabError } from './CategoryTabsErrorts';
import { Tab } from './Tab';
import { TabState } from './tabsInterface';
import { useCategoriesDrag } from './useCategoriesDrag';

import './CategoriesTabs.scss';

interface Props {
    labelID: string;
}

// In the future, we will only display the categories the user has enabled
export const CategoriesTabsList = ({ labelID }: Props) => {
    const recategorizeElement = useRecategorizeElement();

    const handleCategoryDrop = (categoryId: string, itemIds: string[]) => {
        void recategorizeElement(categoryId, itemIds);
    };

    const { handleDragEnd, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, dragOveredElementId } =
        useCategoriesDrag({ onDrop: handleCategoryDrop });

    return (
        <div
            className="categories-tabs flex flex-row flex-nowrap px-4 h-fit-content border-bottom border-weak"
            data-testid="categories-tabs"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
        >
            {categoriesArray.map((category, index) => {
                let tabState: TabState = TabState.INACTIVE;
                if (category.id === labelID) {
                    tabState = TabState.ACTIVE;
                } else if (category.id === dragOveredElementId) {
                    tabState = TabState.DRAGGING_OVER;
                } else if (dragOveredElementId) {
                    const hoveredIndex = categoriesArray.findIndex((c) => c.id === dragOveredElementId);
                    if (hoveredIndex === index - 1 || hoveredIndex === index + 1) {
                        tabState = TabState.DRAGGING_NEIGHBOR;
                    }
                }

                return (
                    <div key={category.id} onDragOver={handleDragOver(category.id)} onDrop={handleDrop(category.id)}>
                        <ErrorBoundary component={<CategoryTabError />}>
                            <Tab
                                id={category.id}
                                icon={category.icon}
                                colorShade={category.colorShade}
                                tabState={tabState}
                            />
                        </ErrorBoundary>
                    </div>
                );
            })}
        </div>
    );
};

// Used to wrap the categories composants with an error boundary and have a safe fallback component
export const CategoriesTabs = ({ labelID }: Props) => {
    return (
        <ErrorBoundary component={<CategoriesTabsError />}>
            <CategoriesTabsList labelID={labelID} />
        </ErrorBoundary>
    );
};
