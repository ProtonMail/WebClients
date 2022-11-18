import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import { SettingsParagraph, SettingsSectionWide } from '../account';
import Spams from './spams/Spams';

const SpamFiltersSection = () => (
    <SettingsSectionWide>
        <SettingsParagraph>
            {c('FilterSettings').t`Emails from blocked addresses won't be delivered.`}
            <br />
            <br />
            {c('FilterSettings')
                .t`Emails from addresses marked as spam by you or ${BRAND_NAME} will go to your spam folder. If you want to allow emails from one of these addresses, mark it as "not spam".`}
        </SettingsParagraph>

        <Spams />
    </SettingsSectionWide>
);

export default SpamFiltersSection;
