import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { VpnLogo, Title, Href } from 'react-components';
import SupportDropdown from '../header/SupportDropdown';

const SignInLayout = ({ children, title }) => {
    useEffect(() => {
        document.title = `${title} - ProtonVPN`;
    }, []);

    return (
        <>
            <header className="flex-item-noshrink flex flex-items-center noprint mb2">
                <div className="nomobile flex-item-fluid">
                    <span className="opacity-50">{c('Label').t`Back to:`}</span>{' '}
                    <Href
                        url="https://protonvpn.com"
                        className="inbl color-white nodecoration hover-same-color"
                        target="_self"
                    >{c('Link').t`protonvpn.com`}</Href>
                </div>
                <div className="w150p center">
                    <VpnLogo className="fill-primary" />
                </div>
                <div className="nomobile flex-item-fluid alignright">
                    <SupportDropdown className="pv-button-greenborder-dark" />
                    <Link className="ml1 notablet pm-button--primary" to="/signup">{c('Link')
                        .t`Sign up for free`}</Link>
                </div>
            </header>
            <Title className="flex-item-noshrink aligncenter color-primary">{title}</Title>
            <div className="flex-item-fluid flex-item-noshrink flex flex-column flex-nowrap">
                <div className="flex flex-column flex-nowrap flex-item-noshrink">
                    <div className="center bg-white color-global-grey mt2 mw40e w100 p2 bordered-container flex-item-noshrink">
                        {children}
                    </div>
                    <p className="aligncenter flex-item-noshrink">
                        <Link className="bold nodecoration primary-link" to="/signup">{c('Link')
                            .t`Don't have an account yet? Sign up for free!`}</Link>
                    </p>
                </div>
                <footer className="opacity-50 mtauto flex-item-noshrink aligncenter pb1">{c('Footer')
                    .t`2019 ProtonVPN.com - Made globally, hosted in Switzerland.`}</footer>
            </div>
        </>
    );
};

SignInLayout.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    support: PropTypes.node
};

export default SignInLayout;
