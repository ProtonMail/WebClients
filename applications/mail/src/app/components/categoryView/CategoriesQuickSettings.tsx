import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import QuickSettingsSectionRow from '@proton/components/components/drawer/views/quickSettings/QuickSettingsSectionRow';
import DrawerAppSection from '@proton/components/components/drawer/views/shared/DrawerAppSection';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { useCategoryToggle } from '@proton/mail/features/categoriesView/useCategoryToggle';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

export const CategoriesQuickSettings = () => {
    const { hasAccessToCategoryView } = useCategoriesData();
    const { handleChange, state, loading } = useCategoryToggle();

    const authentication = useAuthentication();

    if (!hasAccessToCategoryView) {
        return null;
    }

    const href = getAppHref('mail/general#categories', APPS.PROTONACCOUNT, authentication.localID);

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
            <Href href={href} className="color-weak text-sm">{c('Label').t`Manage categories`}</Href>
        </DrawerAppSection>
    );
};
