import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { LoginForm, Href, SimpleDropdown, DropdownMenu, SignInLayout } from 'react-components';

const LoginContainer = ({ stopRedirect, history, onLogin }) => {
    const handleLogin = (...args) => {
        stopRedirect();
        history.push('/inbox');
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
                            <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                                <Link to="/reset-password">{c('Link').t`Reset password`}</Link>
                            </div>
                            <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                                <Link to="/forgot-username">{c('Link').t`Forgot username?`}</Link>
                            </div>
                            <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                                <Href url="https://protonmail.com/support/knowledge-base/common-login-problems/">{c(
                                    'Link'
                                ).t`Common login problems`}</Href>
                            </div>
                            <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                                <Href url="https://protonmail.com/support/">{c('Link').t`Contact support`}</Href>
                            </div>
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
