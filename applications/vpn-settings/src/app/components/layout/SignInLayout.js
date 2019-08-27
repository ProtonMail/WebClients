import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { VpnLogo, Title, Href } from 'react-components';

const SignInLayout = ({ children, title }) => {
    useEffect(() => {
        document.title = `${title} - ProtonVPN`;
    }, []);

    return (
        <>
            <header className="flex flex-nowrap flex-spacebetween">
                <Href url="https://protonvpn.com" target="_self">{c('Link').t`Back to protonvpn.com`}</Href>
                <Link className="pv-button-greenborder" to="/signup">{c('Link').t`Sign up for free`}</Link>
            </header>
            <div className="aligncenter">
                <VpnLogo />
                <Title>{title}</Title>
            </div>
            <div className="mauto w400e mw100 p2 bg-white flex-item-noshrink">{children}</div>
            <div className="aligncenter">
                <Link className="pm-button--link bold" to="/signup">{c('Link')
                    .t`Don't have an account yet? Sign up for free!`}</Link>
            </div>
            <footer className="aligncenter">{c('Footer')
                .t`2019 ProtonVPN.com - Made globally, hosted in Switzerland.`}</footer>
        </>
    );
};

SignInLayout.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired
};

export default SignInLayout;
