import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { Title } from 'react-components';

import PublicHeader from './PublicHeader';

const year = new Date().getFullYear();

const SignInLayout = ({ children, title }) => {
    useEffect(() => {
        document.title = `${title} - ProtonMail`;
    }, []);

    return (
        <div className="pt1 pb1 pl2 pr2">
            <PublicHeader
                action={
                    <>
                        <div className="flex flex-justify-end">
                            {/* <SupportDropdown className="pm-button--primaryborder-dark" /> */}
                            <Link className="ml1 notablet pm-button--primary" to="/signup">{c('Link')
                                .t`Sign up for free`}</Link>
                        </div>
                    </>
                }
            />
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
                <footer className="opacity-50 mtauto flex-item-noshrink aligncenter pb1">
                    {year} <a href="https://protonmail.com">ProtonMail.com</a> -{' '}
                    {c('Footer').t`Made globally, hosted in Switzerland.`}
                </footer>
            </div>
        </div>
    );
};

SignInLayout.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    support: PropTypes.node
};

export default SignInLayout;
