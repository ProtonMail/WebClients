import { c } from 'ttag';

import { useModalState } from '@proton/components/index';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { getCategoryTabFromLabel } from '@proton/mail/features/categoriesView/categoriesHelpers';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { updateLabel } from '@proton/mail/store/labels/actions';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { PromptDisableCategories } from '../../../app/containers/mail/sections/PromptDisableCategories';
import MobileSection from '../MobileSection';
import { CategoryRowItem } from './CategoryRowItem';

type CategoriesArrays = {
    activeCategoriesTabs: CategoryTab[];
    disabledCategoriesTabs: CategoryTab[];
};

export const CategoriesSettings = () => {
    const [mailSettings] = useMailSettings();
    const { categoriesStore } = useCategoriesData();

    const [modal, setModal, renderModal] = useModalState();

    const dispatch = useDispatch();

    const { activeCategoriesTabs, disabledCategoriesTabs } = categoriesStore.reduce<CategoriesArrays>(
        (acc, tmp) => {
            const category = getCategoryTabFromLabel(tmp);
            if (category.display) {
                acc.activeCategoriesTabs.push(category);
            } else {
                acc.disabledCategoriesTabs.push(category);
            }
            return acc;
        },
        { activeCategoriesTabs: [], disabledCategoriesTabs: [] }
    );

    if (!mailSettings.MailCategoryView) {
        return null;
    }

    const handleUpdate = async (category: CategoryTab) => {
        if (category.id === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT) {
            return;
        }

        const categoryFromStore = categoriesStore.find((cat) => cat.ID === category.id);
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

        await dispatch(updateLabel({ labelID: category.id, label: newCategory }));
    };

    return (
        <>
            <div>
                <p className="px-4 text-lg text-semibold m-0 mb-1.5">{c('Title').t`Categories`}</p>
                <p className="color-weak px-4 m-0 mb-2">
                    {c('Description')
                        .t`Select which categories you want to add and if you want to receive push notifications for each category.`}
                </p>

                <MobileSection>
                    {activeCategoriesTabs.map((category) => {
                        return <CategoryRowItem category={category} onUpdate={handleUpdate} />;
                    })}
                </MobileSection>

                {disabledCategoriesTabs.length > 0 && (
                    <>
                        <p className="px-4 text-lg text-semibold m-0 mb-2">{c('Title').t`Add categories`}</p>
                        <MobileSection>
                            {disabledCategoriesTabs.map((category) => {
                                return <CategoryRowItem category={category} onUpdate={handleUpdate} />;
                            })}
                        </MobileSection>
                    </>
                )}
            </div>
            {renderModal && <PromptDisableCategories {...modal} />}
        </>
    );
};
