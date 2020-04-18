import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { LoginForm, Href, SimpleDropdown, DropdownMenu, SignInLayout } from 'react-components';
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
            <LoginForm
                onLogin={handleLogin}
                needHelp={
                    <SimpleDropdown content={c('Dropdown button').t`Need help?`} className="pm-button--link">
                        <DropdownMenu>
                            <Link to="/reset-password" className="pr1 pl1 pt0-5 pb0-5 bl alignleft">{c('Link')
                                .t`Reset password`}</Link>
                            <Link to="/forgot-username" className="pr1 pl1 pt0-5 pb0-5 bl alignleft">{c('Link')
                                .t`Forgot username?`}</Link>
                            <Href
                                url="https://protonvpn.com/support/login-problems/"
                                className="pr1 pl1 pt0-5 pb0-5 bl alignleft"
                            >{c('Link').t`Common login problems`}</Href>
                            <Href url="https://protonvpn.com/support/" className="pr1 pl1 pt0-5 pb0-5 bl alignleft">{c(
                                'Link'
                            ).t`Contact support`}</Href>
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
