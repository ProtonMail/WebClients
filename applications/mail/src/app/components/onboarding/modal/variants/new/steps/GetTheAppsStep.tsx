import { type ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import {
    OnboardingStep,
    type OnboardingStepRenderCallback,
    QRCode,
    SettingsLink,
    useActiveBreakpoint,
} from '@proton/components';
import useInboxDesktopVersion from '@proton/components/containers/desktop/useInboxDesktopVersion';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { MAIL_APP_NAME, MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/constants';
import { getOS, isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import desktopAppIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_desktop_app.svg';
import mobileAppIcon from '@proton/styles/assets/img/onboarding/mail_onboarding_mobile_app.svg';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { useMailOnboardingTelemetry } from 'proton-mail/components/onboarding/useMailOnboardingTelemetry';

import NewOnboardingContent from '../layout/NewOnboardingContent';

const getApps = (displayAltDesktopVersion: boolean, onClick: (type: 'desktopLink' | 'mobileLink') => void) => {
    // translator: full sentence "Get it from the App Store or Google Play."
    const mobileAppAppStoreLink = (
        <Href
            key="appstore"
            onClick={() => onClick('mobileLink')}
            href={MAIL_MOBILE_APP_LINKS.appStore}
            target="_blank"
        >{c('Onboarding modal').t`App Store`}</Href>
    );
    // translator: full sentence "Get it from the App Store or Google Play."
    const mobileAppGooglePlayLink = (
        <Href
            key="googleplay"
            onClick={() => onClick('mobileLink')}
            href={MAIL_MOBILE_APP_LINKS.playStore}
            target="_blank"
        >{c('Onboarding modal').t`Google Play`}</Href>
    );

    // translator: full sentence "Get it from the App Store or Google Play."
    const mobileAppDescription = c('Onboarding modal')
        .jt`Get the mobile app from the ${mobileAppAppStoreLink} or ${mobileAppGooglePlayLink}.`;

    const desktopAppDescription = c('Onboarding modal')
        .t`Access email and calendar right from your desktop with the desktop app.`;

    const desktopAppLink = (
        <SettingsLink
            key="desktop"
            onClick={() => onClick('desktopLink')}
            path="/get-the-apps#proton-mail-desktop-apps"
            target="_blank"
        >{c('Onboarding modal').t`Get the desktop app`}</SettingsLink>
    );

    return {
        mobileApp: {
            title: c('Onboarding modal').t`On the move`,
            description: mobileAppDescription,
            icon: mobileAppIcon,
        },
        desktopApp: {
            title: c('Onboarding modal').t`Fixed and focused`,
            description: displayAltDesktopVersion ? (
                <>
                    {desktopAppDescription}
                    <br />
                    {desktopAppLink}
                </>
            ) : (
                desktopAppDescription
            ),
            desktopAppLink: desktopAppLink,
            icon: desktopAppIcon,
            cta: c('Onboarding modal').t`Download the desktop app and continue`,
        },
    };
};

const AppItem = ({
    title,
    description,
    imgSrc,
    className,
    qrCodeLink,
}: {
    imgSrc: string;
    title: string;
    description: ReactNode;
    className?: string;
    qrCodeLink?: string;
}) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewPort = viewportWidth['<=small'];

    return (
        <div className={clsx('flex flex-row gap-4 items-center', className)}>
            <img
                className={clsx('w-custom', isSmallViewPort && 'self-start')}
                style={{ '--w-custom': isSmallViewPort ? '3rem' : '5rem' }}
                src={imgSrc}
                alt=""
            />
            <div className="flex-1 flex gap-0">
                <p className="m-0 text-bold mb-1">{title}</p>
                <p className="m-0 text-weak">{description}</p>
            </div>
            {qrCodeLink && !isSmallViewPort ? (
                <div
                    className="border rounded p-1.5 h-custom w-custom"
                    style={{ '--h-custom': '5.5rem', '--w-custom': '5.5rem' }}
                >
                    <QRCode value={qrCodeLink} />
                </div>
            ) : null}
        </div>
    );
};

const GetTheAppsStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const { viewportWidth } = useActiveBreakpoint();
    const [sendMailOnboardingTelemetry] = useMailOnboardingTelemetry();

    const { windowsApp, macosApp, linuxApp } = useInboxDesktopVersion();
    const isWindowsAppOK = windowsApp && windowsApp.File[0]?.Url && windowsApp.Version;
    const isMacosAppOK = macosApp && macosApp.File[0]?.Url && macosApp.Version;
    const isLinuxAppOK = linuxApp && linuxApp.Version && linuxApp.File.every((file) => file.Url);
    const desktopAppLink = (() => {
        const os = getOS();
        const isMacOS = os.name === 'Mac OS';
        const isWindow = os.name === 'Windows';

        const isDebianBasedOS = ['Ubuntu', 'Debian'].includes(os.name);
        const isFeforaOrRedHatBasedOS = ['Fedora', 'Red Hat'].includes(os.name);

        if (isWindowsAppOK && isWindow) {
            return windowsApp.File[0]?.Url;
        }
        if (isMacosAppOK && isMacOS) {
            return macosApp.File[0]?.Url;
        }
        if (isLinuxAppOK && isDebianBasedOS) {
            return linuxApp.File.find((file) => file.Url.includes('.deb'))?.Url;
        }
        if (isLinuxAppOK && isFeforaOrRedHatBasedOS) {
            return linuxApp.File.find((file) => file.Url.includes('.rpm'))?.Url;
        }

        return undefined;
    })();

    // If device is Mobile, Electron, or linux based
    const displayAltVersion = viewportWidth['<=small'] || isElectronApp || !desktopAppLink || isMobile();
    const apps = useMemo(() => {
        return getApps(displayAltVersion, noop);
    }, [displayAltVersion]);

    const handleNext = () => {
        onNext();
    };

    const handleDesktopAppButtonClick = () => {
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.download_desktop_app, {});
        handleNext();
    };

    return (
        <OnboardingStep>
            <NewOnboardingContent
                title={c('Onboarding modal').jt`More ways to experience ${MAIL_APP_NAME}`}
                className="mb-12"
            >
                <div>
                    <AppItem
                        className="pb-6"
                        description={apps.mobileApp.description}
                        imgSrc={apps.mobileApp.icon}
                        qrCodeLink={MAIL_MOBILE_APP_LINKS.qrCode}
                        title={apps.mobileApp.title}
                    />
                    <div className="border-top border-weak" />
                    <AppItem
                        className="pt-6"
                        description={apps.desktopApp.description}
                        imgSrc={apps.desktopApp.icon}
                        title={apps.desktopApp.title}
                    />
                </div>
            </NewOnboardingContent>
            <footer>
                {!displayAltVersion && desktopAppLink && (
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
                    {displayAltVersion ? c('Onboarding modal').t`Next` : c('Onboarding modal').t`Maybe later`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default GetTheAppsStep;
