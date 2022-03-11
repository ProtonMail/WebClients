import { c } from 'ttag';
import { PLAN_NAMES, PLANS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { SettingsSectionWide, SettingsParagraph, UpgradeBanner } from '../account';
import { useUser } from '../../hooks';

const CatchAllSection = () => {
    const [{ isAdmin, isSubUser }] = useUser();
    const hasPermission = isAdmin && !isSubUser;

    const plus = PLAN_NAMES[PLANS.MAIL];
    const bundle = PLAN_NAMES[PLANS.BUNDLE];

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/catch-all/">
                {c('Info')
                    .t`If you have a custom domain with ${MAIL_APP_NAME}, you can set a catch-all email address to receive messages sent to your domain but to an invalid email address (e.g., because of typos).`}
            </SettingsParagraph>
            {!hasPermission && (
                <UpgradeBanner>
                    {c('new_plans: upgrade').t`Included with ${plus}, ${bundle}, and Proton for Business.`}
                </UpgradeBanner>
            )}
        </SettingsSectionWide>
    );
};

export default CatchAllSection;
