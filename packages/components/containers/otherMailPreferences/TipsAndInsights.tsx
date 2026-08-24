import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import Info from '../../components/link/Info';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import TipsAndInsightsToggle from '../general/TipsAndTricksToggle';

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
