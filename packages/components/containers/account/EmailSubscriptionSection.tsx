import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

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

    const blogLink = <Href key={`link-to-blog`} href={getStaticURL('/blog')}>{c('Link').t`visit our blog`}</Href>;

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .jt`To keep up with the latest development at ${BRAND_NAME} products, you can subscribe to our various emails and ${blogLink} from time to time.`}
            </SettingsParagraph>
            <EditEmailSubscription />
        </SettingsSection>
    );
};

export default EmailSubscriptionSection;
