import { c } from 'ttag';

import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';

import { AccessToggleCategoryView } from './FeatureAccess/AccessToggleCategoryView';
import { AccessToggleScribe } from './FeatureAccess/AccessToggleScribe';
import { AccessToggleZoom } from './FeatureAccess/AccessToggleZoom';

export const FeatureAccessSection = () => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info').t`Manage which features the members of your organization can access.`}
            </SettingsParagraph>
            <AccessToggleScribe />
            <AccessToggleCategoryView />
            <AccessToggleZoom />
        </SettingsSection>
    );
};
