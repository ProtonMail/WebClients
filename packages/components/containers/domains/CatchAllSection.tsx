import React from 'react';
import { c } from 'ttag';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { SettingsSectionWide, SettingsParagraph, UpgradeBanner } from '../account';
import { useUser } from '../../hooks';

const CatchAllSection = () => {
    const [{ isAdmin, isSubUser }] = useUser();
    const hasPermission = isAdmin && !isSubUser;

    return (
        <SettingsSectionWide>
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/catch-all/">
                {c('Info')
                    .t`If you have a custom domain with ProtonMail, you can set a catch-all email address that will receive messages sent to your domain but to an invalid email address (e.g., typos).`}
            </SettingsParagraph>
            {!hasPermission && (
                <UpgradeBanner>
                    {c('Message').t`Upgrade to a ${PLAN_NAMES[PLANS.VISIONARY]} or ${
                        PLAN_NAMES[PLANS.PROFESSIONAL]
                    } plan to use a catch-all address and unlock premium features`}
                </UpgradeBanner>
            )}
        </SettingsSectionWide>
    );
};

export default CatchAllSection;
