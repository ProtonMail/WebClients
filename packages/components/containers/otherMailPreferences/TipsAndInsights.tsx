import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsToggleRow } from '../account/SettingsToggleRow';
import TipsAndInsightsToggle from '../general/TipsAndTricksToggle';

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
