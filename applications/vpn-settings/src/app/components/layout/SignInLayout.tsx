import React from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';

import { Title, Href, VpnLogo, ButtonLike, useAppTitle, FooterDetails, ProminentContainer } from '@proton/components';
import PublicHeader from './PublicHeader';
import VPNSupportDropdown from '../VPNSupportDropdown';

interface Props {
    children?: React.ReactNode;
    title?: string;
}

const SignInLayout = ({ children, title = '' }: Props) => {
    const staticURL = 'https://protonvpn.com';

    useAppTitle(title);

    return (
        <ProminentContainer className="pt1 pb1 pl2 pr2 scroll-if-needed">
            <PublicHeader
                left={
                    <>
                        <span className="color-weak mr1">{c('Label').t`Back to:`}</span>
                        <Href
                            url={staticURL}
                            className="inline-block text-no-decoration hover-same-color"
                            target="_self"
                        >
                            protonvpn.com
                        </Href>
                    </>
                }
                middle={
                    <Href url={staticURL} target="_self">
                        <VpnLogo className="fill-primary" />
                    </Href>
                }
                right={
                    <>
                        <div className="flex flex-justify-end">
                            <VPNSupportDropdown
                                color="norm"
                                shape="outline"
                                className="inline-flex flex-align-items-center"
                            />
                            <ButtonLike as={Link} color="norm" className="ml1 no-mobile no-tablet" to="/signup">{c(
                                'Link'
                            ).t`Sign up for free`}</ButtonLike>
                        </div>
                    </>
                }
            />
            <Title className="flex-item-noshrink text-center color-primary">{title}</Title>
            <div className="flex-item-fluid flex-item-noshrink flex flex-column flex-nowrap">
                <div className="flex flex-column flex-nowrap flex-item-noshrink">
                    <div className="center ui-standard bg-norm color-norm mt2 max-w40e w100 p2 bordered flex-item-noshrink">
                        {children}
                        <div className="w100 flex flex-justify-center flex-align-items-center flex-column mt1">
                            <span className="flex-item-noshrink">
                                <p className="text-bold">{c('Link').t`Don't have an account yet? Sign up for free!`}</p>
                            </span>
                            <ButtonLike as={Link} color="norm" className="ml1" to="/signup">{c('Link')
                                .t`Sign up for free`}</ButtonLike>
                        </div>
                    </div>
                </div>
                <footer className="opacity-50 flex-item-noshrink text-center pb1 mt1">
                    <FooterDetails link={<a href={staticURL}>ProtonVPN.com</a>} />
                </footer>
            </div>
        </ProminentContainer>
    );
};

export default SignInLayout;
