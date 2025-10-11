import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import EditEmailSubscription from './EditEmailSubscription';
import SettingsParagraph from './SettingsParagraph';
import SettingsSection from './SettingsSection';

const EmailSubscriptionSection = () => {
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
