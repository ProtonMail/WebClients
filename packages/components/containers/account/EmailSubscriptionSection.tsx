import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import EditEmailSubscription from './EditEmailSubscription';
import SettingsParagraph from './SettingsParagraph';
import SettingsSection from './SettingsSection';

export const EmailSubscriptionDescription = () => {
    const blogLink = <Href key={`link-to-blog`} href={getStaticURL('/blog')}>{c('Link').t`visit our blog`}</Href>;

    return c('Info')
        .jt`To keep up with the latest development at ${BRAND_NAME} products, you can subscribe to our various emails and ${blogLink} from time to time.`;
};

interface Props {
    toggleContainerClassName?: string;
}
const EmailSubscriptionSection = ({ toggleContainerClassName }: Props) => {
    return (
        <SettingsSection>
            <SettingsParagraph>
                <EmailSubscriptionDescription />
            </SettingsParagraph>
            <EditEmailSubscription wrapperClassName={toggleContainerClassName} />
        </SettingsSection>
    );
};

export default EmailSubscriptionSection;
