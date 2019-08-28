import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { LoginForm, SimpleDropdown, DropdownMenu, Href } from 'react-components';

import SignInLayout from '../components/layout/SignInLayout';

const LoginContainer = ({ history, onLogin }) => {
    const handleLogin = (...args) => {
        history.push('/dashboard');
        onLogin(...args);
    };
    return (
        <SignInLayout title={c('Title').t`Log in`}>
            <LoginForm
                needHelp={
                    <SimpleDropdown content={c('Dropdown button').t`Need help?`} className="pm-button--link">
                        <DropdownMenu>
                            <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                                <Link to="/reset-password">{c('Link').t`Reset password`}</Link>
                            </div>
                            <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                                <Link to="/forgot-username">{c('Link').t`Forgot username?`}</Link>
                            </div>
                            <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                                <Href url="https://protonvpn.com/support/login-problems/">{c('Link')
                                    .t`Common login problems`}</Href>
                            </div>
                            <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                                <Href url="https://protonvpn.com/support/">{c('Link').t`Get support`}</Href>
                            </div>
                        </DropdownMenu>
                    </SimpleDropdown>
                }
                onLogin={handleLogin}
            />
        </SignInLayout>
    );
};

LoginContainer.propTypes = {
    history: PropTypes.object.isRequired,
    onLogin: PropTypes.func.isRequired
};

export default LoginContainer;
