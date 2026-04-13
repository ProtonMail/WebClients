import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import clsx from '@proton/utils/clsx';

import { useMailboxCounter } from 'proton-mail/hooks/useMailboxCounter';
import { getLocationCount } from 'proton-mail/hooks/useMailboxCounter.helpers';
import { useMailboxLayoutProvider } from 'proton-mail/router/components/MailboxLayoutContext';
import { selectCategoryIDs } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useCategoriesView } from '../useCategoriesView';
import { useRecategorizeElement } from '../useRecategorizeElement';
import { CategoriesTabsError, CategoryTabError } from './CategoryTabsErrors';
import { Tab } from './Tab';
import { getTabState } from './categoriesTabsHelper';
import { useCategoriesDrag } from './useCategoriesDrag';

import './CategoriesTabs.scss';

export const CategoriesTabsList = () => {
    const recategorizeElement = useRecategorizeElement();
    const { activeCategoriesTabs } = useCategoriesView();

    const categoryIDs = useMailSelector(selectCategoryIDs);

    const { isColumnModeActive } = useMailboxLayoutProvider();

    const [counterMap] = useMailboxCounter();

    const handleCategoryDrop = (categoryId: string, itemIds: string[]) => {
        void recategorizeElement(categoryId, itemIds);
    };

    const { handleDragEnd, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, draggedOverCategoryId } =
        useCategoriesDrag({ onDrop: handleCategoryDrop });

    // We don't show the tab if there are no active categories
    if (!activeCategoriesTabs.length) {
        return null;
    }

    return (
        <>
            <div
                className={clsx(
                    'categories-tabs flex flex-row flex-nowrap px-4 h-fit-content border-bottom border-weak',
                    !isColumnModeActive && activeCategoriesTabs.length <= 4 && 'low-active-categories'
                )}
                data-testid="categories-tabs"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
            >
                {activeCategoriesTabs.map((category, index) => {
                    const tabState = getTabState({
                        index,
                        category,
                        categoriesList: activeCategoriesTabs || [],
                        draggedOverCategoryId,
                        categoryIDs,
                    });

                    return (
                        <div
                            key={category.id}
                            className="tab-wrapper shrink-0"
                            onDragOver={handleDragOver(category.id)}
                            onDrop={handleDrop(category.id)}
                        >
                            <ErrorBoundary component={<CategoryTabError />}>
                                <Tab
                                    category={category}
                                    tabState={tabState}
                                    count={getLocationCount(counterMap, category.id).Unread}
                                />
                            </ErrorBoundary>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

// Used to wrap the categories components with an error boundary and have a safe fallback component
export const CategoriesTabs = () => {
    return (
        <ErrorBoundary component={<CategoriesTabsError />}>
            <CategoriesTabsList />
        </ErrorBoundary>
    );
};
