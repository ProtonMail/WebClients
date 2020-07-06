import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { MinimalLoginContainer, Href, SimpleDropdown, DropdownMenu, SignInLayout } from 'react-components';
import { isMember } from 'proton-shared/lib/user/helpers';

const LoginContainer = ({ stopRedirect, history, onLogin }) => {
    const handleLogin = (...args) => {
        stopRedirect();

        const [{ User }] = args;

        if (isMember(User)) {
            history.push('/account');
        } else {
            history.push('/dashboard');
        }

        onLogin(...args);
    };
    return (
        <SignInLayout title={c('Title').t`Log in`}>
            <h2>{c('Title').t`User log in`}</h2>
            <MinimalLoginContainer
                onLogin={handleLogin}
                needHelp={
                    <SimpleDropdown content={c('Dropdown button').t`Need help?`} className="pm-button--link">
                        <DropdownMenu>
                            <ul className="unstyled mt0 mb0">
                                <li className="dropDown-item">
                                    <Link to="/reset-password" className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1">
                                        {c('Link').t`Reset password`}
                                    </Link>
                                </li>
                                <li className="dropDown-item">
                                    <Link to="/forgot-username" className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1">
                                        {c('Link').t`Forgot username?`}
                                    </Link>
                                </li>
                                <li className="dropDown-item">
                                    <Href
                                        url="https://protonvpn.com/support/login-problems/"
                                        className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1"
                                    >
                                        {c('Link').t`Common login problems`}
                                    </Href>
                                </li>
                                <li className="dropDown-item">
                                    <Href
                                        url="https://protonvpn.com/support/"
                                        className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1"
                                    >
                                        {c('Link').t`Contact support`}
                                    </Href>
                                </li>
                            </ul>
                        </DropdownMenu>
                    </SimpleDropdown>
                }
            />
        </SignInLayout>
    );
};

LoginContainer.propTypes = {
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    onLogin: PropTypes.func.isRequired,
    stopRedirect: PropTypes.func.isRequired
};

export default LoginContainer;
