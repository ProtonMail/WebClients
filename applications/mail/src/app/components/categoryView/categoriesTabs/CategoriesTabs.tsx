import { ErrorBoundary } from '@proton/components';

import { useMailboxCounter } from 'proton-mail/hooks/useMailboxCounter';
import { getLocationCount } from 'proton-mail/hooks/useMailboxCounter.helpers';

import { CategoriesOnboarding } from '../categoriesOnboarding/CategoriesOnboarding';
import { useCategoriesOnboarding } from '../categoriesOnboarding/useCategoriesOnboarding';
import { useCategoriesView } from '../useCategoriesView';
import { useRecategorizeElement } from '../useRecategorizeElement';
import { ButtonEditCategories } from './ButtonEditCategories';
import { CategoriesTabsError, CategoryTabError } from './CategoryTabsErrors';
import { Tab } from './Tab';
import { getTabState } from './categoriesTabsHelper';
import { useCategoriesDrag } from './useCategoriesDrag';

import './CategoriesTabs.scss';

interface Props {
    categoryLabelID: string;
}

export const CategoriesTabsList = ({ categoryLabelID }: Props) => {
    const recategorizeElement = useRecategorizeElement();
    const { activeCategoriesTabs } = useCategoriesView();

    const [counterMap] = useMailboxCounter();
    const onboarding = useCategoriesOnboarding();

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
                className="categories-tabs flex flex-row flex-nowrap px-4 h-fit-content border-bottom border-weak"
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
                        categoryLabelID,
                        draggedOverCategoryId,
                    });

                    return (
                        <div
                            key={category.id}
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
                <ButtonEditCategories />
            </div>

            {onboarding.isUserEligible && (
                <CategoriesOnboarding audience={onboarding.audienceType} flagValue={onboarding.flagValue} />
            )}
        </>
    );
};

// Used to wrap the categories components with an error boundary and have a safe fallback component
export const CategoriesTabs = ({ categoryLabelID }: Props) => {
    return (
        <ErrorBoundary component={<CategoriesTabsError />}>
            <CategoriesTabsList categoryLabelID={categoryLabelID} />
        </ErrorBoundary>
    );
};
