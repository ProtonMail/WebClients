import { clsx } from 'clsx';

import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import Toggle from '@proton/components/components/toggle/Toggle';
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
                <>
                    <div key={category.id} className="flex gap-3 mb-5">
                        <Toggle
                            className="self-center"
                            checked={category.display}
                            onChange={() => handleCategoryCheckChange(category)}
                            id={category.id}
                            data-testid={`${category.id}-display`}
                        />
                        <Label htmlFor={category.id} className={clsx('p-0 flex-1 flex gap-3')}>
                            <Icon
                                name={category.icon}
                                className="mt-0.5 mail-category-color self-center"
                                data-color={category.colorShade}
                            />
                            <div className="flex flex-column gap-1">
                                <span className="text-lg">{getLabelFromCategoryId(category.id)}</span>
                                <span className="color-weak text-sm">{getDescriptionFromCategoryId(category.id)}</span>
                            </div>
                        </Label>

                        <Checkbox
                            id={category.id}
                            checked={category.notify}
                            onClick={() => handleCategoryNotifyChange(category)}
                            data-testid={`${category.id}-notify`}
                        />
                    </div>

                    <hr className="bg-weak" />
                </>
            ))}
        </>
    );
};
