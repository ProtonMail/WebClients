import { c } from 'ttag';

import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import onboardingDiscover from '@proton/styles/assets/img/onboarding/discover.svg';

import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'decription' | 'img'> {
    maxContentHeight?: string;
}

const OnboardingDiscoverApps = (props: Props) => {
    return (
        <OnboardingContent
            className="h-custom"
            style={{ '--h-custom': props.maxContentHeight ?? 'auto' }}
            title={c('Onboarding Proton').t`Discover all ${BRAND_NAME} services`}
            description={c('Onboarding Proton')
                .t`Use the app selector in the top left to access all ${BRAND_NAME} services: ${MAIL_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME} and ${DRIVE_SHORT_APP_NAME}.`}
            img={<img src={onboardingDiscover} alt={c('Onboarding Proton').t`Discover all ${BRAND_NAME} services`} />}
            {...props}
        />
    );
};

export default OnboardingDiscoverApps;
