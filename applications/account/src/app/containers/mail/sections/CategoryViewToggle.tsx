import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import { useCategoryToggle } from '@proton/mail/features/categoriesView/useCategoryToggle';

export const CategoryViewToggle = () => {
    const { handleChange, state, loading } = useCategoryToggle();

    return (
        <SettingsLayout className="w-full">
            <SettingsLayoutLeft>
                <label htmlFor="toggleCategoryView" className="text-semibold">
                    <span className="mr-2">{c('Label').t`Use email categories`}</span>
                    <Info title={c('Tooltip').t`Emails in your inbox are shown organized into categories`} />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle
                    id="toggleCategoryView"
                    checked={state}
                    onChange={({ target }) => handleChange({ checked: target.checked, notification: true })}
                    loading={loading}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
