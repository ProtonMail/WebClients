import { c } from 'ttag';

import { Info, useModalState } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { getCategoryTabFromLabel } from '@proton/mail/features/categoriesView/categoriesHelpers';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { updateLabel } from '@proton/mail/store/labels/actions';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { CategorySettingsItem } from './CategorySettingsItem';
import { CategoryViewToggle } from './CategoryViewToggle';
import { PromptDisableCategories } from './PromptDisableCategories';

import './CategoriesViewSections.scss';

export const CategoriesViewSections = () => {
    const [loading, withLoading] = useLoading(false);

    const dispatch = useDispatch();
    const [modal, setModal, renderModal] = useModalState();

    const [mailSettings] = useMailSettings();
    const { categoriesStore, activeCategoriesTabs } = useCategoriesData();

    const handleCategoryUpdate = async (category: CategoryTab) => {
        if (!mailSettings.MailCategoryView) {
            return;
        }

        const categoryFromStore = categoriesStore?.find((cat) => cat.ID === category.id);
        if (!categoryFromStore) {
            return;
        }

        const isLastEnabledCategory =
            activeCategoriesTabs.filter((cat) => cat.id !== MAILBOX_LABEL_IDS.CATEGORY_DEFAULT).length === 1 &&
            !category.display;

        if (isLastEnabledCategory) {
            setModal(true);
            return;
        }

        const newCategory = {
            Name: categoryFromStore.Name,
            Color: categoryFromStore.Color,
            Display: category.display ? 1 : 0,
            Notify: category.notify ? 1 : 0,
        };

        await withLoading(dispatch(updateLabel({ labelID: category.id, label: newCategory })));
    };

    return (
        <>
            <div className="categories-section">
                <CategoryViewToggle />
                <div
                    className={clsx(
                        'border border-weak rounded-xl',
                        mailSettings.MailCategoryView ? 'opacity-100' : 'opacity-50'
                    )}
                >
                    <div className="inner">
                        <div className="categories-header flex justify-space-between items-center border-bottom border-weak p-4">
                            <p className="m-0 text-semibold text-sm">
                                {c('Label').t`Categories`}{' '}
                                {/* This is intentionally not translated, will be removed after the alpha */}
                                <Info
                                    colorPrimary={false}
                                    className="color-weak"
                                    title="Categories cannot be disabled during the alpha testing"
                                />
                            </p>
                            <p
                                className={clsx(
                                    'm-0 text-semibold text-sm',
                                    mailSettings.MailCategoryView ? 'visible' : 'hidden'
                                )}
                            >
                                {c('Label').t`Notifications`} <Info title={c('Tooltip').t`System notification`} />
                            </p>
                        </div>

                        {categoriesStore
                            .filter((category) => category.ID !== MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)
                            .map((tmp) => {
                                const category = getCategoryTabFromLabel(tmp);

                                return (
                                    <CategorySettingsItem
                                        key={category.id}
                                        categoriesEnabled={mailSettings.MailCategoryView}
                                        onUpdate={handleCategoryUpdate}
                                        category={category}
                                        loading={loading}
                                    />
                                );
                            })}
                    </div>
                </div>
            </div>
            {renderModal && <PromptDisableCategories open={modal.open} onClose={modal.onClose} onExit={modal.onExit} />}
        </>
    );
};
