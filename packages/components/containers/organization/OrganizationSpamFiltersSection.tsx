import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import { SettingsParagraph, SettingsSectionWide } from '../account';
import Spams from '../filters/spams/Spams';

const OrganizationSpamFiltersSection = () => (
    <SettingsSectionWide>
        <SettingsParagraph>
            {c('FilterSettings').t`Emails from blocked addresses won't be delivered.`}
        </SettingsParagraph>
        <SettingsParagraph>
            {c('FilterSettings')
                .t`Emails from addresses marked as spam by you or ${BRAND_NAME} will go to the spam folder of your organization members. If you want to allow emails from one of these addresses, mark it as "not spam".`}
        </SettingsParagraph>
        <Spams isOrganization />
    </SettingsSectionWide>
);

export default OrganizationSpamFiltersSection;
