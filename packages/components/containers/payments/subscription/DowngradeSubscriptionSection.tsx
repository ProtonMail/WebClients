import { c } from 'ttag';

import { SettingsParagraph, SettingsSection } from '../../account';
import UnsubscribeButton from './UnsubscribeButton';

const DowngradeSubscriptionSection = () => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`This will cancel your current paid subscription and you will lose any loyalty benefits you have accumulated. The remaining balance of your subscription will be returned as account credits.`}
            </SettingsParagraph>
            <UnsubscribeButton color="danger" shape="outline">
                {c('Action').t`Downgrade account`}
            </UnsubscribeButton>
        </SettingsSection>
    );
};

export default DowngradeSubscriptionSection;
