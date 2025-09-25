import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, Icon, Label } from '@proton/components';
import type { CategoryTab } from '@proton/mail';

import { getDescriptionFromCategoryId, getLabelFromCategoryId } from '../categoriesStringHelpers';

interface Props {
    categoriesToDisplay: CategoryTab[];
    handleCategoryCheckChange: (categoryId: CategoryTab) => void;
    handleCategoryNotifyChange: (categoryId: CategoryTab) => void;
}

export const EditCategoriesList = ({
    categoriesToDisplay,
    handleCategoryCheckChange,
    handleCategoryNotifyChange,
}: Props) => {
    return (
        <>
            {categoriesToDisplay.map((category) => (
                <div className="flex gap-3 items-start align-center mb-5" key={category.id}>
                    <Checkbox
                        checked={category.display}
                        onChange={() => handleCategoryCheckChange(category)}
                        id={category.id}
                        data-testid={`${category.id}-display`}
                    />
                    <Label htmlFor={category.id} className={clsx('p-0 flex-1 flex gap-3')}>
                        <Icon
                            name={category.icon}
                            className="mt-0.5 mail-category-color"
                            data-color={category.colorShade}
                        />
                        <div className="flex flex-column gap-1">
                            <span>{getLabelFromCategoryId(category.id)}</span>
                            <span className="color-weak text-sm">{getDescriptionFromCategoryId(category.id)}</span>
                        </div>
                    </Label>

                    {category.display && (
                        <Button
                            icon
                            shape="ghost"
                            aria-pressed={category.notify}
                            onClick={() => handleCategoryNotifyChange(category)}
                            data-testid={`${category.id}-notify`}
                        >
                            <Icon
                                name={category.notify ? 'bell-filled-2' : 'bell'}
                                className="color-weak"
                                alt={c('Action').t`Toggle notifications`}
                            />
                        </Button>
                    )}
                </div>
            ))}
        </>
    );
};
