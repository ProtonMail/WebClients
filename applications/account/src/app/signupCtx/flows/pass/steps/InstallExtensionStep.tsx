import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { Icon } from '@proton/components';
import { getExtensionSupportedBrowser } from '@proton/pass/lib/extension/utils/browser';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isFirefox, isSafari } from '@proton/shared/lib/helpers/browser';
import { Clients, clients } from '@proton/shared/lib/pass/constants';

import browserImage from '../assets/images/browser.svg';
import { Layout } from '../components/Layout/Layout';

type Props = {
    onContinue: () => Promise<void>;
};

export const InstallExtensionStep: FC<Props> = ({ onContinue }) => {
    const browser = useMemo(() => {
        const supportedBrowser = getExtensionSupportedBrowser();

        if (supportedBrowser) {
            return clients[supportedBrowser];
        }
        if (isSafari()) {
            return clients[Clients.Safari];
        }
        if (isFirefox()) {
            return clients[Clients.Firefox];
        }

        return null;
    }, []);

    const platforms = [
        clients[Clients.iOS],
        clients[Clients.Android],
        clients[Clients.Windows],
        clients[Clients.Linux],
        clients[Clients.macOS],
    ];

    return (
        <Layout>
            <img src={browserImage} alt="Browser icon" />
            <h2 className="text-4xl text-bold my-5 text-center">{c('Title').t`Secure your passwords. Everywhere.`}</h2>
            {browser && (
                <ButtonLike as="a" target="_blank" size="large" color="norm" pill href={browser.link}>
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
                        <Icon name={platform.icon} size={11} color="var(--text-weak)" />
                        <span className="text-lg mt-1">{platform.title}</span>
                    </ButtonLike>
                ))}
            </div>
        </Layout>
    );
};
