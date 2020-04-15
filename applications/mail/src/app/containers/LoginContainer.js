import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { LoginForm, Href, SimpleDropdown, DropdownMenu, SignInLayout } from 'react-components';

const LoginContainer = ({ stopRedirect, history, location, onLogin }) => {
    const handleLogin = (...args) => {
        stopRedirect();
        const { from } = location.state || {};
        if (from && from.pathname !== '/login') {
            history.push(from);
        } else {
            history.push('/inbox');
        }
        onLogin(...args);
    };
    return (
        <SignInLayout title={c('Title').t`Log in`}>
            <h2>{c('Title').t`User log in`}</h2>
            <LoginForm
                onLogin={handleLogin}
                needHelp={
                    <SimpleDropdown content={c('Dropdown button').t`Need help?`} className="pm-button--link">
                        <DropdownMenu>
                            <ul className="unstyled mt0 mb0">
                                <li className="dropDown-item">
                                    <Link className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1" to="/reset-password">
                                        {c('Link').t`Reset password`}
                                    </Link>
                                </li>
                                <li className="dropDown-item">
                                    <Link className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1" to="/forgot-username">
                                        {c('Link').t`Forgot username?`}
                                    </Link>
                                </li>
                                <li className="dropDown-item">
                                    <Href
                                        className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1"
                                        url="https://protonmail.com/support/knowledge-base/common-login-problems/"
                                    >
                                        {c('Link').t`Common login problems`}
                                    </Href>
                                </li>
                                <li className="dropDown-item">
                                    <Href
                                        className="dropDown-item-link bl pt0-5 pb0-5 pl1 pr1"
                                        url="https://protonmail.com/support/"
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
