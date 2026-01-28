import { useState } from 'react';

import { c } from 'ttag';

import { Checkbox, Icon, Info, Label, Toggle } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import type { CategoryTab } from '@proton/mail';
import { useCategoriesData } from '@proton/mail';
import { getCategoryTabFromLabel } from '@proton/mail/features/categoriesView/categoriesHelpers';
import {
    getDescriptionFromCategoryId,
    getLabelFromCategoryId,
} from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { updateLabel } from '@proton/mail/store/labels/actions';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CategoryViewToggle } from './CategoryViewToggle';

import './CategoriesViewSections.scss';

export const CategoriesViewSections = () => {
    const [loading, withLoading] = useLoading(false);

    const dispatch = useDispatch();

    const [mailSettings] = useMailSettings();
    const isCategoryViewEnabled = useFlag('CategoryView');
    const { categoriesStore } = useCategoriesData();

    const [expandState, setExpandState] = useState(mailSettings.MailCategoryView);

    if (!isCategoryViewEnabled) {
        return null;
    }

    const handleCategoryUpdate = async (category: CategoryTab) => {
        if (!expandState) {
            return;
        }

        const categoryFromStore = categoriesStore?.find((cat) => cat.ID === category.id);
        if (!categoryFromStore) {
            return;
        }

        const newCategory = {
            Name: categoryFromStore.Name,
            Color: categoryFromStore.Color,
            Display: category.display ? 1 : 0,
            Notify: category.notify ? 1 : 0,
        };

        void withLoading(dispatch(updateLabel({ labelID: category.id, label: newCategory })));
    };

    return (
        <div className="categories-section">
            <CategoryViewToggle onToggleCallback={(value) => setExpandState(value)} />
            <div className={clsx('wrapper', expandState && 'is-open')}>
                <div className="inner">
                    <div className="categories-header flex justify-space-between items-center border border-weak p-4">
                        <p className="m-0 text-semibold text-sm">{c('Label').t`Categories`}</p>
                        <p className="m-0 text-semibold text-sm">
                            {c('Label').t`Notifications`} <Info title={c('Tooltip').t`System notification`} />
                        </p>
                    </div>

                    {categoriesStore
                        .filter((category) => category.ID !== MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)
                        .map((tmp, index, arr) => {
                            const category = getCategoryTabFromLabel(tmp);
                            const categoryLabel = getLabelFromCategoryId(category.id);
                            const isLast = index === arr.length - 1;

                            return (
                                <div
                                    key={category.id}
                                    className={clsx(
                                        'flex border-bottom border-left border-right border-weak px-4 py-2',
                                        isLast && 'category-last'
                                    )}
                                >
                                    <Toggle
                                        id={`enable-${category.id}`}
                                        className="self-center mr-3"
                                        checked={category.display}
                                        onClick={() =>
                                            handleCategoryUpdate({ ...category, display: !category.display })
                                        }
                                        data-testid={`${category.id}-display`}
                                        disabled={loading}
                                    />

                                    <Label htmlFor={`enable-${category.id}`} className="p-0 flex-1 flex gap-3">
                                        <Icon
                                            name={category.icon}
                                            className="mt-0.5 mail-category-color self-center"
                                            data-color={category.colorShade}
                                        />
                                        <div className="flex flex-column">
                                            <span>{categoryLabel}</span>
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
                                        onChange={() => handleCategoryUpdate({ ...category, notify: !category.notify })}
                                        data-testid={`${category.id}-notify`}
                                        disabled={loading}
                                    />
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};
