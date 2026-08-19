import { useEffect, useRef } from 'react';

import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { logger } from '@proton/logger';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { selectCategoryUnreadCount } from '@proton/mail/store/categoriesView/categoriesViewSelector';
import { updateLastSeenEventId } from '@proton/mail/store/labels/actions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { selectActiveCategoryID, selectCategoryIDs } from '../../../store/elements/elementsSelectors';
import { useMailSelector } from '../../../store/hooks';
import { selectDraggingElements, selectSelectAll } from '../../../store/layout/layoutSliceSelectors';

import { useCategoriesOnboarding } from '../categoriesOnboarding/CategoriesOnboardingContext';
import { CategoriesOnboardingSpotlight } from '../categoriesOnboarding/CategoriesOnboardingSpotlights';
import { useCategoriesView } from '../useCategoriesView';
import { useRecategorizeElement } from '../useRecategorizeElement';
import { CategoriesTabsError, CategoryTabError } from './CategoryTabsErrors';
import { Tab } from './Tab';
import { getTabState } from './categoriesTabsHelper';
import { useCategoriesDrag } from './useCategoriesDrag';
import { useCategoriesTabsDensity } from './useCategoriesTabsDensity';

import './CategoriesTabs.scss';

export const CategoriesTabsList = () => {
    const recategorizeElement = useRecategorizeElement();
    const { activeCategoriesTabs } = useCategoriesView();
    const { socialTabSpotlightStep } = useCategoriesOnboarding();

    const categoryIDs = useMailSelector(selectCategoryIDs);
    const activeCategoryID = useMailSelector(selectActiveCategoryID);
    const selectAll = useMailSelector(selectSelectAll);
    const isDraggingElements = useMailSelector(selectDraggingElements);

    const dispatch = useDispatch();

    const barRef = useRef<HTMLDivElement>(null);
    const density = useCategoriesTabsDensity(barRef, activeCategoriesTabs);

    const activeCategoryUnreadCount = useMailSelector((state) =>
        activeCategoryID ? selectCategoryUnreadCount(state, activeCategoryID).count : 0
    );

    // We mark the current category as seen on first load and whenever a new email arrives in the active
    // category. `activeCategoryUnreadCount` tells us something happened in the active category.
    useEffect(() => {
        if (!activeCategoryID) {
            return;
        }

        void dispatch(updateLastSeenEventId({ labelID: activeCategoryID }));
    }, [activeCategoryID, activeCategoryUnreadCount, dispatch]);

    const { sendReportRecategorizeEmail } = useCategoriesTelemetry();

    const handleCategoryDrop = (categoryId: string, itemIds: string[]) => {
        if (selectAll) {
            return;
        }

        void recategorizeElement(categoryId, itemIds);
        sendReportRecategorizeEmail('drag_and_drop', categoryIDs[0], categoryId, itemIds.length);
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
                ref={barRef}
                className={clsx(
                    'categories-tabs flex flex-nowrap px-2 h-fit-content border-bottom border-weak',
                    density === 'roomy' && 'tabs-roomy',
                    density === 'compact' && 'tabs-compact'
                )}
                data-testid="categories-tabs"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
            >
                {activeCategoriesTabs.map((category) => {
                    const tabState = getTabState({
                        category,
                        draggedOverCategoryId,
                        categoryIDs,
                        selectAll,
                    });

                    const isSocialCategory = category.id === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL;
                    if (isSocialCategory && socialTabSpotlightStep) {
                        return (
                            <CategoriesOnboardingSpotlight step={socialTabSpotlightStep} key={category.id}>
                                <div
                                    className="tab-wrapper"
                                    onDragOver={handleDragOver(category.id)}
                                    onDrop={handleDrop(category.id)}
                                >
                                    <ErrorBoundary component={<CategoryTabError />} logger={logger}>
                                        <Tab
                                            category={category}
                                            tabState={tabState}
                                            userIsDragging={isDraggingElements}
                                        />
                                    </ErrorBoundary>
                                </div>
                            </CategoriesOnboardingSpotlight>
                        );
                    }

                    return (
                        <div
                            key={category.id}
                            className="tab-wrapper"
                            onDragOver={handleDragOver(category.id)}
                            onDrop={handleDrop(category.id)}
                        >
                            <ErrorBoundary component={<CategoryTabError />} logger={logger}>
                                <Tab category={category} tabState={tabState} userIsDragging={isDraggingElements} />
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
        <ErrorBoundary component={<CategoriesTabsError />} logger={logger}>
            <CategoriesTabsList />
        </ErrorBoundary>
    );
};
