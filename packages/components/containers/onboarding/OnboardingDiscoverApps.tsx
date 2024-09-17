import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import onboardingDiscover from '@proton/styles/assets/img/onboarding/discover.svg';

import type { Props as OnboardingContentProps } from './OnboardingContent';
import OnboardingContent from './OnboardingContent';
import OnboardingStep from './OnboardingStep';
import type { OnboardingStepRenderCallback } from './interface';

interface Props extends Omit<OnboardingContentProps, 'decription' | 'img'>, OnboardingStepRenderCallback {}

const OnboardingDiscoverApps = (props: Props) => {
    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding Proton').t`Discover all ${BRAND_NAME} services`}
                description={c('Onboarding Proton')
                    .t`Use the app selector in the top left to access all ${BRAND_NAME} services: ${MAIL_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME} and ${PASS_SHORT_APP_NAME}.`}
                img={
                    <img src={onboardingDiscover} alt={c('Onboarding Proton').t`Discover all ${BRAND_NAME} services`} />
                }
                {...props}
            />
            <footer className="flex flex-nowrap">
                <Button size="large" className="mr-4" fullWidth onClick={props.onBack}>{c('Action').t`Back`}</Button>
                <Button size="large" color="norm" fullWidth onClick={props.onNext}>
                    {c('Action').t`Get started`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default OnboardingDiscoverApps;
