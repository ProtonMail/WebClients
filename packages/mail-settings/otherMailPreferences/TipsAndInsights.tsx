import { c } from 'ttag';

import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import TipsAndInsightsToggle from '@proton/components/containers/general/TipsAndTricksToggle';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

export const TipsAndInsights = () => {
    return (
        <SettingsToggleRow
            id="tipsAndInsightsToggle"
            label={
                <>
                    <SettingsToggleRow.Label>{c('Label').t`Tips and insights`}</SettingsToggleRow.Label>
                    <SettingsToggleRow.Description>
                        {c('Tooltip')
                            .t`Get productivity and security tips to help you make the most of ${MAIL_APP_NAME} and beyond.`}
                    </SettingsToggleRow.Description>
                </>
            }
            toggle={<TipsAndInsightsToggle id="tipsAndInsightsToggle" />}
        />
    );
};
