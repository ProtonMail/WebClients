import { type FC, useEffect, useMemo } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { IcBrandAndroid } from '@proton/icons/icons/IcBrandAndroid';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandLinux } from '@proton/icons/icons/IcBrandLinux';
import { IcBrandMac } from '@proton/icons/icons/IcBrandMac';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';
import { getExtensionSupportedBrowser } from '@proton/pass/lib/extension/utils/browser';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isFirefox, isSafari } from '@proton/shared/lib/helpers/browser';
import { Clients, clients } from '@proton/shared/lib/pass/constants';

import { getTelemetryClientType } from '../../../../single-signup-v2/measure';
import browserImage from '../assets/images/browser.svg';
import { Layout } from '../components/Layout/Layout';
import { measureSignupCtx } from '../measure';

type Props = {
    onContinue: () => Promise<void>;
};

export const InstallExtensionStep: FC<Props> = ({ onContinue }) => {
    const api = useApi();

    const browserType: Clients | null = useMemo(() => {
        const supportedBrowser = getExtensionSupportedBrowser();

        if (supportedBrowser) {
            return supportedBrowser;
        }
        if (isSafari()) {
            return Clients.Safari;
        }
        if (isFirefox()) {
            return Clients.Firefox;
        }

        return null;
    }, []);

    const browser = browserType ? clients[browserType] : null;

    const platforms = [
        { ...clients[Clients.iOS], Icon: IcBrandApple },
        { ...clients[Clients.Android], Icon: IcBrandAndroid },
        { ...clients[Clients.Windows], Icon: IcBrandWindows },
        { ...clients[Clients.Linux], Icon: IcBrandLinux },
        { ...clients[Clients.macOS], Icon: IcBrandMac },
    ];

    useEffect(() => {
        void measureSignupCtx(api, {
            event: TelemetryAccountSignupEvents.onboardFinish,
        });
    }, []);

    const handleExtensionDownload = () => {
        const telemetryClientType = browserType ? getTelemetryClientType(browserType) : 'unknown';

        void measureSignupCtx(api, {
            event: TelemetryAccountSignupEvents.interactDownload,
            dimensions: { click: `download_${telemetryClientType}` },
        });
    };

    return (
        <Layout>
            <img src={browserImage} alt="Browser icon" />
            <h2 className="text-4xl text-bold my-5 text-center">{c('Title').t`Secure your passwords. Everywhere.`}</h2>
            {browser && (
                <ButtonLike
                    as="a"
                    target="_blank"
                    size="large"
                    color="norm"
                    pill
                    href={browser.link}
                    onClick={handleExtensionDownload}
                >
                    {c('Action').t`Get the extension for ${browser.title}`}
                </ButtonLike>
            )}
            <Button className="mt-4" shape="ghost" color="norm" pill onClick={onContinue}>
                {c('Action').t`Open ${PASS_APP_NAME} in your browser`}
            </Button>
            <div className="divider-gradient mt-20 w-full h-custom" style={{ '--h-custom': '1px' }} />
            <h4 className="text-xl text-bold my-6 text-center">{c('Title')
                .t`Download ${PASS_APP_NAME} for your devices`}</h4>
            <div className="flex">
                {platforms.map((platform) => (
                    <ButtonLike
                        className="flex flex-column items-center"
                        key={platform.icon}
                        as="a"
                        target="_blank"
                        shape="ghost"
                        href={platform.link}
                    >
                        <platform.Icon size={11} style={{ color: 'var(--text-weak)' }} />
                        <span className="text-lg mt-1">{platform.title}</span>
                    </ButtonLike>
                ))}
            </div>
        </Layout>
    );
};
