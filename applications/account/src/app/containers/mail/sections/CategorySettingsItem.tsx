import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import {
    getDescriptionFromCategoryId,
    getLabelFromCategoryId,
} from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import noop from '@proton/utils/noop';

interface CategoryItemProps {
    category: CategoryTab;
    loading: boolean;
    onUpdate: (category: CategoryTab) => void;
}

export const CategorySettingsItem = ({ category, loading, onUpdate }: CategoryItemProps) => {
    const categoryLabel = getLabelFromCategoryId(category.id);

    return (
        <div key={category.id} className="flex items-center px-4 py-2">
            <Toggle
                id={`enable-${category.id}`}
                className="self-center mr-3"
                // checked={category.display}
                checked={true}
                // onClick={() => onUpdate({ ...category, display: !category.display })}
                onClick={noop}
                data-testid={`${category.id}-display`}
                // disabled={loading}
                disabled={true}
            />

            <Label htmlFor={`enable-${category.id}`} className="p-0 flex-1 flex gap-3">
                <Icon
                    name={category.filledIcon}
                    className="mt-0.5 mail-category-color self-center"
                    data-color={category.colorShade}
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
                checked={category.notify}
                onChange={() => onUpdate({ ...category, notify: !category.notify })}
                data-testid={`${category.id}-notify`}
                disabled={loading}
            />
        </div>
    );
};
