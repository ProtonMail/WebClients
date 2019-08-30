import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { LoginForm, Href } from 'react-components';

import SignInLayout from '../components/layout/SignInLayout';

const LoginContainer = ({ history, onLogin }) => {
    const handleLogin = (...args) => {
        history.push('/dashboard');
        onLogin(...args);
    };
    return (
        <SignInLayout
            title={c('Title').t`Log in`}
            support={
                <>
                    <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                        <Link to="/reset-password">{c('Link').t`Reset password`}</Link>
                    </div>
                    <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                        <Link to="/forgot-username">{c('Link').t`Forgot username?`}</Link>
                    </div>
                    <div className="inbl w100 pt0-5 pb0-5 ellipsis">
                        <Href url="https://protonvpn.com/support/login-problems/">{c('Link').t`Login problems`}</Href>
                    </div>
                </>
            }
        >
            <h2>{c('Title').t`User log in`}</h2>
            <LoginForm onLogin={handleLogin} />
        </SignInLayout>
    );
};

LoginContainer.propTypes = {
    history: PropTypes.object.isRequired,
    onLogin: PropTypes.func.isRequired
};

export default LoginContainer;
