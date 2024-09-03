import { c } from 'ttag';

import useConfig from '@proton/components/hooks/useConfig';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import type { Organization } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';

import { SettingsParagraph, SettingsSectionWide, UpgradeBanner } from '../account';

interface Props {
    app: APP_NAMES;
    organization?: Organization;
}

const OrganizationSectionUpsell = ({ app }: Props) => {
    const { APP_NAME } = useConfig();

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('new_plans: info')
                    .t`${BRAND_NAME} lets you create email addresses and manage accounts for sub-users. Ideal for families and organizations.`}
            </SettingsParagraph>

            <UpgradeBanner
                audience={Audience.B2B}
                upsellPath={getUpsellRefFromApp({
                    app: APP_NAME,
                    feature: SHARED_UPSELL_PATHS.MULTI_USER,
                    component: UPSELL_COMPONENT.BANNER,
                    fromApp: app,
                })}
            >{c('new_plans: upgrade').t`Included with multiple users ${BRAND_NAME} for Business plans.`}</UpgradeBanner>
        </SettingsSectionWide>
    );
};

export default OrganizationSectionUpsell;
