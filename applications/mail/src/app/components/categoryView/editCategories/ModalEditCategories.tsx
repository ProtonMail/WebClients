import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalContent, ModalTwo, ModalTwoFooter, useApi } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { type CategoryTab, categoriesActions } from '@proton/mail';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateLabel } from '@proton/shared/lib/api/labels';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { useCategoriesView } from '../useCategoriesView';
import { EditCategoriesList } from './EditCategoriesList';

interface Props extends ModalProps {
    onDisableAll: () => void;
}

export const ModalEditCategories = ({ onDisableAll, ...rest }: Props) => {
    const api = useApi();
    const { categoriesTabs, categoriesStore } = useCategoriesView();

    const dispatch = useDispatch();

    const [categoriesListState, setCategoriesListState] = useState<CategoryTab[]>(
        categoriesTabs?.filter((category) => category.id !== MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) || []
    );

    const [loading, withLoading] = useLoading(false);

    const handleSaveCategories = async () => {
        if (categoriesListState.every((cat) => !cat.display)) {
            onDisableAll();
            return;
        }

        let shouldReload = false;
        const promises: Promise<any>[] = [];

        // We loop over all categories to know what changed and update them accordingly
        categoriesListState.forEach((category) => {
            const initialCategory = categoriesTabs.find((cat) => cat.id === category.id);
            const categoryFromStore = categoriesStore?.find((cat) => cat.ID === category.id);
            if (!categoryFromStore) {
                return;
            }

            const displayChanged = initialCategory?.display !== category.display;
            const notifyChanged = initialCategory?.notify !== category.notify;
            shouldReload = shouldReload || displayChanged;

            if (displayChanged || notifyChanged) {
                promises.push(
                    api(
                        // TODO use new system label endpoint and remove Name / Color once created
                        updateLabel(category.id, {
                            Name: categoryFromStore.Name,
                            Color: categoryFromStore.Color,
                            Display: category.display ? 1 : 0,
                            Notify: category.notify ? 1 : 0,
                        })
                    )
                );
            }

            // We only do the optimistic when the user has changed the notify setting since we reload the page when changing the visibility
            if (notifyChanged) {
                dispatch(
                    categoriesActions.upsertCategory({
                        ...categoryFromStore,
                        Notify: category.notify ? 1 : 0,
                    })
                );
            }
        });

        await withLoading(Promise.all(promises));

        if (shouldReload) {
            window.location.replace(`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]}`);
        } else {
            rest.onClose?.();
        }
    };

    const handleCategoryUpdate = (newCategory: CategoryTab) => {
        const newState = categoriesListState.map((cat) => (cat.id === newCategory.id ? newCategory : cat));
        setCategoriesListState(newState);
    };

    return (
        <ModalTwo {...rest} data-testid="edit-categories-modal" size="small">
            <ModalContent>
                <p className="m-0 mb-4 pt-8 text-semibold">{c('Title').t`Customize categories`}</p>
                <p className="m-0 mb-6 color-weak">{c('Label')
                    .t`Select the categories to include, and enable notifications to be alerted about new emails in a category.`}</p>
                <EditCategoriesList
                    categoriesToDisplay={categoriesListState}
                    handleCategoryCheckChange={(category) =>
                        handleCategoryUpdate({ ...category, display: !category.display })
                    }
                    handleCategoryNotifyChange={(category) =>
                        handleCategoryUpdate({ ...category, notify: !category.notify })
                    }
                />
            </ModalContent>
            <ModalTwoFooter>
                <span className="w-full">
                    <Button
                        fullWidth
                        onClick={handleSaveCategories}
                        loading={loading}
                        data-testid="save-categories-button"
                    >
                        {c('Action').t`Done`}
                    </Button>
                </span>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
