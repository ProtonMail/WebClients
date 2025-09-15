import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { ModalContent, ModalTwo, ModalTwoFooter, useApi } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import type { CategoryTab } from '@proton/mail';
import { updateLabel } from '@proton/shared/lib/api/labels';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useCategoriesView } from '../useCategoriesView';
import { EditCategoriesList } from './EditCategoriesList';

export const ModalEditCategories = ({ ...rest }: ModalProps) => {
    const api = useApi();
    const { categoriesTabs, categoriesStore } = useCategoriesView();

    const initialCheckedCategoriesIdsRef = useRef<string[] | undefined>(undefined);

    const [disabled, setDisabled] = useState(false);
    const [categoriesListState, setCategoriesListState] = useState<CategoryTab[]>(
        categoriesTabs?.filter((category) => category.id !== MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) || []
    );

    const [loading, withLoading] = useLoading(false);

    // This is used to keep track of the initial state of the checked categories
    if (!initialCheckedCategoriesIdsRef.current) {
        initialCheckedCategoriesIdsRef.current = categoriesListState
            .filter((category) => category.checked)
            .map((category) => category.id);
    }

    const toggleCategories = async () => {
        const promises: Promise<any>[] = [];

        const initialCategories = initialCheckedCategoriesIdsRef.current || [];

        categoriesListState.forEach((category) => {
            const isNowChecked = category.checked && !initialCategories.includes(category.id);
            const isNowUnchecked = !category.checked && initialCategories.includes(category.id);

            if (isNowChecked || isNowUnchecked) {
                const categoryFromStore = categoriesStore?.find((cat) => cat.ID === category.id);
                if (!categoryFromStore) {
                    return;
                }

                promises.push(
                    api(
                        // TODO use new system label endpoint and remove Name / Color once created
                        updateLabel(category.id, {
                            Name: categoryFromStore.Name,
                            Color: categoryFromStore.Color,
                            Display: category.checked ? 1 : 0,
                        })
                    )
                );
            }
        });

        await withLoading(Promise.all(promises));
    };

    const handleSaveCategories = async () => {
        const currentChecked = categoriesListState
            .filter((category) => category.checked)
            .map((category) => category.id);

        const areSameSize = currentChecked.length === initialCheckedCategoriesIdsRef.current?.length;
        const areSameContent = currentChecked.every((id) => initialCheckedCategoriesIdsRef.current?.includes(id));

        // We reload if the user made any change in the list of categories
        if (currentChecked && (!areSameSize || !areSameContent)) {
            await toggleCategories();
            window.location.reload();
        }
    };

    const handleCategoryToggle = async (category: CategoryTab) => {
        const newState = categoriesListState.map((cat) =>
            cat.id === category.id ? { ...cat, checked: !cat.checked } : cat
        );

        setDisabled(newState.every((cat) => !cat.checked));
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
                    handleCategoryChange={handleCategoryToggle}
                />
            </ModalContent>
            <ModalTwoFooter>
                <Tooltip title={disabled ? c('Label').t`You cannot disable all categories` : undefined}>
                    <span className="w-full">
                        <Button fullWidth onClick={handleSaveCategories} loading={loading} disabled={disabled}>
                            {c('Action').t`Done`}
                        </Button>
                    </span>
                </Tooltip>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
