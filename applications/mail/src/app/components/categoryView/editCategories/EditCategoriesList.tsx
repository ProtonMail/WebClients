import { clsx } from 'clsx';

import { Checkbox, Icon, Label } from '@proton/components';

import type { CategoryTab } from '../categoriesConstants';
import { getDescriptionFromCategoryId, getLabelFromCategoryId } from '../categoriesStringHelpers';

interface Props {
    categoriesToDisplay: CategoryTab[];
    handleCategoryChange: (categoryId: CategoryTab) => void;
}

export const EditCategoriesList = ({ categoriesToDisplay, handleCategoryChange }: Props) => {
    return (
        <>
            {categoriesToDisplay.map((category) => (
                <div className="flex gap-3 items-start align-center mb-5" key={category.id}>
                    <Checkbox
                        checked={category.checked}
                        onChange={() => handleCategoryChange(category)}
                        id={category.id}
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

                    {/* <Icon name="bell" className="color-weak" alt={c('Action').t`Toggle notifications`} /> */}
                </div>
            ))}
        </>
    );
};
