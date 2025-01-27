import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { OnboardingStep, type OnboardingStepRenderCallback, useActiveBreakpoint } from '@proton/components';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useInboxDesktopVersion from '@proton/components/containers/desktop/useInboxDesktopVersion';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { isDebianBased, isFedoraOrRedHatBased, isMac, isWindows } from '@proton/shared/lib/helpers/browser';
import linuxAppImg1x from '@proton/styles/assets/img/onboarding/mail_onboarding_desktop_app_download_linux@1x.webp';
import linuxAppImg2x from '@proton/styles/assets/img/onboarding/mail_onboarding_desktop_app_download_linux@2x.webp';
import macAppImg1x from '@proton/styles/assets/img/onboarding/mail_onboarding_desktop_app_download_mac@1x.webp';
import macAppImg2x from '@proton/styles/assets/img/onboarding/mail_onboarding_desktop_app_download_mac@2x.webp';
import windowsAppImg1x from '@proton/styles/assets/img/onboarding/mail_onboarding_desktop_app_download_windows@1x.webp';
import windowsAppImg2x from '@proton/styles/assets/img/onboarding/mail_onboarding_desktop_app_download_windows@2x.webp';
import clsx from '@proton/utils/clsx';

import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';

import OnboardingContent from '../layout/OnboardingContent';

const GetDesktopAppStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const { viewportWidth } = useActiveBreakpoint();
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();

    const { desktopAppLink } = useInboxDesktopVersion();

    const handleNext = () => {
        onNext();
    };

    const handleDesktopAppButtonClick = () => {
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.download_desktop_app, {});
        handleNext();
    };

    const getIllustration = () => {
        if (isMac()) {
            return `${macAppImg1x} 1x, ${macAppImg2x} 2x`;
        } else if (isWindows()) {
            return `${windowsAppImg1x} 1x, ${windowsAppImg2x} 2x`;
        } else if (isDebianBased() || isFedoraOrRedHatBased()) {
            return `${linuxAppImg1x} 1x, ${linuxAppImg2x} 2x`;
        }
        return `${macAppImg1x}, ${macAppImg2x} 2x`;
    };

    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding modal').t`Distraction-free emailing`}
                description={c('Onboarding modal').t`Enjoy a faster, focused emailing experience with the desktop app.`}
                titleBlockClassName="mb-8"
            >
                <div>
                    <img
                        className={clsx('w-full mb-1', viewportWidth['<=small'] && 'self-start')}
                        srcSet={getIllustration()}
                        alt=""
                    />
                </div>
            </OnboardingContent>
            <footer className="pt-12">
                {!desktopAppLink ? (
                    <ButtonLike
                        as={SettingsLink}
                        path="/get-the-apps?ref=mail-cta-onboarding#proton-mail-desktop-apps"
                        target="_blank"
                        data-testid="drawer-quick-settings:all-settings-button"
                        className="mb-4"
                        key="desktop"
                        size="large"
                        fullWidth
                        color="norm"
                    >{c('Onboarding modal').t`Download the desktop app`}</ButtonLike>
                ) : (
                    <ButtonLike
                        as="a"
                        href={desktopAppLink}
                        download
                        size="large"
                        fullWidth
                        color="norm"
                        onClick={handleDesktopAppButtonClick}
                        className="mb-4"
                    >
                        {c('Onboarding modal').t`Download the desktop app`}
                    </ButtonLike>
                )}
                <Button size="large" fullWidth onClick={handleNext}>
                    {c('Onboarding modal').t`Maybe later`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default GetDesktopAppStep;
