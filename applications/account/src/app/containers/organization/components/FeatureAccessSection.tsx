import { c } from 'ttag';

import { SettingsParagraph, SettingsSection } from '@proton/components';

import { AccessToggleMeet } from './FeatureAccess/AccessToggleMeet';
import { AccessToggleScribe } from './FeatureAccess/AccessToggleScribe';

export const FeatureAccessSection = () => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`Manage which features the members of your organization can access. If disabled, only administrators will have access.`}
            </SettingsParagraph>
            <AccessToggleScribe />
            <AccessToggleMeet />
        </SettingsSection>
    );
};
