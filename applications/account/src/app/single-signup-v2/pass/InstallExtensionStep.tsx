import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import ButtonLike from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import {
    isAndroid,
    isBrave,
    isChrome,
    isEdgeChromium,
    isFirefox,
    isIos,
    isSafari,
} from '@proton/shared/lib/helpers/browser';
import { Clients, clients } from '@proton/shared/lib/pass/constants';

import Content from '../../public/Content';
import Header from '../../public/Header';
import Main from '../../public/Main';
import type { Measure } from '../interface';
import type { TelemetryExtensionPlatform } from '../measure';
import { getTelemetryClientType } from '../measure';
import appStore from './logos/app-store.svg';
import brave from './logos/brave.svg';
import chrome from './logos/chrome.svg';
import firefox from './logos/firefox.svg';
import playStore from './logos/play-store.svg';
import safari from './logos/safari.svg';
import installExtension from './pass-extension-illustration.svg';
import androidStore from './store/android.svg';
import iosStore from './store/ios.svg';

const getBrowserTitle = (appName: string, browserName: string) => {
    return c('pass_signup_2023: Info').t`Get ${appName} for ${browserName}`;
};

const getButton = (link: string, children: ReactNode, onClick: () => void) => {
    return (
        <ButtonLike color="norm" size="large" as={Href} href={link} className="w-full mt-6" onClick={onClick}>
            {children}
        </ButtonLike>
    );
};

const getContent = (src: string, content: string) => {
    return (
        <>
            <img src={src} alt="" />
            <div className="mt-6">{content}</div>
        </>
    );
};

const getPreload = (src: string) => {
    return <link rel="prefetch" href={src} as="image" />;
};

interface ExtensionInfo {
    type: TelemetryExtensionPlatform;
    title: string;
    subTitle: string;
    content: ReactNode;
    cta: ReactNode;
    preload: ReactNode;
}

export const getInfo = (
    skip: ReactNode,
    onClickDownload: (type: TelemetryExtensionPlatform) => void
): ExtensionInfo => {
    // only because of ttag bug in case of twice the same variable in the same string
    const PASS_APP_NAME2 = PASS_APP_NAME;

    if (isIos()) {
        const client = clients[Clients.iOS];
        const type = getTelemetryClientType(Clients.iOS);
        return {
            type,
            title: c('pass_signup_2023: Info').t`Install app`,
            subTitle: c('pass_signup_2023: Info').t`to start using ${PASS_APP_NAME} on your phone`,
            content: (
                <>
                    {getContent(
                        iosStore,
                        // translator: full sentence is: Download the <Proton Pass> app from the App Store and install it to start using <Proton Pass> on your phone.
                        c('pass_signup_2023: Info')
                            .t`Download the ${PASS_APP_NAME} app from the App Store and install it to start using ${PASS_APP_NAME2} on your phone.`
                    )}
                </>
            ),
            cta: (
                <>
                    {getButton(client.link, getBrowserTitle(PASS_APP_NAME, client.title), () => onClickDownload(type))}
                    {skip}
                </>
            ),
            preload: getPreload(iosStore),
        };
    }

    if (isAndroid()) {
        const client = clients[Clients.Android];
        const type = getTelemetryClientType(Clients.Android);
        return {
            type,
            title: c('pass_signup_2023: Info').t`Install app`,
            subTitle: c('pass_signup_2023: Info').t`to start using ${PASS_APP_NAME} on your phone`,
            content: (
                <>
                    {getContent(
                        androidStore,
                        // translator: full sentence is: Download the <Proton Pass> app from Google Play and install it to start using <Proton Pass> on your phone.
                        c('pass_signup_2023: Info')
                            .t`Download the ${PASS_APP_NAME} app from Google Play and install it to start using ${PASS_APP_NAME2} on your phone.`
                    )}
                </>
            ),
            cta: (
                <>
                    {getButton(client.link, getBrowserTitle(PASS_APP_NAME, client.title), () => onClickDownload(type))}
                    {skip}
                </>
            ),
            preload: getPreload(androidStore),
        };
    }

    if (isFirefox()) {
        const client = clients[Clients.Firefox];
        const type = getTelemetryClientType(Clients.Firefox);
        return {
            type,
            title: c('pass_signup_2023: Info').t`Install ${PASS_APP_NAME}`,
            subTitle: '',
            content: (
                <>
                    {getContent(
                        installExtension,
                        // translator: full sentence is: Download the <Proton Pass> browser extension from Firefox Add-ons and install it to start using <Proton Pass> in your browser.
                        c('pass_signup_2023: Info')
                            .t`${PASS_APP_NAME} is available as a browser extension on Firefox Add-ons.`
                    )}
                </>
            ),
            cta: (
                <>
                    {getButton(client.link, getBrowserTitle(PASS_APP_NAME, client.title), () => onClickDownload(type))}
                    {skip}
                </>
            ),
            preload: getPreload(installExtension),
        };
    }

    if (isChrome() || isEdgeChromium() || isBrave()) {
        const client = clients[Clients.Chrome];
        const browserName = (() => {
            if (isEdgeChromium()) {
                return 'Edge';
            }
            if (isBrave()) {
                return 'Brave';
            }
            return client.title;
        })();
        const type = (() => {
            if (isEdgeChromium()) {
                return 'edge';
            }
            if (isBrave()) {
                return 'brave';
            }
            return 'chrome';
        })();
        return {
            type,
            title: c('pass_signup_2023: Info').t`Install ${PASS_APP_NAME}`,
            subTitle: '',
            content: (
                <>
                    {getContent(
                        installExtension,
                        // translator: full sentence is: Download the <Proton Pass> browser extension in the Chrome Web Store and install it to start using <Proton Pass> in your browser.
                        c('pass_signup_2023: Info')
                            .t`${PASS_APP_NAME} is available as a browser extension on the Chrome Web Store.`
                    )}
                </>
            ),
            cta: (
                <>
                    {getButton(client.link, getBrowserTitle(PASS_APP_NAME, browserName), () => onClickDownload(type))}
                    {skip}
                </>
            ),
            preload: getPreload(installExtension),
        };
    }

    const logos: { [key in Clients]?: string } = {
        [Clients.iOS]: appStore,
        [Clients.Chrome]: chrome,
        [Clients.Brave]: brave,
        [Clients.Firefox]: firefox,
        [Clients.Android]: playStore,
        [Clients.Safari]: safari,
    };

    const card = (clientType: Clients) => {
        const client = clients[clientType];
        const logo = logos[clientType];
        const type = getTelemetryClientType(clientType);
        return (
            <ButtonLike
                as={Href}
                href={client.link}
                size="large"
                shape="outline"
                className="flex-1 py-4"
                onClick={() => {
                    onClickDownload(type);
                }}
            >
                <div className="mb-2">
                    <img src={logo} alt={client.title} />
                </div>
                {getBrowserTitle(PASS_APP_NAME, client.title)}
            </ButtonLike>
        );
    };

    return {
        type: 'unknown',
        title: c('pass_signup_2023: Info').t`Install app and extension`,
        subTitle: c('pass_signup_2023: Info')
            .t`Download and install the relevant apps and extensions to start using ${PASS_APP_NAME}`,
        content: (
            <div className="flex flex-column gap-2">
                {!isSafari() && (
                    <div className="flex gap-2">
                        {[Clients.Android, Clients.iOS].map((client) => {
                            return card(client);
                        })}
                    </div>
                )}
                <div className="flex gap-2">
                    {[Clients.Chrome, Clients.Firefox].map((client) => {
                        return card(client);
                    })}
                </div>
                <div className="flex gap-2">
                    {[Clients.Brave, Clients.Safari].map((client) => {
                        return card(client);
                    })}
                </div>
            </div>
        ),
        cta: <>{skip}</>,
        preload: null,
    };
};

interface Props {
    onSkip: () => void;
    measure: Measure;
}

const InstallExtensionStep = ({ measure }: Props) => {
    const onceRef = useRef(false);
    /*
    const skip = (
        <Button size="large" color="norm" shape="ghost" fullWidth className="mt-2" onClick={onSkip}>
            {c('Action').t`Skip`}
        </Button>
    );
     */

    const { type, title, subTitle, cta, content } = getInfo(null, (type) => {
        if (onceRef.current) {
            return;
        }
        onceRef.current = true;
        measure({
            event: TelemetryAccountSignupEvents.interactDownload,
            dimensions: { click: `download_${type}` },
        }).then(() => {
            return measure({ event: TelemetryAccountSignupEvents.onboardFinish, dimensions: {} });
        });
    });

    useEffect(() => {
        measure({ event: TelemetryAccountSignupEvents.onboardShown, dimensions: { action_shown: `get_${type}` } });
    }, []);

    return (
        <Main>
            <Content>
                <Header center title={title} subTitle={subTitle} />
                {content}
                {cta}
            </Content>
        </Main>
    );
};

export default InstallExtensionStep;
