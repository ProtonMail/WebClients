import { Fragment } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

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
            {categoriesToDisplay.map((category) => {
                const categoryLabel = getLabelFromCategoryId(category.id);

                return (
                    <Fragment key={category.id}>
                        <div className="flex gap-3 mb-5">
                            <Toggle
                                id={`enable-${category.id}`}
                                className="self-center"
                                checked={category.display}
                                onClick={() => handleCategoryCheckChange(category)}
                                data-testid={`${category.id}-display`}
                            />

                            <Label htmlFor={`enable-${category.id}`} className={clsx('p-0 flex-1 flex gap-3')}>
                                <Icon
                                    name={category.icon}
                                    className="mt-0.5 mail-category-color self-center"
                                    data-color={category.colorShade}
                                />
                                <div className="flex flex-column gap-1">
                                    <span className="text-lg">{categoryLabel}</span>
                                    <span className="color-weak text-sm">
                                        {getDescriptionFromCategoryId(category.id)}
                                    </span>
                                </div>
                            </Label>

                            <label className="sr-only" htmlFor={`notification-${category.id}`}>{c('Info')
                                .t`Receive notifications for ${categoryLabel}`}</label>
                            <Checkbox
                                id={`notification-${category.id}`}
                                checked={category.notify}
                                onChange={() => handleCategoryNotifyChange(category)}
                                data-testid={`${category.id}-notify`}
                            />
                        </div>

                        <hr className="bg-weak" />
                    </Fragment>
                );
            })}
        </>
    );
};
