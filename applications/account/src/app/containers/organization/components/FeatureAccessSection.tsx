import { c } from 'ttag';

import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';

import { AccessToggleCategoryView } from './FeatureAccess/AccessToggleCategoryView';
import { AccessToggleLumoApi } from './FeatureAccess/AccessToggleLumoApi';
import { AccessToggleScribe } from './FeatureAccess/AccessToggleScribe';
import { AccessToggleZoom } from './FeatureAccess/AccessToggleZoom';

export interface FeatureAccessVisibility {
    canShowScribe: boolean;
    canShowVideoConference: boolean;
    canShowLumoApi: boolean;
}

export const FeatureAccessSection = ({
    canShowScribe,
    canShowVideoConference,
    canShowLumoApi,
}: FeatureAccessVisibility) => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info').t`Manage which features the members of your organization can access.`}
            </SettingsParagraph>
            {canShowScribe && <AccessToggleScribe />}
            {canShowLumoApi && <AccessToggleLumoApi />}
            {(canShowScribe || canShowVideoConference) && <AccessToggleCategoryView />}
            {canShowVideoConference && <AccessToggleZoom />}
        </SettingsSection>
    );
};
