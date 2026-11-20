import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { useCategoriesToggle } from '@proton/mail/features/categoriesView/useCategoriesToggle';

export const CategoryViewToggle = () => {
    const { handleChange, state, loading } = useCategoriesToggle();

    const handleToggle = ({ target }: ChangeEvent<HTMLInputElement>) => {
        handleChange({ checked: target.checked, notification: true });
    };

    return (
        <SettingsToggleRow
            id="toggleCategoryView"
            label={
                <>
                    <SettingsToggleRow.Label>{c('Label').t`Use email categories`}</SettingsToggleRow.Label>
                    <SettingsToggleRow.Description>
                        {c('Tooltip').t`Emails in your inbox are shown organized into categories`}
                    </SettingsToggleRow.Description>
                </>
            }
            toggle={<Toggle id="toggleCategoryView" checked={state} onChange={handleToggle} loading={loading} />}
        />
    );
};
