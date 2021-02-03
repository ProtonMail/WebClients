import React from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';

import { Title, Href, VpnLogo, MailLogo } from '../../components';
import { useConfig, useAppTitle } from '../../hooks';

import SupportDropdown from '../heading/SupportDropdown';
import FooterDetails from './FooterDetails';
import PublicHeader from './PublicHeader';

interface Props {
    children?: React.ReactNode;
    title?: string;
}

const SignInLayout = ({ children, title = '' }: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const domain = isVPN ? 'protonvpn.com' : 'protonmail.com';
    const staticURL = `https://${domain}`;

    useAppTitle(title);

    return (
        <div className="pt1 pb1 pl2 pr2">
            <PublicHeader
                left={
                    <>
                        <span className="opacity-50 mr1">{c('Label').t`Back to:`}</span>
                        <Href
                            url={staticURL}
                            className="inline-block color-white text-no-decoration hover-same-color"
                            target="_self"
                        >
                            {domain}
                        </Href>
                    </>
                }
                middle={
                    <Href url={staticURL} target="_self">
                        {isVPN ? <VpnLogo className="fill-primary" /> : <MailLogo className="fill-primary" />}
                    </Href>
                }
                right={
                    <>
                        <div className="flex flex-justify-end">
                            <SupportDropdown className="button--primaryborder-dark inline-flex flex-align-items-center" />
                            <Link className="ml1 no-mobile no-tablet button--primary" to="/signup">{c('Link')
                                .t`Sign up for free`}</Link>
                        </div>
                    </>
                }
            />
            <Title className="flex-item-noshrink text-center color-primary">{title}</Title>
            <div className="flex-item-fluid flex-item-noshrink flex flex-column flex-nowrap">
                <div className="flex flex-column flex-nowrap flex-item-noshrink">
                    <div className="center bg-white color-global-grey mt2 max-w40e w100 p2 bordered-container flex-item-noshrink">
                        {children}
                        <div className="w100 flex flex-justify-center flex-align-items-center flex-column mt1">
                            <span className="flex-item-noshrink">
                                <p className="text-bold">{c('Link').t`Don't have an account yet? Sign up for free!`}</p>
                            </span>
                            <Link className="ml1 button--primary" to="/signup">{c('Link').t`Sign up for free`}</Link>
                        </div>
                    </div>
                </div>
                <footer className="opacity-50 flex-item-noshrink text-center pb1 mt1">
                    <FooterDetails link={<a href={staticURL}>{isVPN ? 'ProtonVPN.com' : 'ProtonMail.com'}</a>} />
                </footer>
            </div>
        </div>
    );
};

export default SignInLayout;
