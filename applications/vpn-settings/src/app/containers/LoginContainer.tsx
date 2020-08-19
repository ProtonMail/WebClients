import React from 'react';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import {
    MinimalLoginContainer,
    Href,
    SimpleDropdown,
    DropdownMenu,
    SignInLayout,
    OnLoginCallback
} from 'react-components';
import { isMember } from 'proton-shared/lib/user/helpers';

interface Props {
    onLogin: OnLoginCallback;
}

const LoginContainer = ({ onLogin }: Props) => {
    return (
        <SignInLayout title={c('Title').t`Log in`}>
            <h2>{c('Title').t`User log in`}</h2>
            <MinimalLoginContainer
                onLogin={(data) => {
                    const { User } = data;
                    const path = User && isMember(User) ? '/account' : '/dashboard';
                    return onLogin({ ...data, path });
                }}
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

export default LoginContainer;
