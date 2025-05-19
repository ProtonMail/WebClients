import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import OnboardingStep from '@proton/components/containers/onboarding/OnboardingStep';
import type { OnboardingStepRenderCallback } from '@proton/components/containers/onboarding/interface';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { appendUrlSearchParams } from '@proton/shared/lib/helpers/url';
import { MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/mail/constants';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import mobileAppImg1x from '@proton/styles/assets/img/onboarding/mail_onboarding_mobile_app_download_qr@1x.webp';
import mobileAppImg2x from '@proton/styles/assets/img/onboarding/mail_onboarding_mobile_app_download_qr@2x.webp';
import clsx from '@proton/utils/clsx';

import OnboardingContent from 'proton-mail/components/onboarding/modal/layout/OnboardingContent';

import type { OnboardingStepEligibleCallback } from '../interface';

export const isGetMobileAppStepEligible: OnboardingStepEligibleCallback = async () => {
    return {
        canDisplay: true,
        preload: [mobileAppImg1x, mobileAppImg2x, appStoreSvg, playStoreSvg],
    };
};

const GetMobileAppStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const { viewportWidth } = useActiveBreakpoint();

    const handleNext = () => {
        onNext();
    };

    const appStoreLink = appendUrlSearchParams(MAIL_MOBILE_APP_LINKS.appStore, {
        pt: '106513916',
        ct: 'webapp-mail-onboarding',
        mt: '8',
    });
    const playStoreLink = appendUrlSearchParams(MAIL_MOBILE_APP_LINKS.playStore, {
        utm_source: 'webapp',
        utm_campaign: 'webapp-mail-onboarding',
    });

    const mobileAppAppStoreLink = (
        <Href key="appstore" href={appStoreLink} target="_blank">{c('Onboarding modal').t`iOS`}</Href>
    );

    const mobileAppGooglePlayLink = (
        <Href key="googleplay" href={playStoreLink} target="_blank">{c('Onboarding modal').t`Android`}</Href>
    );

    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding modal').t`Anytime, anywhere access`}
                description={
                    // translator: full sentence is "For anytime access to email and optimized mobile experience, download our iOS or Android app."
                    c('Onboarding modal')
                        .jt`For anytime access to email and optimized mobile experience, download our ${mobileAppAppStoreLink} or ${mobileAppGooglePlayLink} app.`
                }
                titleBlockClassName="mb-8"
            >
                <img
                    className={clsx('max-w-full w-custom', viewportWidth['<=small'] && 'self-start')}
                    style={{ '--w-custom': '24rem' }}
                    srcSet={`${mobileAppImg1x} 1x, ${mobileAppImg2x} 2x`}
                    alt=""
                />

                <div className="flex gap-2 justify-center my-8">
                    <Href href={appStoreLink} target="_blank">
                        <img
                            className="h-custom"
                            style={{ '--h-custom': '2.25rem' }}
                            src={appStoreSvg}
                            // translator: Shows the app name such as: Proton Mail on App Store.
                            alt={c('Onboarding modal').t`${MAIL_APP_NAME} on App Store`}
                        />
                    </Href>
                    <Href href={playStoreLink} target="_blank">
                        <img
                            className="h-custom"
                            style={{ '--h-custom': '2.25rem' }}
                            src={playStoreSvg}
                            // translator: Shows the app name such as: Proton Mail on Play Store.
                            alt={c('Onboarding modal').t`${MAIL_APP_NAME} on Play Store`}
                        />
                    </Href>
                </div>

                <footer className="pt-3">
                    <Button size="large" color="norm" fullWidth onClick={handleNext}>
                        {c('Onboarding modal').t`Next`}
                    </Button>
                </footer>
            </OnboardingContent>
        </OnboardingStep>
    );
};

export default GetMobileAppStep;
