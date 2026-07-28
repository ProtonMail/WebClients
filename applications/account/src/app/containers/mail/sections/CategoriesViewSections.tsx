import { useState } from 'react';

import { c } from 'ttag';

import { Info, useModalState } from '@proton/components';
import { getCategoryTabFromLabel } from '@proton/mail/features/categoriesView/categoriesHelpers';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { updateLabel } from '@proton/mail/store/labels/actions';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import type { Label } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

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

    const showBadgeSettings = useFlag('MailRecordLastUnseenIncomingMessageEventID');
    const isReloadDisabled = useFlag('InboxDesktopCategoryViewSettingsToggleReloadDisabled');

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

        // INDA-703: remove the current implementation once 1.14.0 is released
        if (isElectronApp && !isReloadDisabled) {
            void invokeInboxDesktopIPC({ type: 'userLogin' }).catch(noop);
        }
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
            <div className="categories-section">
                <CategoryViewToggle />
                {showBadgeSettings && mailSettings.MailCategoryView && <CategoriesUnreadCountToggle />}
                <div
                    className={clsx(
                        'border border-weak rounded-xl',
                        mailSettings.MailCategoryView ? 'opacity-100' : 'opacity-50'
                    )}
                >
                    <div className="inner">
                        <div className="categories-header flex justify-space-between border-bottom border-weak p-4">
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
            </div>
            {renderModal && <PromptDisableCategories {...modal} />}
        </>
    );
};
