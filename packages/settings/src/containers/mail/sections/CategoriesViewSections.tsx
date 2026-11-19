import { useState } from 'react';

import { c } from 'ttag';

import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { SettingsCardRows } from '@proton/components/containers/account/SettingsCardRows';
import { SettingsCardBody } from '@proton/components/containers/account/SettingsCardSection';
import { getCategoryTabFromLabel } from '@proton/mail/features/categoriesView/categoriesHelpers';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { updateLabel } from '@proton/mail/store/labels/actions';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import { CategoriesUnreadCountToggle } from './CategoriesUnreadCountToggle';
import { isLastEnabledCategory } from './CategoriesViewSections.helper';
import { CategorySettingsItem } from './CategorySettingsItem';
import { CategoryViewToggle } from './CategoryViewToggle';
import { PromptDisableCategories } from './PromptDisableCategories';

import './CategoriesViewSections.scss';

export const CategoriesViewSections = () => {
    const [pendingID, setPendingID] = useState<string | null>(null);

    const dispatch = useDispatch();
    const [modal, setModal, renderModal] = useModalState();

    const [mailSettings] = useMailSettings();
    const { categoriesStore, activeCategoriesTabs: activeTabs } = useCategoriesData();
    const { sendReportToggleCategory, sendReportToggleNotification } = useCategoriesTelemetry();

    const getCategoryFromStore = (categoryID: string) => {
        if (!mailSettings.MailCategoryView) {
            return undefined;
        }
        return categoriesStore?.find((cat) => cat.ID === categoryID);
    };

    const updateCategory = async (cat: Label) => {
        setPendingID(cat.ID);
        try {
            await dispatch(
                updateLabel({
                    labelID: cat.ID,
                    label: { Name: cat.Name, Color: cat.Color, Display: cat.Display, Notify: cat.Notify },
                })
            );
        } finally {
            setPendingID(null);
        }
    };

    const handleChangeDisplay = async (categoryID: string) => {
        const cat = getCategoryFromStore(categoryID);
        if (!cat) {
            return;
        }

        if (cat.Display && isLastEnabledCategory(activeTabs, cat.ID)) {
            setModal(true);
            return;
        }

        await updateCategory({ ...cat, Display: cat.Display ? 0 : 1 });
        sendReportToggleCategory(cat.ID, !cat.Display);
    };

    const handleChangeNotify = async (categoryID: string) => {
        const cat = getCategoryFromStore(categoryID);
        if (!cat) {
            return;
        }

        await updateCategory({ ...cat, Notify: cat.Notify ? 0 : 1 });
        sendReportToggleNotification(cat.ID, !cat.Notify);
    };

    return (
        <>
            <DashboardGrid as="div" className="categories-section">
                <DashboardGridSectionHeader title={c('Title').t`Email categories`} />
                <SettingsCardBody>
                    <SettingsCardRows>
                        <CategoryViewToggle />
                        {mailSettings.MailCategoryView && <CategoriesUnreadCountToggle />}
                    </SettingsCardRows>
                </SettingsCardBody>
                <SettingsCardBody>
                    <div className={clsx(mailSettings.MailCategoryView ? 'opacity-100' : 'opacity-50')}>
                        <div className="inner">
                            <div className="categories-header flex justify-space-between border-bottom border-weak pb-3">
                                <p className="m-0 text-semibold text-sm">{c('Label').t`Categories`} </p>
                                <div className="items-center flex gap-1">
                                    <p
                                        className={clsx(
                                            'm-0 text-semibold text-sm',
                                            mailSettings.MailCategoryView ? 'visible' : 'hidden'
                                        )}
                                    >
                                        {c('Label').t`Notifications`}
                                    </p>
                                    <Info title={c('Tooltip').t`System notification`} />
                                </div>
                            </div>

                            {categoriesStore.map((tmp) => {
                                const category = getCategoryTabFromLabel(tmp);

                                return (
                                    <CategorySettingsItem
                                        key={category.id}
                                        categoriesEnabled={mailSettings.MailCategoryView}
                                        category={category}
                                        loading={pendingID === tmp.ID}
                                        updateDisplay={handleChangeDisplay}
                                        updateNotify={handleChangeNotify}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </SettingsCardBody>
            </DashboardGrid>
            {renderModal && <PromptDisableCategories {...modal} />}
        </>
    );
};
