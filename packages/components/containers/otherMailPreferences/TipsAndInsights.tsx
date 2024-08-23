import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import TipsAndInsightsToggle from '@proton/components/containers/general/TipsAndTricksToggle';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

export const TipsAndInsights = () => {
    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <span className="mr-2 text-semibold">{c('Label').t`Tips and insights`}</span>
                <Info
                    title={c('Tooltip')
                        .t`Get productivity and security tips to help you make the most of ${MAIL_APP_NAME} and beyond.`}
                />
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <TipsAndInsightsToggle />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};
