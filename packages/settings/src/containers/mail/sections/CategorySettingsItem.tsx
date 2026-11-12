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
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

interface CategoryItemProps {
    category: CategoryTab;
    loading: boolean;
    categoriesEnabled: boolean;
    updateDisplay: (categoryID: string) => void;
    updateNotify: (categoryID: string) => void;
}

export const CategorySettingsItem = ({
    category,
    loading,
    categoriesEnabled,
    updateDisplay,
    updateNotify,
}: CategoryItemProps) => {
    const categoryLabel = getLabelFromCategoryId(category.id);

    const handleToggleCategory = () => {
        updateDisplay(category.id);
    };

    const handleToggleNotification = () => {
        updateNotify(category.id);
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
                // Notification cannot be changed if the category is disabled or primary
                disabled={loading || !category.display || category.id === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT}
            />
        </div>
    );
};
