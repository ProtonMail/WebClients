import { c } from 'ttag';

import { SettingsParagraph, SettingsSectionWide } from '@proton/components';
import { getBlogURL } from '@proton/shared/lib/helpers/url';

export const RolesAndPermissionsSection = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl={getBlogURL('/roles-and-permissions')} className="mb-4">
                {c('AdminRole_Info')
                    .t`A role is a group of permissions that you can assign to the members of your organization.`}
            </SettingsParagraph>
        </SettingsSectionWide>
    );
};
