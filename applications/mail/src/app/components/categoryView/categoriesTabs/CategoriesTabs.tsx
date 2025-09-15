import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ErrorBoundary, Icon, useModalState } from '@proton/components';

import { ModalEditCategories } from '../editCategories/ModalEditCategories';
import { PromptDisableCategories } from '../editCategories/PromptDisableCategories';
import { useCategoriesView } from '../useCategoriesView';
import { useRecategorizeElement } from '../useRecategorizeElement';
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

    const [editModalProps, setEditModal, renderEditModal] = useModalState();
    const [disableModalProps, setDisableModal, renderDisableModal] = useModalState();

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
                                    id={category.id}
                                    icon={category.icon}
                                    colorShade={category.colorShade}
                                    tabState={tabState}
                                />
                            </ErrorBoundary>
                        </div>
                    );
                })}
                <Button
                    icon
                    shape="ghost"
                    className="ml-2 color-weak hover:color-norm"
                    onClick={() => setEditModal(true)}
                    data-testid="edit-categories-button"
                >
                    <Icon name="sliders-2" alt={c('Action').t`Edit categories`} />
                </Button>
            </div>
            {renderEditModal && (
                <ModalEditCategories
                    onDisableAll={() => {
                        setDisableModal(true);
                    }}
                    {...editModalProps}
                />
            )}
            {renderDisableModal && <PromptDisableCategories {...disableModalProps} />}
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
