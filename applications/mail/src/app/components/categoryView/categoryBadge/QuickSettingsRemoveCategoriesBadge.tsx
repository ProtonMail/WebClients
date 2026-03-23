import { c } from 'ttag';

import QuickSettingsSectionRow from '@proton/components/components/drawer/views/quickSettings/QuickSettingsSectionRow';
import DrawerAppSection from '@proton/components/components/drawer/views/shared/DrawerAppSection';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { DISABLED_BADGE } from './categoryViewConstants';
import { useCategoryViewExperiment } from './useCategoryViewExperiment';

// This is temporary and will be removed once we have enough feedback on the mail categorization
export const QuickSettingsRemoveCategoriesBadge = () => {
    const { canSeeCategoryLabel } = useCategoryViewExperiment();
    if (!canSeeCategoryLabel) {
        return null;
    }

    const isEnabled = !getItem(DISABLED_BADGE);

    const toggleBadge = () => {
        if (isEnabled) {
            setItem(DISABLED_BADGE, new Date().getTime().toString());
        } else {
            removeItem(DISABLED_BADGE);
        }

        location.reload();
    };

    return (
        <DrawerAppSection>
            <QuickSettingsSectionRow
                labelProps={{ htmlFor: 'toggle-category-badge' }}
                label={c('Label').t`Categories badge`}
                labelInfo={<Info title={c('Label').t`Help us improve the upcoming mail categorization`} />}
                action={<Toggle id="toggle-category-badge" checked={isEnabled} onChange={toggleBadge} />}
            />
        </DrawerAppSection>
    );
};
