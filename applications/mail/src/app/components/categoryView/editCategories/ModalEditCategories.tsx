import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useApi } from '@proton/components';
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
        <ModalTwo {...rest} data-testid="edit-categories-modal">
            <ModalTwoHeader />
            <ModalTwoContent className="my-0 mx-12 mb-4">
                <p className="m-0 mb-4 text-2xl text-bold">{c('Title').t`Customize categories`}</p>
                <p className="m-0 mb-4 text-lg color-weak">{c('Label')
                    .t`Select the categories to include and manage notifications for new emails.`}</p>

                <div className="flex justify-space-between">
                    <p className="my-4 text-semibold text-sm">{c('Label').t`Categories`}</p>
                    <p className="my-4 text-semibold text-sm">{c('Label').t`Notifications`}</p>
                </div>
                <hr className="bg-weak" />

                <EditCategoriesList
                    categoriesToDisplay={categoriesListState}
                    handleCategoryCheckChange={(category) =>
                        handleCategoryUpdate({ ...category, display: !category.display })
                    }
                    handleCategoryNotifyChange={(category) =>
                        handleCategoryUpdate({ ...category, notify: !category.notify })
                    }
                />
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end gap-4">
                <Button size="large" onClick={() => rest.onClose?.()}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    size="large"
                    onClick={handleSaveCategories}
                    loading={loading}
                    data-testid="save-categories-button"
                >
                    {c('Action').t`Save preferences`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
