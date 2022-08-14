import { c } from 'ttag';

import { useSubscription } from '../../hooks';
import EditEmailSubscription from './EditEmailSubscription';
import MozillaInfoPanel from './MozillaInfoPanel';
import SettingsParagraph from './SettingsParagraph';
import SettingsSection from './SettingsSection';

const EmailSubscriptionSection = () => {
    const [subscription] = useSubscription();

    if (subscription?.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`To keep up with the latest development at Proton products, you can subscribe to our various emails and visit our blog from time to time.`}
            </SettingsParagraph>
            <EditEmailSubscription />
        </SettingsSection>
    );
};

export default EmailSubscriptionSection;
