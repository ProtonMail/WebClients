import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { Href } from '@proton/atoms/Href/Href';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_APP_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { SettingsCardSection } from '../account/SettingsCardSection';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSectionWide from '../account/SettingsSectionWide';
import UpgradeBanner from '../account/UpgradeBanner';
import { SettingsLayoutVariant } from '../layout/interface';

interface Props {
    /** The organization settings render the section without cards. */
    variant?: SettingsLayoutVariant;
}

const CatchAllSection = ({ variant = SettingsLayoutVariant.Default }: Props) => {
    const [user] = useUser();
    const [{ permissions }] = useUserPermissions();
    const hasPermission = !!permissions?.['account.domain.read'] && user.hasPaidMail;

    const plus = PLAN_NAMES[PLANS.MAIL];
    const bundle = PLAN_NAMES[PLANS.BUNDLE];

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.BANNER,
        feature: MAIL_UPSELL_PATHS.CATCH_ALL,
        isSettings: true,
    });

    const text = c('Info')
        .t`If you have a custom domain with ${MAIL_APP_NAME}, you can set a catch-all email address to receive messages sent to your domain but to an invalid email address (e.g., because of typos).`;
    const banner = permissions !== null && !hasPermission && (
        <UpgradeBanner upsellPath={upsellRef} promotion={variant === SettingsLayoutVariant.Card}>
            {c('new_plans: upgrade').t`Included with ${plus}, ${bundle}, and ${BRAND_NAME} for Business.`}
        </UpgradeBanner>
    );

    if (variant === SettingsLayoutVariant.Card) {
        return (
            <SettingsCardSection
                title={c('Title').t`Catch-all address`}
                description={
                    <>
                        {text} <Href href={getKnowledgeBaseUrl('/catch-all')}>{c('Link').t`Learn more`}</Href>
                    </>
                }
                notice={banner}
            />
        );
    }

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/catch-all')}>{text}</SettingsParagraph>
            {banner}
        </SettingsSectionWide>
    );
};

export default CatchAllSection;
