import { c } from 'ttag';

import { SettingsParagraph, SettingsSection } from '@proton/components';

import { AccessToggleMeet } from './FeatureAccess/AccessToggleMeet';
import { AccessToggleScribe } from './FeatureAccess/AccessToggleScribe';
import { AccessToggleZoom } from './FeatureAccess/AccessToggleZoom';

export const FeatureAccessSection = () => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info').t`Manage which features the members of your organization can access.`}
            </SettingsParagraph>
            <AccessToggleScribe />
            <AccessToggleMeet />
            <AccessToggleZoom />
        </SettingsSection>
    );
};
