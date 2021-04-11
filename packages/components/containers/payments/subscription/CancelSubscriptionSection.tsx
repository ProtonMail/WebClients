import React from 'react';
import { c } from 'ttag';

import { SettingsParagraph, SettingsSection } from '../../account';

import UnsubscribeButton from './UnsubscribeButton';

const CancelSubscriptionSection = () => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`This will cancel your paid subscription and make you lose any loyalty benefits acquired over time. The unused portion of your subscription will be handed back to you in the form of credits`}
            </SettingsParagraph>
            <UnsubscribeButton color="danger" shape="outline">
                {c('Action').t`Cancel subscription`}
            </UnsubscribeButton>
        </SettingsSection>
    );
};

export default CancelSubscriptionSection;
