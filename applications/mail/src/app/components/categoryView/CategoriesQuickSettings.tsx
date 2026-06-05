import { c } from 'ttag';

import QuickSettingsSectionRow from '@proton/components/components/drawer/views/quickSettings/QuickSettingsSectionRow';
import DrawerAppSection from '@proton/components/components/drawer/views/shared/DrawerAppSection';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { useCategoryToggle } from '@proton/mail/features/categoriesView/useCategoryToggle';

export const CategoriesQuickSettings = () => {
    const { hasAccessToCategoryView } = useCategoriesData();
    const { handleChange, state, loading } = useCategoryToggle();

    if (!hasAccessToCategoryView) {
        return null;
    }

    return (
        <DrawerAppSection>
            <QuickSettingsSectionRow
                label={c('Label').t`Email categories`}
                labelInfo={<Info title={c('Info').t`Automatically sort incoming emails into categories`} />}
                labelProps={{ htmlFor: 'toggle-categories' }}
                action={
                    <Toggle
                        id="toggle-categories"
                        checked={state}
                        onChange={({ target }) => handleChange({ checked: target.checked, notification: false })}
                        loading={loading}
                    />
                }
            />
        </DrawerAppSection>
    );
};
