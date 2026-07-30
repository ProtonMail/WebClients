import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import Toggle from '@proton/components/components/toggle/Toggle';
import { CategoryIcon } from '@proton/mail/features/categoriesView/CategoryIcon';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import {
    getDescriptionFromCategoryId,
    getLabelFromCategoryId,
} from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

interface CategoryItemProps {
    category: CategoryTab;
    loading: boolean;
    categoriesEnabled: boolean;
    onUpdate: (category: CategoryTab) => void;
}

export const CategorySettingsItem = ({ category, loading, categoriesEnabled, onUpdate }: CategoryItemProps) => {
    const categoryLabel = getLabelFromCategoryId(category.id);

    const isReloadDisabled = useFlag('InboxDesktopCategoryViewSettingsToggleReloadDisabled');
    const { sendReportToggleCategory, sendReportToggleNotification } = useCategoriesTelemetry();

    const handleToggleCategory = () => {
        onUpdate({ ...category, display: !category.display });
        sendReportToggleCategory(category.id, !category.display);

        // INDA-703: remove the current implementation once 1.14.0 is released
        if (isElectronApp && !isReloadDisabled) {
            void invokeInboxDesktopIPC({ type: 'userLogin' }).catch(noop);
        }
    };

    const handleToggleNotification = () => {
        onUpdate({ ...category, notify: !category.notify });
        sendReportToggleNotification(category.id, !category.notify);
    };

    return (
        <div key={category.id} className="flex items-center px-4 py-2">
            <Toggle
                id={`enable-${category.id}`}
                className={clsx('mr-3', categoriesEnabled ? 'visible' : 'hidden')}
                checked={category.display}
                onClick={handleToggleCategory}
                data-testid={`${category.id}-display`}
                disabled={loading || category.id === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT}
            />

            <Label htmlFor={`enable-${category.id}`} className="p-0 flex-1 flex-nowrap flex gap-3">
                <CategoryIcon
                    categoryId={category.id}
                    colorShade={category.colorShade}
                    variant="filled"
                    className="mt-0.5 mail-category-color self-center"
                />
                <div className="flex flex-column">
                    <span>{categoryLabel}</span>
                    <span className="color-weak text-sm">{getDescriptionFromCategoryId(category.id)}</span>
                </div>
            </Label>

            <label className="sr-only" htmlFor={`notification-${category.id}`}>
                {c('Info').t`Receive notifications for ${categoryLabel}`}
            </label>

            <Checkbox
                id={`notification-${category.id}`}
                className={categoriesEnabled ? 'visible' : 'hidden'}
                checked={category.display ? category.notify : false}
                onChange={handleToggleNotification}
                data-testid={`${category.id}-notify`}
                disabled={loading || category.id === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT}
            />
        </div>
    );
};
