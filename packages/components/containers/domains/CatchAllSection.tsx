import { c } from 'ttag';

import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_APP_NAME,
    MAIL_UPSELL_PATHS,
    PLANS,
    PLAN_NAMES,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useUser } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide, UpgradeBanner } from '../account';

const CatchAllSection = () => {
    const [{ isAdmin, isSubUser }] = useUser();
    const hasPermission = isAdmin && !isSubUser;

    const plus = PLAN_NAMES[PLANS.MAIL];
    const bundle = PLAN_NAMES[PLANS.BUNDLE];

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.CATCH_ALL,
        isSettings: true,
    });

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/catch-all')}>
                {c('Info')
                    .t`If you have a custom domain with ${MAIL_APP_NAME}, you can set a catch-all email address to receive messages sent to your domain but to an invalid email address (e.g., because of typos).`}
            </SettingsParagraph>
            {!hasPermission && (
                <UpgradeBanner upsellPath={upsellRef}>
                    {c('new_plans: upgrade').t`Included with ${plus}, ${bundle}, and ${BRAND_NAME} for Business.`}
                </UpgradeBanner>
            )}
        </SettingsSectionWide>
    );
};

export default CatchAllSection;
